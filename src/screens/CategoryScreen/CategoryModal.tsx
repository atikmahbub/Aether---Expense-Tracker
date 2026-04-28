import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@trackingPortal/themes/colors';
import BaseBottomSheet from '@trackingPortal/components/BaseBottomSheet';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import LoadingButton from '@trackingPortal/components/LoadingButton';

const AVAILABLE_ICONS = [
  'silverware-fork-knife', 'cart', 'car-sports', 'file-document', 'shopping', 
  'gamepad-variant', 'heart-pulse', 'airplane', 'repeat', 'home-variant', 
  'book-open-page-variant', 'account', 'gift', 'account-group', 'dots-horizontal',
  'transit-connection-horizontal', 'bank', 'cash-multiple', 'piggy-bank', 'wallet',
  'laptop', 'phone', 'coffee', 'medical-bag', 'umbrella'
];

const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#1DD3B0', '#FFA500', '#9B5DE5', 
  '#FFB347', '#E63946', '#00B4D8', '#6D597A', '#2A9D8F',
  '#264653', '#F4A261', '#E76F51', '#8AB17D', '#ADB5BD'
];

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string }) => Promise<void>;
  initialData: ExpenseCategoryModel | IncomeCategoryModel | null;
  existingNames: string[];
}

const CategoryModal = ({ visible, onClose, onSave, initialData, existingNames }: CategoryModalProps) => {
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Required')
      .test('unique', 'Name already exists', (value) => {
        if (!value) return true;
        const normalized = value.toLowerCase().trim();
        if (initialData && initialData.name.toLowerCase() === normalized) return true;
        return !existingNames.includes(normalized);
      }),
    icon: Yup.string().required('Required'),
    color: Yup.string().required('Required'),
  });

  return (
    <BaseBottomSheet 
      index={visible ? 0 : -1} 
      onClose={onClose}
      snapPoints={['85%']}
    >
      <View style={styles.container}>
        <Text style={styles.modalTitle}>
          {initialData ? 'Edit Category' : 'New Category'}
        </Text>

        <Formik
          initialValues={{
            name: initialData?.name || '',
            icon: initialData?.icon || 'shape',
            color: initialData?.color || '#FF6B6B',
          }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            await onSave(values);
          }}
          enableReinitialize
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue, isSubmitting }) => (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Name</Text>
                <TextInput
                  mode="flat"
                  placeholder="e.g. Netflix, Gym, etc."
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  error={touched.name && !!errors.name}
                  style={styles.input}
                  textColor={colors.text}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  activeUnderlineColor={colors.primary}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconPickerItem,
                        values.icon === icon && styles.selectedItem,
                        { backgroundColor: values.icon === icon ? `${values.color}20` : 'rgba(255,255,255,0.05)' }
                      ]}
                      onPress={() => setFieldValue('icon', icon)}
                    >
                      <MaterialCommunityIcons 
                        name={icon} 
                        size={24} 
                        color={values.icon === icon ? values.color : 'rgba(255,255,255,0.4)'} 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {AVAILABLE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorPickerItem,
                        values.color === color && styles.selectedColorItem,
                        { backgroundColor: color }
                      ]}
                      onPress={() => setFieldValue('color', color)}
                    >
                      {values.color === color && (
                        <MaterialCommunityIcons name="check" size={16} color="#000" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.footer}>
                <LoadingButton
                  loading={isSubmitting}
                  onPress={() => handleSubmit()}
                  label="Save Category"
                  style={styles.saveButton}
                  textStyle={styles.saveButtonText}
                />
              </View>
            </View>
          )}
        </Formik>
      </View>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginTop: 4,
  },
  pickerScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  iconPickerItem: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorPickerItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItem: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedColorItem: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  footer: {
    marginTop: 12,
  },
  saveButton: {
    borderRadius: 20,
    height: 60,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default CategoryModal;
