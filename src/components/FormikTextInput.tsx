import React from 'react';
import {TextInput, TextInputProps} from 'react-native-paper';
import {useField} from 'formik';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '@trackingPortal/themes/colors';

interface FormikTextInputProps extends TextInputProps {
  name: string;
  multiline?: boolean;
  minRows?: number;
}

const FormikTextInput: React.FC<FormikTextInputProps> = ({
  name,
  label,
  keyboardType = 'default',
  mode = 'outlined',
  multiline = false,
  minRows = 3,
  ...props
}) => {
  const [field, meta] = useField(name);

  return (
    <View style={styles.container}>
      <TextInput
        mode={mode}
        label={label}
        value={field.value}
        onChangeText={field.onChange(name)}
        onBlur={field.onBlur(name)}
        keyboardType={keyboardType as any}
        multiline={multiline}
        numberOfLines={multiline ? minRows : undefined}
        style={[styles.input, multiline && {height: minRows * 20}]}
        {...props}
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
  input: {
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default FormikTextInput;
