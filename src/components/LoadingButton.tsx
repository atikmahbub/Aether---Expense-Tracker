import { colors } from '@trackingPortal/themes/colors';
import React from 'react';
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
}

const LoadingButton: React.FC<ILoadingButtonProps> = ({
  onPress,
  label,
  loading,
}) => {
  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
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

const styles = StyleSheet.create({
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
