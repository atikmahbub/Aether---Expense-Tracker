import { LoanType } from "@trackingPortal/api/enums";
import { LoanModel } from "@trackingPortal/api/models";
import { offlineService } from "@trackingPortal/api/utils/OfflineService";
import {
  UnixTimeStampString,
  LoanId,
  makeUnixTimestampString,
  UserId,
} from "@trackingPortal/api/primitives";
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
    try {
      setLoading(true);

      // 1. Fetch from server
      let serverLoans: LoanModel[] = [];
      try {
        serverLoans = await apiGateway.loanServices.getLoanByUserId(
          user.userId,
        );
      } catch (e) {
        console.log("Server Loan fetch failed", e);
      }

      // 2. Load from offline queue
      const queue = await offlineService.getQueue();
      const offlineLoans: LoanModel[] = queue
        .filter(item => 
          item.type === 'loan' && 
          !item.synced
        )
        .map(item => ({
          id: item.id as unknown as LoanId,
          userId: item.payload.userId as UserId,
          name: item.payload.name,
          amount: item.payload.amount,
          note: item.payload.note,
          deadLine: item.payload.deadLine as UnixTimeStampString,
          loanType: item.payload.loanType,
          created: makeUnixTimestampString(item.createdAt),
          updated: makeUnixTimestampString(item.createdAt),
        }));

      setLoans([...offlineLoans, ...serverLoans]);
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
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120, flexGrow: 1 }
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
    paddingBottom: 180,
    paddingTop: 8,
  },
});
