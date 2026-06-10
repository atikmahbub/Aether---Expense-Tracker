import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { decodeToken, isTokenExpired } from "@trackingPortal/utils/tokenUtils";
import { authStorage } from "./authStorage";

WebBrowser.maybeCompleteAuthSession();

/* ================= CONFIG ================= */

const LOGGED_IN_ROUTE = "/(tabs)/transactions";
const LOGIN_ROUTE = "/login";

const getExtra = () => Constants?.expoConfig?.extra ?? {};

const getConfigValue = (key: string, fallback = ""): string => {
  const extra = getExtra();
  const value = extra?.[key];
  return typeof value === "string" ? value : fallback;
};

const AUTH0_DOMAIN = getConfigValue("auth0Domain");
const AUTH0_CLIENT_ID = getConfigValue("auth0ClientId");
const AUTH0_AUDIENCE = getConfigValue("auth0Audience");

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "aether",
  path: "auth/callback",
});

/* ================= TYPES ================= */

type UserProfile = Record<string, unknown> | null;

type AuthContextType = {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
  retrySession: () => Promise<void>;
  token: string | null;
  user: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  /** True when tokens exist in storage but a transient network error prevented refresh. NavigationBoundary should not redirect to login in this state. */
  refreshFailed: boolean;
};

const AUTH_SCOPES = ["openid", "profile", "email", "offline_access"];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= HELPERS ================= */

const fetchUserInfo = async (token: string) => {
  const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch user");

  return response.json();
};

/* ================= PROVIDER ================= */

