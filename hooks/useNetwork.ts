/**
 * Custom hook for network state.
 */
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string | null;
}

export function useNetwork(): NetworkState {
    const [state, setState] = useState<NetworkState>({
        isConnected: true,
        isInternetReachable: null,
        type: null,
    });

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
            setState({
                isConnected: netState.isConnected ?? false,
                isInternetReachable: netState.isInternetReachable,
                type: netState.type,
            });
        });

        // Get initial state
        NetInfo.fetch().then((netState) => {
            setState({
                isConnected: netState.isConnected ?? false,
                isInternetReachable: netState.isInternetReachable,
                type: netState.type,
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return state;
}

export default useNetwork;
