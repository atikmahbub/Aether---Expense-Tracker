import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGateway } from "@trackingPortal/api/apiGatewayInstance";
import { IApiGateWay } from "@trackingPortal/api/interfaces";
import { ExpenseCategoryModel, UserModel } from "@trackingPortal/api/models";
import { IAddUserParams } from "@trackingPortal/api/params";
import {
  makeUnixTimestampString,
  URLString,
  UserId,
} from "@trackingPortal/api/primitives";
import { useAuth } from "@trackingPortal/auth/Auth0ProviderWithHistory";
import {
  CURRENCY_PREFERENCE_KEY,
  CurrencyPreference,
  DEFAULT_CURRENCY,
  findCurrencyByCode,
} from "@trackingPortal/constants/currency";
import {
  FALLBACK_CATEGORIES,
  normalizeCategoryIcon,
} from "@trackingPortal/screens/TransactionScreen/TransactionScreen.constants";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import { getCountryData } from "country-currency-utils";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const IPINFO_TOKEN = process.env.EXPO_PUBLIC_IPINFO_TOKEN;
const PRIORITY_ORDER = ["Groceries", "Food", "Kids", "Health"];

type StoreContextType = {
  apiGateway: IApiGateWay;
  currentUser: NewUserModel;
  currency: CurrencyPreference;
  setCurrencyPreference: (currency: CurrencyPreference) => Promise<void>;
  categories: ExpenseCategoryModel[];
  categoryLoading: boolean;
  isCategoryHydrated: boolean;
  refreshCategories: (options?: { force?: boolean }) => Promise<void>;
  incomeCategories: ExpenseCategoryModel[];
  incomeCategoryLoading: boolean;
  /** Categories the user hid from the add-entry picker (this device only). */
  hiddenCategoryIds: string[];
  toggleCategoryHidden: (categoryId: string) => Promise<void>;
  /** Adds last month's remaining to this month. Off by default; synced with the user. */
  carryOverEnabled: boolean;
  setCarryOverEnabled: (enabled: boolean) => Promise<void>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface NewUserModel extends UserModel {
  default: boolean;
}

const unsetUser = (): NewUserModel => ({
  name: "",
  email: "",
  userId: "" as UserId,
  profilePicture: "" as URLString,
  created: makeUnixTimestampString(0),
  updated: makeUnixTimestampString(0),
  default: true,
});

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { getValidToken, token, user: auth0User, isAuthenticated } = useAuth();
  const { repositories, ready: dbReady } = useDatabase();

  const [currentUser, setCurrentUser] = useState<NewUserModel>(unsetUser);
  const [currency, setCurrency] =
    useState<CurrencyPreference>(DEFAULT_CURRENCY);

  const [categories, setCategories] =
    useState<ExpenseCategoryModel[]>(FALLBACK_CATEGORIES);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<ExpenseCategoryModel[]>([]);
  const [incomeCategoryLoading, setIncomeCategoryLoading] = useState(false);
  const [isCategoryHydrated, setIsCategoryHydrated] = useState(false);
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
  const hiddenKey = `hiddenCategoryIds:${currentUser.userId}`;
  const [carryOverEnabled, setCarryOverState] = useState(false);
  // The local copy keeps the toggle working offline; the pending flag marks a
  // change the server hasn't accepted yet, pushed on the next reconcile.
  const carryOverKey = (userId: string) => `carryOverEnabled:${userId}`;
  const carryOverPendingKey = (userId: string) => `carryOverPending:${userId}`;

  useEffect(() => {
    if (!dbReady || !repositories || !currentUser.userId) {
      setCarryOverState(false);
      return;
    }
    repositories.settings
      .get(carryOverKey(currentUser.userId))
      .then((raw) => setCarryOverState(raw === "true"))
      .catch(() => setCarryOverState(false));
  }, [dbReady, repositories, currentUser.userId]);

  const setCarryOverEnabled = useCallback(
    async (enabled: boolean) => {
      const userId = currentUser.userId;
      setCarryOverState(enabled);
      if (!userId) return;
      await repositories?.settings.set(carryOverKey(userId), String(enabled));
      await repositories?.settings.set(carryOverPendingKey(userId), "true");
      try {
        await apiGateway.userService.updateUser({
          userId,
          carryOverEnabled: enabled,
        });
        await repositories?.settings.remove(carryOverPendingKey(userId));
      } catch (error) {
        console.log("carry over sync deferred", error);
      }
    },
    [currentUser.userId, repositories],
  );

  // Hidden categories are a local display preference, kept per user in the
  // settings table; nothing about the category itself changes.
  useEffect(() => {
    if (!dbReady || !repositories || !currentUser.userId) {
      setHiddenCategoryIds([]);
      return;
    }
    repositories.settings
      .get(hiddenKey)
      .then((raw) => setHiddenCategoryIds(raw ? JSON.parse(raw) : []))
      .catch(() => setHiddenCategoryIds([]));
  }, [dbReady, repositories, hiddenKey, currentUser.userId]);

  const toggleCategoryHidden = useCallback(
    async (categoryId: string) => {
      const next = hiddenCategoryIds.includes(categoryId)
        ? hiddenCategoryIds.filter((id) => id !== categoryId)
        : [...hiddenCategoryIds, categoryId];
      setHiddenCategoryIds(next);
      await repositories?.settings.set(hiddenKey, JSON.stringify(next));
    },
    [hiddenCategoryIds, hiddenKey, repositories],
  );

  useEffect(() => {
    apiGateway.ajaxUtils.setTokenProvider(getValidToken);
  }, [getValidToken]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setCurrentUser(unsetUser());
      setIsCategoryHydrated(false);
      setCategories(FALLBACK_CATEGORIES);
      setIncomeCategories([]);
      return;
    }

    addUserToDb();
  }, [auth0User, token, isAuthenticated, dbReady]);

  useEffect(() => {
    hydrateCurrencyPreference();
    if (token && !currentUser.default && currentUser.userId) {
      refreshCategories({ force: true });
    }
  }, [token, currentUser.userId, currentUser.default, dbReady]);

  useEffect(() => {
    if (!currentUser.default && currentUser.userId) {
      fetchIncomeCategories(currentUser.userId);
    }
  }, [currentUser.userId, currentUser.default, dbReady]);

  // Categories are sourced from SQLite (offline-first). When online we
  // opportunistically refresh the local cache from the cloud first, then always
  // read the result back from SQLite so the UI works identically offline.
  const refreshCategories = async (options?: { force?: boolean }) => {
    if (currentUser.default || !currentUser.userId) return;
    if (isCategoryHydrated && !options?.force) return;
    // A forced refresh follows a category edit, which may be an income one —
    // refresh that list too or the entry form keeps showing the stale icon.
    if (options?.force) void fetchIncomeCategories(currentUser.userId).catch(() => {});

    const repo = repositories?.categories;
    setCategoryLoading(true);

    try {
      try {
        const response = await apiGateway.categoryService.getExpenseCategories(
          currentUser.userId,
        );
        if (repo) {
          for (const c of response) {
            await repo.upsertFromServer({ ...c, kind: "expense" });
          }
        }
      } catch (error) {
        // Offline or API error — fall back to whatever SQLite already holds.
        console.log("category refresh (cloud) skipped", error);
      }

      const local = repo ? await repo.getByKind("expense") : [];
      const source: ExpenseCategoryModel[] = local.length
        ? local.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon ?? "",
            color: c.color ?? "",
            userId: c.userId,
          }))
        : FALLBACK_CATEGORIES;

      const normalized = source
        .map((c) => ({ ...c, icon: normalizeCategoryIcon(c.icon) }))
        .sort((a, b) => {
          const indexA = PRIORITY_ORDER.indexOf(a.name);
          const indexB = PRIORITY_ORDER.indexOf(b.name);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });

      setCategories(normalized);
      setIsCategoryHydrated(true);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchIncomeCategories = async (userId: UserId) => {
    const repo = repositories?.categories;
    setIncomeCategoryLoading(true);
    try {
      try {
        const response = await apiGateway.categoryService.getIncomeCategories(userId);
        if (repo) {
          for (const c of response) {
            await repo.upsertFromServer({ ...c, kind: "income" });
          }
        }
      } catch (error) {
        console.log("income category refresh (cloud) skipped", error);
      }

      const local = repo ? await repo.getByKind("income") : [];
      const normalized = local.map((c) => ({
        id: c.id,
        name: c.name,
        icon: normalizeCategoryIcon(c.icon ?? ""),
        color: c.color ?? "",
        userId: c.userId,
      }));
      setIncomeCategories(normalized);
    } finally {
      setIncomeCategoryLoading(false);
    }
  };

  const hydrateCurrencyPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(CURRENCY_PREFERENCE_KEY);
      if (saved) {
        const matched = findCurrencyByCode(saved);
        if (matched) {
          setCurrency(matched);
          return;
        }
      }
      await hydrateCurrencyFromLocation();
    } catch {}
  };

  const hydrateCurrencyFromLocation = async () => {
    try {
      const res = await fetch(`https://ipinfo.io?token=${IPINFO_TOKEN}`);
      const data = await res.json();
      const countryData = await getCountryData(data.country);
      const matched = findCurrencyByCode(countryData?.currencyCode);
      setCurrency(matched || DEFAULT_CURRENCY);
    } catch {
      setCurrency(DEFAULT_CURRENCY);
    }
  };

  const setCurrencyPreference = async (next: CurrencyPreference) => {
    setCurrency(next);
    await AsyncStorage.setItem(
      CURRENCY_PREFERENCE_KEY,
      next.code.toUpperCase(),
    );
  };

  /** Pushes an offline toggle change, otherwise adopts the server's value. */
  const reconcileCarryOver = async (user: UserModel) => {
    const userId = user.userId;
    if (!repositories) return;
    try {
      const pending = await repositories.settings.get(carryOverPendingKey(userId));
      if (pending) {
        const local = (await repositories.settings.get(carryOverKey(userId))) === "true";
        await apiGateway.userService.updateUser({ userId, carryOverEnabled: local });
        await repositories.settings.remove(carryOverPendingKey(userId));
      } else if (typeof user.carryOverEnabled === "boolean") {
        setCarryOverState(user.carryOverEnabled);
        await repositories.settings.set(carryOverKey(userId), String(user.carryOverEnabled));
      }
    } catch (error) {
      console.log("carry over reconcile skipped", error);
    }
  };

  const addUserToDb = async () => {
    if (!auth0User?.sub) return;

    // Offline-first: the Auth0 `sub` IS the userId used everywhere, so derive the
    // identity from the token immediately. This makes the app fully usable
    // offline (no network round-trip needed to know who the user is).
    const localUser: NewUserModel = {
      userId: UserId(auth0User.sub as string),
      name: (auth0User.name as string) ?? "",
      email: (auth0User.email as string) ?? "",
      profilePicture: URLString((auth0User.picture as string) ?? ""),
      created: makeUnixTimestampString(0),
      updated: makeUnixTimestampString(0),
      default: false,
    };
    setCurrentUser(localUser);

    try {
      await repositories?.users.upsertFromServer({
        userId: localUser.userId,
        name: localUser.name,
        email: localUser.email,
        profilePicture: localUser.profilePicture,
      });
    } catch (error) {
      console.log("persist local user failed", error);
    }

    // Reconcile with the server when reachable. On failure (offline) we keep the
    // token-derived identity — never downgrade back to the default user.
    try {
      const params: IAddUserParams = {
        userId: UserId(auth0User.sub as string),
        name: auth0User.name as string,
        profilePicture: URLString(auth0User.picture as string),
        email: auth0User.email as string,
      };
      const user = await apiGateway.userService.addUser(params);
      setCurrentUser({ ...user, default: false });
      await repositories?.users.upsertFromServer(user);
      await reconcileCarryOver(user);
    } catch (error) {
      console.log("user sync (cloud) skipped", error);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        apiGateway,
        currency,
        setCurrencyPreference,
        categories,
        categoryLoading,
        isCategoryHydrated,
        refreshCategories,
        incomeCategories,
        incomeCategoryLoading,
        hiddenCategoryIds,
        carryOverEnabled,
        setCarryOverEnabled,
        toggleCategoryHidden,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("Must use inside provider");
  return context;
};
