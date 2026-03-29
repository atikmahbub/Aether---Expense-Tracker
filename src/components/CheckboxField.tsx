import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {Checkbox} from 'react-native-paper';
import {useField} from 'formik';
import {darkTheme} from '@trackingPortal/themes/darkTheme';
import {colors} from '@trackingPortal/themes/colors';

interface FormikCheckboxFieldProps {
  name: string;
  label: string;
}

const FormikCheckboxField: React.FC<FormikCheckboxFieldProps> = ({
  name,
  label,
}) => {
  const [field, meta, helpers] = useField(name);

  const handleChange = () => {
    helpers.setValue(!field.value);
  };

  return (
    <View style={styles.container}>
      <Checkbox.Item
        label={label}
        status={field.value ? 'checked' : 'unchecked'}
        onPress={handleChange}
        labelStyle={styles.label}
        mode="ios"
        style={styles.checkbox}
      />
      {meta.touched && meta.error && (
        <Text style={styles.errorText}>{meta.error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
  },
  checkbox: {
    backgroundColor: darkTheme.colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default FormikCheckboxField;
