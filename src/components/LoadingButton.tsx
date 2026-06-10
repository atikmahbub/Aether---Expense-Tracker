import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

interface ILoadingButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  loading: boolean;
  label: string;
  style?: any;
  textStyle?: any;
}

const LoadingButton: React.FC<ILoadingButtonProps> = ({
  onPress,
  label,
  loading,
  style,
  textStyle,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.buttonContainer, style]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.background}
          style={styles.loader}
        />
      )}
    </TouchableOpacity>
  );
};

export default LoadingButton;

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    buttonContainer: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    buttonText: {
      color: colors.background,
      fontWeight: '700',
      fontSize: 16,
      textAlign: 'center',
    },
    loader: {
      marginLeft: 8,
    },
  });
}
