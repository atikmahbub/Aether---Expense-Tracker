import { useState, useCallback, useEffect } from 'react';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import { ICreateCategoryParams, IUpdateCategoryParams } from '@trackingPortal/api/params';
import { UserId } from '@trackingPortal/api/primitives';
import Toast from 'react-native-toast-message';

export type CategoryType = 'expense' | 'income';

export const useCategories = (selectedType: CategoryType) => {
  const { apiGateway, currentUser, refreshCategories } = useStoreContext();
  const [categories, setCategories] = useState<(ExpenseCategoryModel | IncomeCategoryModel)[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!currentUser.userId || currentUser.default) return;
    
    setLoading(true);
    try {
      let data: (ExpenseCategoryModel | IncomeCategoryModel)[] = [];
      if (selectedType === 'expense') {
        data = await apiGateway.categoryService.getExpenseCategories(currentUser.userId);
      } else {
        data = await apiGateway.categoryService.getIncomeCategories(currentUser.userId);
      }
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Toast.show({ type: 'error', text1: 'Failed to fetch categories' });
    } finally {
      setLoading(false);
    }
  }, [selectedType, currentUser.userId, currentUser.default, apiGateway.categoryService]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (params: Omit<ICreateCategoryParams, 'userId'>) => {
    if (!currentUser.userId) return;
    try {
      const payload = { ...params, userId: currentUser.userId };
      if (selectedType === 'expense') {
        await apiGateway.categoryService.createExpenseCategory(payload);
      } else {
        await apiGateway.categoryService.createIncomeCategory(payload);
      }
      await fetchCategories();
      await refreshCategories({ force: true });
      Toast.show({ type: 'success', text1: 'Category created' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to create category' });
      throw error;
    }
  };

  const updateCategory = async (id: string, params: Omit<IUpdateCategoryParams, 'userId'>) => {
    if (!currentUser.userId) return;
    try {
      const payload = { ...params, userId: currentUser.userId };
      if (selectedType === 'expense') {
        await apiGateway.categoryService.updateExpenseCategory(id, payload);
      } else {
        await apiGateway.categoryService.updateIncomeCategory(id, payload);
      }
      await fetchCategories();
      await refreshCategories({ force: true });
      Toast.show({ type: 'success', text1: 'Category updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update category' });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser.userId) return;
    try {
      if (selectedType === 'expense') {
        await apiGateway.categoryService.deleteExpenseCategory(id, currentUser.userId);
      } else {
        await apiGateway.categoryService.deleteIncomeCategory(id, currentUser.userId);
      }
      await fetchCategories();
      await refreshCategories({ force: true });
      Toast.show({ type: 'success', text1: 'Category deleted' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to delete category' });
      throw error;
    }
  };

  return {
    categories,
    loading,
    refresh: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
