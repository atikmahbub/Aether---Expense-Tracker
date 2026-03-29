import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestModel } from "@trackingPortal/api/models";
import { AnimatedLoader } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import InvestCreation from "@trackingPortal/screens/InvestScreen/InvestCreation";
import InvestList from "@trackingPortal/screens/InvestScreen/InvestList";
import InvestSummary from "@trackingPortal/screens/InvestScreen/InvestSummary";
import { eventEmitter, EVENTS } from "@trackingPortal/utils/events";
import { withHaptic } from "@trackingPortal/utils/haptic";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, InteractionManager, StyleSheet, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useIsFocused } from "@react-navigation/native";

export default function InvestScreen() {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false);
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
      getUserInvestHistory();
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
    setRefreshing(true);
    await getUserInvestHistory();
    setRefreshing(false);
  };

  if (loading && invests.length === 0) {
    return <AnimatedLoader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={invests}
        keyExtractor={(item, index) => `${item.id || index}`}
        ListHeaderComponent={
          <InvestSummary investList={invests} status={status} />
        }
        ListFooterComponent={
          <InvestList
            invests={invests}
            getUserInvestHistory={getUserInvestHistory}
            notifyRowOpen={(value) => setHideFabIcon(value)}
            status={status}
            setStatus={setStatus}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={null}
        contentContainerStyle={styles.listContent}
      />
      <InvestCreation
        openCreationModal={openCreationModal}
        setOpenCreationModal={setOpenCreationModal}
        getUserInvestHistory={getUserInvestHistory}
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
