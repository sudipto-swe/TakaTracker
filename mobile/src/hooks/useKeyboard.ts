/**
 * Custom hook for keyboard visibility.
 */
import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

interface KeyboardState {
    isVisible: boolean;
    height: number;
}

export function useKeyboard(): KeyboardState {
    const [state, setState] = useState<KeyboardState>({
        isVisible: false,
        height: 0,
    });

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const handleShow = (event: KeyboardEvent) => {
            setState({
                isVisible: true,
                height: event.endCoordinates.height,
            });
        };

        const handleHide = () => {
            setState({
                isVisible: false,
                height: 0,
            });
        };

        const showSubscription = Keyboard.addListener(showEvent, handleShow);
        const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return state;
}

export default useKeyboard;
