import React, {useState} from 'react';
import {Menu, Button} from 'react-native-paper';
import {View, StyleSheet, Platform, StyleProp, ViewStyle} from 'react-native';
import {colors} from '@trackingPortal/themes/colors';
import {BlurView} from 'expo-blur';

interface TwMenuProps {
  options: {label: string; value: any}[];
  onSelect: (value: any) => void;
  buttonLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const TwMenu: React.FC<TwMenuProps> = ({
  options,
  onSelect,
  buttonLabel = 'Select Option',
  containerStyle,
}) => {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (value: any) => {
    onSelect(value);
    closeMenu();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        contentStyle={styles.menuSurface}
        anchor={
          <Button
            mode="contained-tonal"
            onPress={openMenu}
            style={styles.menuButton}
            labelStyle={styles.menuLabel}
            contentStyle={styles.menuContent}
            uppercase={false}
            icon="chevron-down">
            {buttonLabel}
          </Button>
        }>
        <View style={styles.menuBackdrop} pointerEvents="none">
          {Platform.OS === 'ios' && (
            <BlurView
              style={StyleSheet.absoluteFillObject}
              // blurAmount={20}
              // reducedTransparencyFallbackColor={colors.surfaceAlt}
            />
          )}
          <View style={styles.menuTint} />
        </View>
        {options.map(option => (
          <Menu.Item
            key={option.value}
            onPress={() => handleSelect(option.value)}
            title={option.label}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
  menuContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.text,
  },
  menuSurface: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  menuTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
});

export default TwMenu;