export const Auth0ProviderWithHistory = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const refreshPromise = useRef<Promise<string | null> | null>(null);
  const appState = useRef(AppState.currentState);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const discovery = AuthSession.useAutoDiscovery(`https://${AUTH0_DOMAIN}`);

  /* ================= ACTIONS ================= */

  const logout = useCallback(async () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    await authStorage.clearAll();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    router.replace(LOGIN_ROUTE);
  }, [router]);

  /* ================= AUTH REQUEST ================= */

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      scopes: AUTH_SCOPES,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      redirectUri,
      extraParams: {
        ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
        connection: "google-oauth2",
        prompt: "select_account",
      },
    },
    discovery,
  );

  /* ================= REFRESH LOGIC ================= */

  const refreshAccessTokenRef = useRef<(storedRefreshToken: string) => Promise<string | null>>(
    async () => null,
  );

  const scheduleProactiveRefresh = useCallback((accessToken: string) => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    const decoded = decodeToken(accessToken);
    if (!decoded?.exp) return;

    const refreshInMs = Math.max(
      (decoded.exp - 300) * 1000 - Date.now(),
      30_000,
    );

    refreshTimer.current = setTimeout(async () => {
      const storedRefreshToken = await authStorage.getRefreshToken();
      if (storedRefreshToken) {
        await refreshAccessTokenRef.current(storedRefreshToken);
      }
    }, refreshInMs);
  }, []);

  const refreshAccessToken = useCallback(async (storedRefreshToken: string): Promise<string | null> => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      if (!discovery?.tokenEndpoint) {
        console.warn("⚠️ Auth discovery not ready for refresh");
        return null;
      }

      try {
        console.log("🔄 Attempting to refresh access token...");
        const tokenResponse = await AuthSession.refreshAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            refreshToken: storedRefreshToken,
            scopes: AUTH_SCOPES,
            extraParams: {
              ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
            },
          },
          { tokenEndpoint: discovery.tokenEndpoint }
        );

        if (tokenResponse.accessToken) {
          console.log("✅ Token refreshed successfully");
          await authStorage.saveTokens(
            tokenResponse.accessToken,
            tokenResponse.refreshToken || storedRefreshToken,
          );
          setToken(tokenResponse.accessToken);
          setIsAuthenticated(true);
          scheduleProactiveRefresh(tokenResponse.accessToken);
          return tokenResponse.accessToken;
        }

        console.warn("⚠️ Refresh response missing access token");
      } catch (e: unknown) {
        console.error("❌ Token refresh failed:", e);
        const message =
          e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
        const code = (e as any)?.code?.toLowerCase?.() ?? "";

        // Auth0 returns the OAuth error code in `e.code`; the human-readable
        // message never contains the literal "invalid_grant" string.
        const isInvalidGrant =
          code === "invalid_grant" ||
          message.includes("invalid_grant") ||
          message.includes("unknown or invalid refresh token") ||
          message.includes("refresh token is invalid") ||
          message.includes("token is expired") ||
          message.includes("token has been revoked");

        if (isInvalidGrant) {
          // Before logging out, verify the stored refresh token is still the
          // same one we just tried — a mid-save crash during rotation can leave
          // a stale token that triggers invalid_grant on the next cold start.
          const currentStored = await authStorage.getRefreshToken();
          if (currentStored && currentStored !== storedRefreshToken) {
            console.warn("⚠️ Stale refresh token detected, retrying with latest...");
            refreshPromise.current = null;
            return refreshAccessTokenRef.current(currentStored);
          }
          console.warn("⚠️ Refresh token invalid or expired. Logging out.");
          await logout();
        }
        // Network / server error — NOT an auth failure. Return null so the caller
        // can decide; do NOT log out. Tokens remain in storage for the next attempt.
      } finally {
        refreshPromise.current = null;
      }
      return null;
    })();

    return refreshPromise.current;
  }, [discovery, logout, scheduleProactiveRefresh]);

  refreshAccessTokenRef.current = refreshAccessToken;

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      return token;
    }

    const storedToken = await authStorage.getAccessToken();
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setIsAuthenticated(true);
      return storedToken;
    }

    const storedRefreshToken = await authStorage.getRefreshToken();
    if (storedRefreshToken) {
      const refreshed = await refreshAccessToken(storedRefreshToken);
      if (refreshed) setIsAuthenticated(true);
      return refreshed;
    }

    setIsAuthenticated(false);
    return null;
  }, [token, refreshAccessToken]);

  const syncProfile = useCallback(async (tokenToUse: string) => {
    try {
      const profile = await fetchUserInfo(tokenToUse);
      setUser(profile);
      await authStorage.saveProfile(profile);
    } catch (e) {
      console.error("❌ Profile sync failed:", e);
    }
  }, []);

  /* ================= APP LIFECYCLE ================= */

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const validToken = await getValidToken();
        if (validToken) {
          setIsAuthenticated(true);
          scheduleProactiveRefresh(validToken);
          syncProfile(validToken);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [getValidToken, syncProfile, scheduleProactiveRefresh]);

  /* ================= RESTORE SESSION ================= */

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const cachedProfile = await authStorage.getProfile();
        if (!cancelled && cachedProfile) setUser(cachedProfile);

        const validToken = await getValidToken();
        if (!cancelled) {
          if (validToken) {
            setIsAuthenticated(true);
            setRefreshFailed(false);
            scheduleProactiveRefresh(validToken);
            syncProfile(validToken);
          } else {
            const hasSession = await authStorage.hasSession();
            setRefreshFailed(hasSession);
            setIsAuthenticated(false);
          }
        }
      } catch (e) {
        console.error("❌ Bootstrap error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (discovery) bootstrap();

    return () => {
      cancelled = true;
    };
  }, [discovery, getValidToken, syncProfile, scheduleProactiveRefresh]);

  /* ================= HANDLE LOGIN RESPONSE ================= */

  useEffect(() => {
    const handleAuth = async () => {
      if (response?.type !== "success") return;

      try {
        if (!request?.codeVerifier) throw new Error("Missing codeVerifier");
        if (!discovery?.tokenEndpoint) throw new Error("Auth discovery not ready");

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: response.params.code,
            redirectUri,
            scopes: AUTH_SCOPES,
            extraParams: {
              code_verifier: request.codeVerifier,
              ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
            },
          },
          { tokenEndpoint: discovery.tokenEndpoint },
        );

        const { accessToken, refreshToken } = tokenResponse;
        if (!accessToken) throw new Error("No access token");

        if (!refreshToken) {
          console.error(
            "❌ Auth0 returned no refresh token. In Auth0 Dashboard: enable Refresh Token grant on your Native app AND 'Allow Offline Access' on API.",
          );
        }

        await authStorage.saveTokens(accessToken, refreshToken);
        setToken(accessToken);
        setIsAuthenticated(true);
        setRefreshFailed(false);
        scheduleProactiveRefresh(accessToken);

        const profile = await fetchUserInfo(accessToken);
        setUser(profile);
        await authStorage.saveProfile(profile);

        router.replace(LOGGED_IN_ROUTE);
      } catch (e) {
        console.error("❌ Token exchange error:", e);
      }
    };

    handleAuth();
  }, [response, discovery, request, router, scheduleProactiveRefresh]);

  /* ================= RETRY SESSION ================= */

  const retrySession = useCallback(async () => {
    setLoading(true);
    setRefreshFailed(false);
    try {
      const validToken = await getValidToken();
      if (validToken) {
        setIsAuthenticated(true);
        scheduleProactiveRefresh(validToken);
        syncProfile(validToken);
      } else {
        const hasSession = await authStorage.hasSession();
        if (hasSession) {
          setRefreshFailed(true);
          setIsAuthenticated(false);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [getValidToken, scheduleProactiveRefresh, syncProfile]);

  /* ================= LOGIN ACTION ================= */

  const login = async () => {
    if (!request) return;
    await promptAsync();
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, getValidToken, retrySession, token, user, loading, isAuthenticated, refreshFailed }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside provider");
  return ctx;
};
