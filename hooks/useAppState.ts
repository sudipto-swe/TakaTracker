/**
 * Custom hook for app state (foreground/background).
 */
import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState(): AppStateStatus {
    const appState = useRef<AppStateStatus>(AppState.currentState);
    const [currentState, setCurrentState] = useState<AppStateStatus>(appState.current);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            appState.current = nextState;
            setCurrentState(nextState);
        });

        return () => {
            subscription?.remove();
        };
    }, []);

    return currentState;
}

export default useAppState;
