import React, { useMemo } from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {Checkbox} from 'react-native-paper';
import {useField} from 'formik';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

interface FormikCheckboxFieldProps {
  name: string;
  label: string;
}

const FormikCheckboxField: React.FC<FormikCheckboxFieldProps> = ({
  name,
  label,
}) => {
  const { colors, paperTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, paperTheme), [colors, paperTheme]);
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

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors'], paperTheme: ReturnType<typeof useAppTheme>['paperTheme']) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      color: colors.text,
    },
    checkbox: {
      backgroundColor: paperTheme.colors.background,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });
}

export default FormikCheckboxField;
