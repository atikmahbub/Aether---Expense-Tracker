import {FlatList, StyleSheet, View} from 'react-native';
import React, {Fragment, useEffect, useState} from 'react';
import {RefreshControl, ScrollView} from 'react-native-gesture-handler';
import LoanSummary from '@trackingPortal/screens/LoanScreen/LoanSummary';
import LoanList from '@trackingPortal/screens/LoanScreen/LoanList';
import {AnimatedFAB} from 'react-native-paper';
import {LoanModel} from '@trackingPortal/api/models';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import Toast from 'react-native-toast-message';
import LoanCreation from '@trackingPortal/screens/LoanScreen/LoanCreation';
import {LoanType} from '@trackingPortal/api/enums';
import {AnimatedLoader} from '@trackingPortal/components';
import {withHaptic} from '@trackingPortal/utils/haptic';
import {colors} from '@trackingPortal/themes/colors';

export default function LoanScreen() {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false);
  const [hideFabIcon, setHideFabIcon] = useState<boolean>(false);
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const {currentUser: user, apiGateway} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (!user.default) {
      getUserLoans();
    }
  }, [user]);

  const getUserLoans = async () => {
    try {
      setLoading(true);
      const response = await apiGateway.loanServices.getLoanByUserId(
        user.userId,
      );
      setLoans(response);
    } catch (error) {
      console.log('error', error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalGiven = loans?.reduce((acc, crr): number => {
    if (crr.loanType === LoanType.GIVEN) {
      acc += crr.amount;
    }
    return acc;
  }, 0);

  const totalBorrowed = loans?.reduce((acc, crr): number => {
    if (crr.loanType === LoanType.TAKEN) {
      acc += crr.amount;
    }
    return acc;
  }, 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getUserLoans();
    setRefreshing(false);
  };

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        keyExtractor={(item, index) => `${item.id || index}`}
        ListHeaderComponent={
          <LoanSummary totalGiven={totalGiven} totalBorrowed={totalBorrowed} />
        }
        ListFooterComponent={
          <LoanList
            notifyRowOpen={value => setHideFabIcon(value)}
            loans={loans}
            getUserLoan={getUserLoans}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={null}
        contentContainerStyle={styles.listContent}
      />
      <LoanCreation
        getUserLoans={getUserLoans}
        openCreationModal={openCreationModal}
        setOpenCreationModal={setOpenCreationModal}
      />
      <AnimatedFAB
        extended={false}
        visible={!hideFabIcon}
        icon={'plus'}
        animateFrom={'right'}
        iconMode={'static'}
        label="Add New"
        color={colors.background}
        style={styles.fabStyle}
        onPress={() =>
          withHaptic(() => {
            setOpenCreationModal(true);
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fabStyle: {
    bottom: 3,
    right: 24,
    position: 'absolute',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 12},
    elevation: 10,
  },
  listContent: {
    paddingBottom: 180,
    paddingTop: 8,
  },
});
