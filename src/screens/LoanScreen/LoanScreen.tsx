import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useDatabase } from "@trackingPortal/db/DatabaseProvider";
import LoanCreation from "@trackingPortal/screens/LoanScreen/LoanCreation";
import LoanList, { remainingFor } from "@trackingPortal/screens/LoanScreen/LoanList";
import type { LoanPaymentView } from "@trackingPortal/db/services/LoanDataService";
import LoanSummary from "@trackingPortal/screens/LoanScreen/LoanSummary";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { triggerSuccessHaptic } from "@trackingPortal/utils/haptic";
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useNetwork } from "@trackingPortal/contexts/NetworkProvider";
import { useIsFocused } from "@react-navigation/native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function LoanScreen() {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false);
  const [isCreationPreloaded, setIsCreationPreloaded] = useState<boolean>(false);
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const [payments, setPayments] = useState<LoanPaymentView[]>([]);
  const { currentUser: user } = useStoreContext();
  const { loanData } = useDatabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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

  // 🔄 SYNC COMPLETED: Refresh data
  useEffect(() => {
    const onSyncCompleted = () => {
      getUserLoans();
    };

    eventEmitter.on(EVENTS.OFFLINE_SYNC_COMPLETED, onSyncCompleted);

    return () => {
      eventEmitter.off(EVENTS.OFFLINE_SYNC_COMPLETED, onSyncCompleted);
    };
  }, []);

  useEffect(() => {
    if (!user.default) {
      const rafId = requestAnimationFrame(() => {
        getUserLoans();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [user]);

  const getUserLoans = async () => {
    if (!user.userId || !loanData) return;
    try {
      setLoading(true);
      // Offline-first: read from SQLite. The sync engine keeps it fresh.
      const [localLoans, localPayments] = await Promise.all([
        loanData.getLoans(user.userId),
        loanData.getPayments(user.userId),
      ]);
      setLoans(localLoans);
      setPayments(localPayments);
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

  const paymentsByLoan = useMemo(() => {
    const map: Record<string, LoanPaymentView[]> = {};
    for (const payment of payments) {
      (map[payment.loanId] ??= []).push(payment);
    }
    return map;
  }, [payments]);

  // Net position counts only what is still outstanding on open loans.
  const outstanding = useCallback(
    (type: LoanType) =>
      loans.reduce(
        (acc, loan) =>
          loan.loanType === type && !loan.settledAt
            ? acc + remainingFor(loan, paymentsByLoan[loan.id])
            : acc,
        0,
      ),
    [loans, paymentsByLoan],
  );
  const totalGiven = useMemo(() => outstanding(LoanType.GIVEN), [outstanding]);
  const totalBorrowed = useMemo(() => outstanding(LoanType.TAKEN), [outstanding]);

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
      notifyRowOpen={() => {}}
      loans={loans}
      paymentsByLoan={paymentsByLoan}
      getUserLoan={getUserLoans}
    />
  ), [loans, paymentsByLoan, getUserLoans]);

  if (loading && loans.length === 0) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Every input on this screen lives inside a modal that handles the
          keyboard itself; enableOnAndroid would shift this list too. */}
      <KeyboardAwareScrollView
        enableOnAndroid={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 0, flexGrow: 1 }
        ]}
      >
        {headerComponent}
        {footerComponent}
      </KeyboardAwareScrollView>
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
    paddingBottom: 20,
    paddingTop: 0,
  },
});
