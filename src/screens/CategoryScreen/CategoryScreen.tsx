import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { colors } from '@trackingPortal/themes/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCategories, CategoryType } from '@trackingPortal/hooks/useCategories';
import CategoryItem from '@trackingPortal/screens/CategoryScreen/CategoryItem';
import CategoryModal from '@trackingPortal/screens/CategoryScreen/CategoryModal';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import { useNavigation } from 'expo-router';
import TransactionSegmentedControl from '@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl';

const CategoryScreen = () => {
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState<CategoryType>('expense');
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories(selectedType);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryModel | IncomeCategoryModel | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setModalVisible(true);
  };

  const handleEdit = (category: ExpenseCategoryModel | IncomeCategoryModel) => {
    if (category.userId === null) {
      Alert.alert('System Category', 'This is a system default category and cannot be edited.');
      return;
    }
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleDelete = (item: ExpenseCategoryModel | IncomeCategoryModel) => {
    if (item.userId === null) {
      Alert.alert('System Category', 'Default categories cannot be deleted.');
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCategory(item.id)
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ExpenseCategoryModel | IncomeCategoryModel }) => (
    <CategoryItem 
      item={item} 
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={{ width: 32 }} />
      </View>

      <TransactionSegmentedControl
        options={['expense', 'income']}
        selectedOption={selectedType}
        onOptionPress={(option) => setSelectedType(option as CategoryType)}
        containerStyle={styles.segmentedControl}
      />

      {loading && categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons name="tag-off-outline" size={64} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>No categories yet</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAdd}
        color="#000"
      />

      <CategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          if (editingCategory) {
            await updateCategory(editingCategory.id, data);
          } else {
            await createCategory(data);
          }
          setModalVisible(false);
        }}
        initialData={editingCategory}
        existingNames={categories.map(c => c.name.toLowerCase())}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  segmentedControl: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 32,
    backgroundColor: colors.primary,
    borderRadius: 28,
  },
});

export default CategoryScreen;
