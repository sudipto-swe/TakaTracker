/**
 * ChatBot Screen — Beautiful AI business assistant chat interface.
 * Supports Bangla and English conversations about business data.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import {
    ChatMessage,
    generateResponse,
    createMessage,
    QUICK_SUGGESTIONS,
} from '../../services/chatbotService';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { t } from '../../i18n';

// ─── Typing Indicator (animated dots) ───
const TypingIndicator: React.FC = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = animateDot(dot1, 0);
        const anim2 = animateDot(dot2, 200);
        const anim3 = animateDot(dot3, 400);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, []);

    const dotStyle = (anim: Animated.Value) => ({
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
        }],
    });

    return (
        <View style={styles.typingContainer}>
            <View style={styles.botAvatarSmall}>
                <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.white} />
            </View>
            <View style={styles.typingBubble}>
                <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
                <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
                <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
            </View>
        </View>
    );
};

// ─── Chat Message Bubble ───
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isBot = message.sender === 'bot';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(isBot ? -20 : 20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.messageRow,
                isBot ? styles.botMessageRow : styles.userMessageRow,
                { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
        >
            {isBot && (
                <View style={styles.botAvatarSmall}>
                    <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.white} />
                </View>
            )}
            <View
                style={[
                    styles.messageBubble,
                    isBot ? styles.botBubble : styles.userBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isBot ? styles.botMessageText : styles.userMessageText,
                    ]}
                >
                    {message.text}
                </Text>
                <Text
                    style={[
                        styles.messageTime,
                        isBot ? styles.botTimeText : styles.userTimeText,
                    ]}
                >
                    {message.timestamp.toLocaleTimeString('bn-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>
        </Animated.View>
    );
};

// ─── Main ChatBot Screen ───
export const ChatBotScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const scrollRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    // Send welcome message on mount
    useEffect(() => {
        const welcome = createMessage(
            `আসসালামু আলাইকুম! 🤖\n\nআমি আপনার ব্যবসা সহকারী — টাকাট্র্যাকার বট।\n\nআপনার দোকানের বিক্রি, লাভ, বাকি, স্টক — যেকোনো কিছু সম্পর্কে জিজ্ঞেস করুন!\n\nনিচের বাটন চেপে বা নিজে লিখে প্রশ্ন করতে পারেন 👇`,
            'bot'
        );
        setMessages([welcome]);
    }, []);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        const timer = setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isTyping]);

    // Send message handler
    const handleSend = useCallback((text?: string) => {
        const messageText = (text || inputText).trim();
        if (!messageText) return;

        // Add user message
        const userMsg = createMessage(messageText, 'user');
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setShowSuggestions(false);
        Keyboard.dismiss();

        // Show typing indicator
        setIsTyping(true);

        // Simulate thinking delay (300-800ms for natural feel)
        const delay = 300 + Math.random() * 500;
        setTimeout(() => {
            const response = generateResponse(messageText);
            const botMsg = createMessage(response, 'bot');
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);

            // Show suggestions again after bot responds
            setTimeout(() => setShowSuggestions(true), 500);
        }, delay);
    }, [inputText]);

    // Handle quick suggestion tap
    const handleSuggestion = useCallback((suggestion: typeof QUICK_SUGGESTIONS[0]) => {
        handleSend(suggestion.message);
    }, [handleSend]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatar}>
                        <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.white} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{t('chatbot.title')}</Text>
                        <Text style={styles.headerSubtitle}>{t('chatbot.subtitle')}</Text>
                    </View>
                </View>
                <View style={styles.onlineIndicator}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>{t('chatbot.online')}</Text>
                </View>
            </View>

            {/* Chat Messages */}
            <KeyboardAvoidingView
                style={styles.chatArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}

                    {isTyping && <TypingIndicator />}
                </ScrollView>

                {/* Quick Suggestions */}
                {showSuggestions && !isTyping && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.suggestionsRow}
                        contentContainerStyle={styles.suggestionsContent}
                    >
                        {QUICK_SUGGESTIONS.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionChip}
                                onPress={() => handleSuggestion(suggestion)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.suggestionText}>
                                    {suggestion.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={t('chatbot.placeholder')}
                        placeholderTextColor={COLORS.gray400}
                        multiline
                        maxLength={500}
                        onSubmitEditing={() => handleSend()}
                        blurOnSubmit
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !inputText.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim()}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() ? COLORS.white : COLORS.gray400}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ─── Styles ───
const CHATBOT_PURPLE = '#7C3AED';
const CHATBOT_PURPLE_LIGHT = '#8B5CF6';
const CHATBOT_GRADIENT_END = '#6D28D9';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F0FF',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CHATBOT_PURPLE,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        ...SHADOWS.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.md,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: CHATBOT_PURPLE_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    onlineIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ADE80',
        marginRight: 4,
    },
    onlineText: {
        fontSize: 10,
        color: COLORS.white,
        fontWeight: '500',
    },

    // Chat area
    chatArea: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.sm,
    },

    // Message row
    messageRow: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        maxWidth: '85%',
    },
    botMessageRow: {
        alignSelf: 'flex-start',
    },
    userMessageRow: {
        alignSelf: 'flex-end',
    },

    // Bot avatar
    botAvatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: CHATBOT_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.xs,
        marginTop: 2,
    },

    // Message bubble
    messageBubble: {
        maxWidth: '100%',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    botBubble: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: CHATBOT_PURPLE,
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: FONT_SIZES.base,
        lineHeight: 22,
    },
    botMessageText: {
        color: COLORS.textPrimary,
    },
    userMessageText: {
        color: COLORS.white,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    botTimeText: {
        color: COLORS.textMuted,
    },
    userTimeText: {
        color: 'rgba(255,255,255,0.6)',
    },

    // Typing indicator
    typingContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'flex-end',
        marginBottom: SPACING.md,
    },
    typingBubble: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        borderTopLeftRadius: 4,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        gap: 4,
        ...SHADOWS.sm,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: CHATBOT_PURPLE,
    },

    // Suggestions
    suggestionsRow: {
        maxHeight: 48,
        borderTopWidth: 1,
        borderTopColor: 'rgba(124, 58, 237, 0.1)',
        backgroundColor: '#F8F5FF',
    },
    suggestionsContent: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    suggestionChip: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderWidth: 1,
        borderColor: CHATBOT_PURPLE + '30',
        marginRight: SPACING.sm,
        ...SHADOWS.sm,
    },
    suggestionText: {
        fontSize: FONT_SIZES.sm,
        color: CHATBOT_PURPLE,
        fontWeight: '500',
    },

    // Input bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        gap: SPACING.sm,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F8F5FF',
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
        fontSize: FONT_SIZES.base,
        color: COLORS.textPrimary,
        maxHeight: 100,
        minHeight: 40,
        borderWidth: 1,
        borderColor: CHATBOT_PURPLE + '20',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: CHATBOT_PURPLE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray200,
    },
});
