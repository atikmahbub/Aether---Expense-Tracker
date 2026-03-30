import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import LoanCreation from "@trackingPortal/screens/LoanScreen/LoanCreation";
import LoanList from "@trackingPortal/screens/LoanScreen/LoanList";
import LoanSummary from "@trackingPortal/screens/LoanScreen/LoanSummary";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { triggerSuccessHaptic } from "@trackingPortal/utils/haptic";
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View, Platform } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useNetwork } from "@trackingPortal/contexts/NetworkProvider";
import { useIsFocused } from "@react-navigation/native";

export default function LoanScreen() {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false);
  const [isCreationPreloaded, setIsCreationPreloaded] = useState<boolean>(false);
  const [hideFabIcon, setHideFabIcon] = useState<boolean>(false);
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const { currentUser: user, apiGateway } = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { isOnline } = useNetwork();
  const wasOfflineRef = useRef(false);

  // 🔄 SMART AUTO-RETRY: when connection is restored, refetch stale data
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current && isFocused) {
      wasOfflineRef.current = false;
      getUserLoans();
    }
  }, [isOnline, isFocused]);

  // 🔥 PRELOAD MODAL UI
  useEffect(() => {
    const id = setTimeout(() => {
      setIsCreationPreloaded(true);
    }, 1000);
    return () => clearTimeout(id);
  }, []);

  const handleOpenCreationModal = useCallback(() => {
    // UI reacts immediately - haptics after modal starts
    setOpenCreationModal(true);
    triggerSuccessHaptic();
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
      const rafId = requestAnimationFrame(() => {
        getUserLoans();
      });
      return () => cancelAnimationFrame(rafId);
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

  const totalGiven = useMemo(() => loans?.reduce((acc, crr): number => {
    if (crr.loanType === LoanType.GIVEN) {
      acc += crr.amount;
    }
    return acc;
  }, 0), [loans]);

  const totalBorrowed = useMemo(() => loans?.reduce((acc, crr): number => {
    if (crr.loanType === LoanType.TAKEN) {
      acc += crr.amount;
    }
    return acc;
  }, 0), [loans]);

  const handleRefresh = async () => {
    if (!isOnline) {
      Toast.show({
        type: 'offline',
        text1: 'No internet connection',
        text2: 'Please connect to refresh data.',
      });
      return;
    }

    setRefreshing(true);
    await getUserLoans();
    setRefreshing(false);
  };

  const headerComponent = useMemo(() => (
    <LoanSummary totalGiven={totalGiven} totalBorrowed={totalBorrowed} />
  ), [totalGiven, totalBorrowed]);

  const footerComponent = useMemo(() => (
    <LoanList
      notifyRowOpen={(value) => setHideFabIcon(value)}
      loans={loans}
      getUserLoan={getUserLoans}
    />
  ), [loans, getUserLoans]);

  if (loading && loans.length === 0) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        keyExtractor={(item, index) => `${item.id || index}`}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={() => null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 }
        ]}
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
      {(openCreationModal || isCreationPreloaded) && (
        <LoanCreation
          getUserLoans={getUserLoans}
          setLoans={setLoans}
          openCreationModal={openCreationModal}
          setOpenCreationModal={setOpenCreationModal}
        />
      )}
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
