import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import React, { useMemo } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { designTokens } from '@trackingPortal/themes/designTokens';
import { LoadingSquares } from '@trackingPortal/components/ScalarLoadingMarks';

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
      activeOpacity={0.78}
    >
      {loading ? (
        <View accessibilityLabel={`${label}, loading`} style={styles.loader}>
          <LoadingSquares color={colors.onBrand} />
        </View>
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

export default LoadingButton;

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    buttonContainer: {
      backgroundColor: colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: designTokens.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: designTokens.controlHeight,
      shadowColor: colors.primary,
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    buttonText: {
      color: colors.background,
      fontWeight: '800',
      fontSize: 15,
      textAlign: 'center',
    },
    loader: {
      minHeight: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
