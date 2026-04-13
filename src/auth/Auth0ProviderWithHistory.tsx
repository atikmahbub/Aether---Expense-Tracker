import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

/* ================= CONFIG ================= */

const ACCESS_TOKEN_KEY = "auth_access_token";
const PROFILE_CACHE_KEY = "auth_profile_cache";

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

console.log("👉 redirectUri:", redirectUri);

/* ================= TYPES ================= */

type UserProfile = Record<string, unknown> | null;

type AuthContextType = {
  login: () => Promise<void>;
  logout: () => Promise<void>;
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

  const discovery = AuthSession.useAutoDiscovery(`https://${AUTH0_DOMAIN}`);

  /* ================= AUTH REQUEST ================= */

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      redirectUri,
      extraParams: {
        ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
        connection: "google-oauth2",
        prompt: "select_account",
        max_age: "0",
      },
    },
    discovery,
  );

  /* ================= RESTORE SESSION ================= */

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

        if (!storedToken) return;

        const profile = await fetchUserInfo(storedToken);

        setToken(storedToken);
        setUser(profile);
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  /* ================= HANDLE LOGIN RESPONSE ================= */

  useEffect(() => {
    const handleAuth = async () => {
      if (response?.type !== "success") return;

      try {
        if (!request?.codeVerifier) {
          throw new Error("Missing codeVerifier");
        }

        if (!discovery?.tokenEndpoint) {
          throw new Error("Auth discovery is not ready");
        }

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: response.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          { tokenEndpoint: discovery.tokenEndpoint },
        );

        const accessToken = tokenResponse.accessToken;

        if (!accessToken) throw new Error("No access token");

        const profile = await fetchUserInfo(accessToken);

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);

        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));

        setToken(accessToken);
        setUser(profile);

        router.replace(LOGGED_IN_ROUTE);
      } catch (e) {
        console.error("❌ Token exchange error:", e);
      }
    };

    handleAuth();
  }, [response]);

  /* ================= ACTIONS ================= */

  const login = async () => {
    if (!request) return;
    await promptAsync();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    setToken(null);
    setUser(null);
    router.replace(LOGIN_ROUTE);
  };

  return (
    <AuthContext.Provider value={{ login, logout, token, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside provider");
  return ctx;
};
