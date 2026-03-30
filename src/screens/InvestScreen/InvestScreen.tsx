import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestModel } from "@trackingPortal/api/models";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import InvestCreation from "@trackingPortal/screens/InvestScreen/InvestCreation";
import InvestList from "@trackingPortal/screens/InvestScreen/InvestList";
import InvestSummary from "@trackingPortal/screens/InvestScreen/InvestSummary";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { triggerSuccessHaptic } from "@trackingPortal/utils/haptic";
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View, Platform } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useNetwork } from "@trackingPortal/contexts/NetworkProvider";
import { useIsFocused } from "@react-navigation/native";

export default function InvestScreen() {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false);
  const [isCreationPreloaded, setIsCreationPreloaded] = useState<boolean>(false);
  const [hideFabIcon, setHideFabIcon] = useState<boolean>(false);
  const [invests, setInvests] = useState<InvestModel[]>([]);
  const { currentUser: user, apiGateway } = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [status, setStatus] = React.useState<EInvestStatus>(
    EInvestStatus.Active,
  );
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
      getUserInvestHistory();
    }
  }, [isOnline, isFocused]);

  // 🔥 PRELOAD CREATION UI
  useEffect(() => {
    const id = setTimeout(() => {
      setIsCreationPreloaded(true);
    }, 1200);
    return () => clearTimeout(id);
  }, []);

  const handleOpenCreationModal = useCallback(() => {
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
        getUserInvestHistory();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [user, status]);

  const getUserInvestHistory = async () => {
    try {
      setLoading(true);
      const response = await apiGateway.investService.getInvestByUserId({
        userId: user.userId,
        status: status,
      });
      setInvests(response);
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
    await getUserInvestHistory();
    setRefreshing(false);
  };

  const headerComponent = useMemo(() => (
    <InvestSummary investList={invests} status={status} />
  ), [invests, status]);

  const footerComponent = useMemo(() => (
    <InvestList
      invests={invests}
      getUserInvestHistory={getUserInvestHistory}
      notifyRowOpen={(value) => setHideFabIcon(value)}
      status={status}
      setStatus={setStatus}
    />
  ), [invests, getUserInvestHistory, status]);

  if (loading && invests.length === 0) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={invests}
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
        <InvestCreation
          openCreationModal={openCreationModal}
          setOpenCreationModal={setOpenCreationModal}
          setInvests={setInvests}
          getUserInvestHistory={getUserInvestHistory}
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
