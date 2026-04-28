import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { isTokenExpired } from "@trackingPortal/utils/tokenUtils";
import { authStorage } from "./authStorage";

WebBrowser.maybeCompleteAuthSession();

/* ================= CONFIG ================= */

const LOGGED_IN_ROUTE = "/(tabs)/transactions";
const LOGIN_ROUTE = "/login";

/* ===== READ FROM app.json ===== */
const getExtra = () => Constants?.expoConfig?.extra ?? {};

const getConfigValue = (key: string, fallback = ""): string => {
  const extra = getExtra();
  const value = extra?.[key];
  return typeof value === "string" ? value : fallback;
};

const AUTH0_DOMAIN = getConfigValue("auth0Domain");
const AUTH0_CLIENT_ID = getConfigValue("auth0ClientId");
const AUTH0_AUDIENCE = getConfigValue("auth0Audience");

/* 🚀 REDIRECT URI */
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
  token: string | null;
  user: UserProfile;
  loading: boolean;
};

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
  
  const refreshPromise = useRef<Promise<string | null> | null>(null);
  const appState = useRef(AppState.currentState);

  const discovery = AuthSession.useAutoDiscovery(`https://${AUTH0_DOMAIN}`);

  /* ================= ACTIONS ================= */

  const logout = useCallback(async () => {
    await authStorage.clearAll();
    setToken(null);
    setUser(null);
    router.replace(LOGIN_ROUTE);
  }, [router]);

  /* ================= AUTH REQUEST ================= */

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      scopes: ["openid", "profile", "email", "offline_access"],
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

  const refreshAccessToken = async (storedRefreshToken: string): Promise<string | null> => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      if (!discovery?.tokenEndpoint) return null;

      try {
        const tokenResponse = await AuthSession.refreshAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            refreshToken: storedRefreshToken,
          },
          { tokenEndpoint: discovery.tokenEndpoint }
        );

        if (tokenResponse.accessToken) {
          await authStorage.saveTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
          setToken(tokenResponse.accessToken);
          return tokenResponse.accessToken;
        }
      } catch (e) {
        console.error("❌ Token refresh failed:", e);
        await logout();
      } finally {
        refreshPromise.current = null;
      }
      return null;
    })();

    return refreshPromise.current;
  };

  const getValidToken = useCallback(async (): Promise<string | null> => {
    // 1. Proactive check state
    if (token && !isTokenExpired(token)) return token;

    // 2. Check storage
    const storedToken = await authStorage.getAccessToken();
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      return storedToken;
    }

    // 3. Try refreshing
    const storedRefreshToken = await authStorage.getRefreshToken();
    if (storedRefreshToken) {
      return await refreshAccessToken(storedRefreshToken);
    }

    return null;
  }, [token, discovery, logout]);

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
        // App has come to the foreground, proactively check/refresh token
        const validToken = await getValidToken();
        if (validToken) {
          syncProfile(validToken); // Background sync profile
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [getValidToken, syncProfile]);

  /* ================= RESTORE SESSION ================= */

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const cachedProfile = await authStorage.getProfile();
        if (cachedProfile) setUser(cachedProfile);

        const validToken = await getValidToken();
        if (validToken) {
          syncProfile(validToken); // Refresh profile in background
        }
      } catch (e) {
        console.error("❌ Bootstrap error:", e);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    if (discovery) bootstrap();
  }, [discovery, getValidToken, syncProfile, logout]);

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
            extraParams: { code_verifier: request.codeVerifier },
          },
          { tokenEndpoint: discovery.tokenEndpoint },
        );

        const { accessToken, refreshToken } = tokenResponse;
        if (!accessToken) throw new Error("No access token");

        await authStorage.saveTokens(accessToken, refreshToken);
        setToken(accessToken);
        
        const profile = await fetchUserInfo(accessToken);
        setUser(profile);
        await authStorage.saveProfile(profile);

        router.replace(LOGGED_IN_ROUTE);
      } catch (e) {
        console.error("❌ Token exchange error:", e);
      }
    };

    handleAuth();
  }, [response, discovery, request, router]);

  /* ================= LOGIN ACTION ================= */

  const login = async () => {
    if (!request) return;
    await promptAsync();
  };

  return (
    <AuthContext.Provider value={{ login, logout, getValidToken, token, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside provider");
  return ctx;
};
