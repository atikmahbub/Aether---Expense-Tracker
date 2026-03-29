import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import React from 'react';
import {colors} from '@trackingPortal/themes/colors';

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
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  loader: {
    marginLeft: 10,
  },
});
