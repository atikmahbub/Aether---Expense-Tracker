import React, { useMemo, useState } from 'react';
import {Menu, Button} from 'react-native-paper';
import {View, StyleSheet, Platform, StyleProp, ViewStyle, Text, TouchableOpacity} from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import {BlurView} from 'expo-blur';
import {MaterialCommunityIcons} from '@expo/vector-icons';

interface TwMenuProps {
  options: {label: string; value: any}[];
  onSelect: (value: any) => void;
  buttonLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: any;
  compact?: boolean;
}

const TwMenu: React.FC<TwMenuProps> = ({
  options,
  onSelect,
  buttonLabel = 'Select Option',
  containerStyle,
  buttonStyle,
  compact = false,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        anchor={compact ? (
          <TouchableOpacity
            onPress={openMenu}
            activeOpacity={0.75}
            style={[styles.compactAnchor, buttonStyle]}>
            <Text style={[styles.menuLabel, styles.menuLabelCompact]}>
              {buttonLabel}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={15}
              color={colors.subText}
            />
          </TouchableOpacity>
        ) : (
          <Button
            mode="contained-tonal"
            onPress={openMenu}
            style={[styles.menuButton, buttonStyle]}
            labelStyle={[styles.menuLabel, compact && styles.menuLabelCompact]}
            contentStyle={[styles.menuContent, compact && styles.menuContentCompact]}
            uppercase={false}
            icon="chevron-down">
            {buttonLabel}
          </Button>
        )}>
        <View style={styles.menuBackdrop} pointerEvents="none">
          {Platform.OS === 'ios' && (
            <BlurView
              style={StyleSheet.absoluteFillObject}
              intensity={20}
            />
          )}
          <View style={styles.menuTint} />
        </View>
        {options.map(option => (
          <Menu.Item
            key={option.value}
            onPress={() => handleSelect(option.value)}
            title={option.label}
            style={compact ? styles.menuItemCompact : undefined}
            titleStyle={compact ? styles.menuItemLabelCompact : undefined}
          />
        ))}
      </Menu>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
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
      fontFamily: 'Manrope_600SemiBold',
    },
    menuLabelCompact: {
      fontSize: 11,
      letterSpacing: 0.2,
      marginHorizontal: 0,
    },
    compactAnchor: {
      height: 34,
      minHeight: 34,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingLeft: 14,
      paddingRight: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    menuContentCompact: {
      height: 34,
      minHeight: 34,
      paddingHorizontal: 4,
      paddingVertical: 0,
    },
    menuItemCompact: {
      height: 42,
      minHeight: 42,
    },
    menuItemLabelCompact: {
      fontSize: 13,
      fontFamily: 'Manrope_600SemiBold',
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
}

export default TwMenu;
