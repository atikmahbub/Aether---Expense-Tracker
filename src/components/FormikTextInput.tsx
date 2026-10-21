import React, { useMemo } from 'react';
import {TextInput, TextInputProps} from 'react-native-paper';
import {useField} from 'formik';
import {View, Text, StyleSheet} from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

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
  autoFocus,
  ...props
}) => {
  const { colors } = useAppTheme();
  const { translateText } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [field, meta] = useField(name);
  const inputRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <View style={styles.container}>
      {/* Label sits above the field: Paper's floating label notches the
          outline with a translucent fill, so the border showed through it. */}
      {typeof label === 'string' && label.length > 0 && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        ref={inputRef}
        mode={mode}
        label={typeof label === 'string' ? undefined : label}
        value={field.value}
        onChangeText={field.onChange(name)}
        onBlur={field.onBlur(name)}
        keyboardType={keyboardType as any}
        multiline={multiline}
        numberOfLines={multiline ? minRows : undefined}
        style={[styles.input, multiline && {height: minRows * 20}]}
        outlineStyle={styles.outline}
        outlineColor={colors.groupBorder}
        activeOutlineColor={colors.chipActiveBg}
        textColor={colors.sheetText}
        placeholderTextColor={colors.textMuted}
        contentStyle={styles.content}
        theme={{
          roundness: 18,
          colors: {
            background: colors.groupBg,
            onSurfaceVariant: colors.textMuted,
          },
        }}
        {...props}
      />
      {meta.touched && meta.error && (
        <Text style={styles.errorText}>{translateText(meta.error)}</Text>
      )}
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 8,
      color: colors.textMuted,
      fontFamily: designTokens.font.semibold,
      fontSize: 12,
      letterSpacing: 0.96,
      textTransform: 'uppercase',
    },
    input: {
      fontSize: 16,
      backgroundColor: colors.groupBg,
    },
    outline: {
      borderRadius: 18,
      borderWidth: 1,
    },
    content: {
      fontFamily: designTokens.font.regular,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });
}

export default FormikTextInput;
