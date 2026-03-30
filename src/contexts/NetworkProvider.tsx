import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NetworkState {
  isOnline: boolean;
  isInternetReachable: boolean;
}

interface NetworkContextValue extends NetworkState {
  /** Call this to manually re-check connectivity */
  refresh: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  isInternetReachable: true,
  refresh: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const NetworkProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    isInternetReachable: true,
  });

  const parseState = useCallback((netState: NetInfoState): NetworkState => {
    const isOnline = netState.isConnected ?? false;
    const isInternetReachable = netState.isInternetReachable ?? isOnline;
    return {isOnline, isInternetReachable};
  }, []);

  useEffect(() => {
    // Fetch current state immediately on mount
    NetInfo.fetch().then(netState => setState(parseState(netState)));

    // Subscribe to changes – unsubscribe on cleanup
    const unsubscribe = NetInfo.addEventListener(netState => {
      setState(parseState(netState));
    });

    return () => unsubscribe();
  }, [parseState]);

  const refresh = useCallback(() => {
    NetInfo.fetch().then(netState => setState(parseState(netState)));
  }, [parseState]);

  const value = useMemo(
    () => ({...state, refresh}),
    [state, refresh],
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useNetwork = (): NetworkContextValue =>
  useContext(NetworkContext);
