import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import LoanCreation from "@trackingPortal/screens/LoanScreen/LoanCreation";
import LoanList from "@trackingPortal/screens/LoanScreen/LoanList";
import LoanSummary from "@trackingPortal/screens/LoanScreen/LoanSummary";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { withHaptic } from "@trackingPortal/utils/haptic";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, InteractionManager, StyleSheet, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useIsFocused } from "@react-navigation/native";

export default function LoanScreen() {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false);
  const [hideFabIcon, setHideFabIcon] = useState<boolean>(false);
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const { currentUser: user, apiGateway } = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const handleOpenCreationModal = useCallback(() => {
    withHaptic(() => {
      InteractionManager.runAfterInteractions(() => setOpenCreationModal(true));
    });
  }, []);

  useEffect(() => {
    const listener = () => {
      if (isFocused) {
        handleOpenCreationModal();
      }
    };
    eventEmitter.on(EVENTS.OPEN_CREATION_MODAL, listener);
    return () => {
      eventEmitter.off(EVENTS.OPEN_CREATION_MODAL, listener);
    };
  }, [isFocused, handleOpenCreationModal]);

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
      console.log("error", error);
      Toast.show({
        type: "error",
        text1: "Something went wrong!",
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

  if (loading && loans.length === 0) {
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
            notifyRowOpen={(value) => setHideFabIcon(value)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingBottom: 180,
    paddingTop: 8,
  },
});
