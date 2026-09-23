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
          <LoadingSquares color={colors.primaryButtonInk} />
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
      backgroundColor: colors.primaryButtonBg,
      paddingVertical: 13,
      paddingHorizontal: 22,
      borderRadius: designTokens.radius.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    buttonText: {
      color: colors.primaryButtonInk,
      fontFamily: designTokens.font.semibold,
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
