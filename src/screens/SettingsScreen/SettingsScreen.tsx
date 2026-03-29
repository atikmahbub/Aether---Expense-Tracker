import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState} from 'react';
import {Text} from 'react-native-paper';
import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader} from '@trackingPortal/components';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors} from '@trackingPortal/themes/colors';
import {SUPPORTED_CURRENCIES} from '@trackingPortal/constants/currency';

export default function SettingsScreen() {
  const {logout, loading} = useAuth();
  const {currency, setCurrencyPreference} = useStoreContext();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>PREFERENCES</Text>
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.selectorRow}
          activeOpacity={0.85}
          onPress={() => setCurrencyModalVisible(true)}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='cash-multiple'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>CURRENCY</Text>
              <Text
                style={
                  styles.detailValue
                }>{`${currency.symbol} ${currency.code}`}</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name='chevron-right'
            size={22}
            color='#4f555c'
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.8}
        onPress={() => logout()}>
        <View style={styles.logoutLeft}>
          <View style={styles.logoutIconWrapper}>
            <MaterialCommunityIcons name="logout" size={20} color="#ff8e8b" />
          </View>
          <View>
            <Text style={styles.logoutLabel}>Log out</Text>
            <Text style={styles.logoutHint}>See you soon</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#4f555c"
        />
      </TouchableOpacity>

      <Modal
        visible={currencyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCurrencyModalVisible(false)}>
        <TouchableWithoutFeedback
          onPress={() => setCurrencyModalVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Choose Currency</Text>
          {SUPPORTED_CURRENCIES.map(option => {
            const selected = option.code === currency.code;
            return (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.currencyOption,
                  selected && styles.currencyOptionActive,
                ]}
                activeOpacity={0.85}
                onPress={async () => {
                  await setCurrencyPreference(option);
                  setCurrencyModalVisible(false);
                }}>
                <View style={styles.currencyOptionLeft}>
                  <View style={styles.currencySymbolBadge}>
                    <Text style={styles.currencySymbolText}>
                      {option.symbol}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.currencyName}>{option.name}</Text>
                    <Text style={styles.currencyCode}>{option.code}</Text>
                  </View>
                </View>
                {selected ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={colors.primary}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
    gap: 16,
  },
  sectionHeader: {
    color: '#a0aab5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  cardContainer: {
    backgroundColor: '#16191d',
    borderRadius: 28,
    padding: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectorRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  detailLabel: {
    color: '#8a929a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#16191d',
    borderRadius: 36,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoutIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 142, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 139, 0.2)',
  },
  logoutLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  logoutHint: {
    color: '#8a929a',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    backgroundColor: colors.overlay,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginTop: 'auto',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  currencyOptionActive: {
    backgroundColor: 'rgba(161, 250, 255, 0.08)',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbolBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  currencyName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  currencyCode: {
    color: colors.subText,
    fontSize: 12,
    letterSpacing: 1,
  },
});
