import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const PROFILE_CACHE_KEY = "auth_profile_cache";

// API access tokens can exceed SecureStore's 2048-byte Android limit.
// Keep the long-lived refresh token in SecureStore; access token in AsyncStorage.
export const authStorage = {
  async saveTokens(accessToken: string, refreshToken?: string) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async getAccessToken() {
    const fromAsync = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (fromAsync) return fromAsync;

    // Migrate tokens saved by older builds that used SecureStore for access tokens.
    const legacy = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (legacy) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, legacy);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }
    return legacy;
  },

  async getRefreshToken() {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async hasSession() {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);
    return Boolean(accessToken || refreshToken);
  },

  async saveProfile(profile: any) {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  },

  async getProfile() {
    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  },

  async clearAll() {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  },
};
