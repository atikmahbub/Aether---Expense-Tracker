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
} from "@trackingPortal/screens/ExpenseScreen/ExpenseScreen.constants";
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
  refreshCategories: (options?: { force?: boolean }) => Promise<void>;
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
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      apiGateway.ajaxUtils.setAccessToken(token);
      addUserToDb();
    }
  }, [auth0User, token]);

  useEffect(() => {
    hydrateCurrencyPreference();
    refreshCategories();
  }, []);

  const refreshCategories = async (options?: { force?: boolean }) => {
    if (categories.length > FALLBACK_CATEGORIES.length && !options?.force) {
      return;
    }
    setCategoryLoading(true);
    try {
      const response = await apiGateway.expenseService.getCategories();
      const normalized = response
        .map((category) => ({
          ...category,
          icon: normalizeCategoryIcon(category.icon),
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
    } catch (error) {
      console.log("Failed to fetch categories", error);
      if (categories.length === 0) setCategories(FALLBACK_CATEGORIES);
    } finally {
      setCategoryLoading(false);
    }
  };

  const hydrateCurrencyPreference = async () => {
    try {
      const savedCode = await AsyncStorage.getItem(CURRENCY_PREFERENCE_KEY);
      if (savedCode) {
        const matched = findCurrencyByCode(savedCode);
        if (matched) {
          setCurrency(matched);
          return;
        }
      }
      await hydrateCurrencyFromLocation();
    } catch (error) {
      console.log("Failed to hydrate currency preference", error);
    }
  };

  const hydrateCurrencyFromLocation = async () => {
    try {
      const response = await fetch(`https://ipinfo.io?token=${IPINFO_TOKEN}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const countryData = await getCountryData(data.country);
      const matched = findCurrencyByCode(countryData?.currencyCode);
      if (matched) {
        setCurrency(matched);
        return;
      }
      setCurrency(DEFAULT_CURRENCY);
    } catch (error) {
      console.error("Error fetching country code:", error);
      setCurrency(DEFAULT_CURRENCY);
    }
  };

  const setCurrencyPreference = async (nextCurrency: CurrencyPreference) => {
    setCurrency(nextCurrency);
    try {
      await AsyncStorage.setItem(
        CURRENCY_PREFERENCE_KEY,
        nextCurrency.code.toUpperCase(),
      );
    } catch (error) {
      console.log("Failed to persist currency preference", error);
    }
  };

  const addUserToDb = async () => {
    try {
      if (
        !auth0User?.name ||
        !auth0User?.email ||
        !auth0User.picture ||
        !auth0User.sub
      )
        return;

      const params: IAddUserParams = {
        userId: UserId(auth0User.sub as string),
        name: auth0User.name as string,
        profilePicture: URLString(auth0User.picture as string),
        email: auth0User.email as string,
      };
      const user = await apiGateway.userService.addUser(params);
      setCurrentUser({
        ...user,
        default: false,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong!",
      });
    }
  };

  const contextValues = React.useMemo(
    (): StoreContextType => ({
      currentUser,
      apiGateway,
      currency,
      setCurrencyPreference,
      categories,
      categoryLoading,
      refreshCategories,
    }),
    [
      currentUser,
      currency,
      categories,
      categoryLoading,
      refreshCategories,
      setCurrencyPreference,
    ],
  );

  return (
    <StoreContext.Provider value={contextValues}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStoreContext must be used within a StoreProvider");
  }
  return context;
};
