import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiGateway } from "@trackingPortal/api/implementations";
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
import { getCountryData } from "country-currency-utils";
import React, { createContext, useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

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
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const apiGateway = new ApiGateway();

interface NewUserModel extends UserModel {
  default: boolean;
}

const defaultUser: NewUserModel = {
  name: "Admin",
  email: "admin@gmail.com",
  userId: "admin" as UserId,
  profilePicture: "link" as URLString,
  created: makeUnixTimestampString(Number(new Date())),
  updated: makeUnixTimestampString(Number(new Date())),
  default: true,
};

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user: auth0User } = useAuth();

  const [currentUser, setCurrentUser] = useState<NewUserModel>(defaultUser);
  const [currency, setCurrency] =
    useState<CurrencyPreference>(DEFAULT_CURRENCY);

  const [categories, setCategories] =
    useState<ExpenseCategoryModel[]>(FALLBACK_CATEGORIES);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<ExpenseCategoryModel[]>([]);
  const [incomeCategoryLoading, setIncomeCategoryLoading] = useState(false);
  const [isCategoryHydrated, setIsCategoryHydrated] = useState(false);

  useEffect(() => {
    if (token) {
      apiGateway.ajaxUtils.setAccessToken(token);
      addUserToDb();
    }
  }, [auth0User, token]);

  useEffect(() => {
    hydrateCurrencyPreference();
    if (token) {
      refreshCategories({ force: true });
    }
  }, [token]);

  useEffect(() => {
    if (!currentUser.default && currentUser.userId !== 'admin') {
      refreshCategories({ force: true });
    }
  }, [currentUser.userId, currentUser.default]);

  useEffect(() => {
    if (!currentUser.default && currentUser.userId && currentUser.userId !== 'admin') {
      fetchIncomeCategories(currentUser.userId);
    }
  }, [currentUser.userId, currentUser.default]);

  const refreshCategories = async (options?: { force?: boolean }) => {
    if (isCategoryHydrated && !options?.force) return;

    setCategoryLoading(true);

    try {
      const response = await apiGateway.categoryService.getExpenseCategories(currentUser.userId);

      const normalized = response
        .map((c) => ({
          ...c,
          icon: normalizeCategoryIcon(c.icon),
        }))
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
    } catch (error) {
      console.log("category error", error);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchIncomeCategories = async (userId: UserId) => {
    setIncomeCategoryLoading(true);
    try {
      const response = await apiGateway.categoryService.getIncomeCategories(userId);
      const normalized = response.map((c) => ({
        ...c,
        icon: normalizeCategoryIcon(c.icon),
      }));
      setIncomeCategories(normalized);
    } catch (error) {
      console.log("income category error", error);
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

  const addUserToDb = async () => {
    try {
      if (!auth0User?.sub) return;

      const params: IAddUserParams = {
        userId: UserId(auth0User.sub as string),
        name: auth0User.name as string,
        profilePicture: URLString(auth0User.picture as string),
        email: auth0User.email as string,
      };

      const user = await apiGateway.userService.addUser(params);
      setCurrentUser({ ...user, default: false });
    } catch {
      Toast.show({ type: "error", text1: "Something went wrong!" });
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
