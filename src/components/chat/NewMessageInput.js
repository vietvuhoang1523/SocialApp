// NewMessageInput.js - Input tin nhắn mới với UI hiện đại
import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const NewMessageInput = memo(({
    text,
    setText,
    onSend,
    attachment,
    setAttachment,
    sending = false,
    connectionStatus = 'connected',
    onTyping
}) => {
    // 📱 State
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);

    // 📝 References
    const textInputRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;
    const recordAnim = useRef(new Animated.Value(1)).current;
    const lastTypingState = useRef(false);

    // 📱 Focus input
    const focusInput = useCallback(() => {
        textInputRef.current?.focus();
    }, []);

    // 📱 Handle send message với debounce protection
    const lastSendTime = useRef(0);
    const sendDebounceTime = 1000; // 1 giây

    const handleSend = useCallback(() => {
        // Check if sending is disabled
        const isDisabled = connectionStatus === 'error' || connectionStatus === 'disconnected';
        
        // ⚡ Debounce protection - prevent double press trong 1 giây
        const now = Date.now();
        if (now - lastSendTime.current < sendDebounceTime) {
            console.log('⚠️ Send prevented by debounce protection');
            return;
        }
        
        if (sending || isDisabled) {
            if (isDisabled) {
                Alert.alert(
                    'Mất kết nối',
                    'Không thể gửi tin nhắn khi mất kết nối. Vui lòng thử lại sau.',
                    [{ text: 'Đã hiểu' }]
                );
            }
            return;
        }

        if (text.trim().length > 0 || attachment) {
            console.log('📤 Triggering send message...');
            lastSendTime.current = now; // Cập nhật thời gian gửi cuối
            
            onSend(text, attachment);
            setIsExpanded(false);
            
            // Reset typing state
            if (onTyping && lastTypingState.current) {
                onTyping(false);
                lastTypingState.current = false;
            }
            
            // Animate send button
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [text, attachment, onSend, scaleAnim, sending, connectionStatus, onTyping]);

    // 📱 Handle text change with typing notifications
    const handleTextChange = useCallback((value) => {
        setText(value);
        
        // Auto-expand input for long text
        const shouldExpand = value.length > 50;
        if (shouldExpand !== isExpanded) {
            setIsExpanded(shouldExpand);
            Animated.timing(expandAnim, {
                toValue: shouldExpand ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        
        // Handle typing notifications
        if (onTyping) {
            // Only send typing notification if text is not empty
            const isTyping = value.trim().length > 0;
            
            // Only send notification when typing state changes
            if (isTyping !== lastTypingState.current) {
                onTyping(isTyping);
                lastTypingState.current = isTyping;
            }
            
            // Clear previous timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // If user is typing, set a timeout to reset typing state after 3 seconds of inactivity
            if (isTyping) {
                const timeout = setTimeout(() => {
                    if (lastTypingState.current) {
                        onTyping(false);
                        lastTypingState.current = false;
                    }
                }, 3000);
                setTypingTimeout(timeout);
            }
        }
    }, [setText, isExpanded, expandAnim, onTyping, typingTimeout]);

    // Clean up typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // Reset typing state when component unmounts
            if (onTyping && lastTypingState.current) {
                onTyping(false);
            }
        };
    }, [typingTimeout, onTyping]);

    // 📷 Pick image from gallery
    const pickImage = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Cần quyền truy cập',
                    'Vui lòng cấp quyền truy cập thư viện ảnh để gửi hình ảnh.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                setAttachment({
                    type: 'image',
                    uri: result.assets[0].uri,
                    name: 'image.jpg',
                    size: result.assets[0].fileSize || 0,
                });
                setShowAttachmentOptions(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        }
    }, [setAttachment]);

    // 📷 Take photo with camera
    const takePhoto = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Cần quyền truy cập',
                    'Vui lòng cấp quyền truy cập camera để chụp ảnh.'
                );
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                setAttachment({
                    type: 'image',
                    uri: result.assets[0].uri,
                    name: 'photo.jpg',
                    size: result.assets[0].fileSize || 0,
                });
                setShowAttachmentOptions(false);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
        }
    }, [setAttachment]);

    // 📄 Pick document
    const pickDocument = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                setAttachment({
                    type: 'document',
                    uri: result.assets[0].uri,
                    name: result.assets[0].name || 'document',
                    size: result.assets[0].size || 0,
                });
                setShowAttachmentOptions(false);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Lỗi', 'Không thể chọn file. Vui lòng thử lại.');
        }
    }, [setAttachment]);

    // 🎤 Start/stop voice recording
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            // Stop recording
            setIsRecording(false);
            // TODO: Implement voice recording stop
            console.log('Stop recording');
        } else {
            // Start recording
            setIsRecording(true);
            // TODO: Implement voice recording start
            console.log('Start recording');
            
            // Animate recording button
            Animated.loop(
                Animated.sequence([
                    Animated.timing(recordAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(recordAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        }
    }, [isRecording, recordAnim]);

    // 📱 Remove attachment
    const removeAttachment = useCallback(() => {
        setAttachment(null);
    }, [setAttachment]);

    // 📱 Toggle attachment options
    const toggleAttachmentOptions = useCallback(() => {
        setShowAttachmentOptions(prev => !prev);
    }, []);

    // 🎨 Get send button color based on connection status and message content
    const getSendButtonColor = () => {
        if (sending) return ['#ccc', '#999'];
        if (connectionStatus === 'error' || connectionStatus === 'disconnected') return ['#e0e0e0', '#bdbdbd'];
        if (text.trim().length > 0 || attachment) return ['#0084ff', '#0084ff'];
        return ['#e0e0e0', '#bdbdbd'];
    };

    // Determine if input should be disabled
    const isDisabled = connectionStatus === 'error' || connectionStatus === 'disconnected';

    return (
        <View style={styles.container}>
            {/* Attachment Preview */}
            {attachment && (
                <View style={styles.attachmentPreview}>
                    <View style={styles.attachmentItem}>
                        <View style={styles.attachmentIcon}>
                            <Ionicons 
                                name={attachment.type === 'image' ? 'image' : 'document'} 
                                size={20} 
                                color="#0084ff" 
                            />
                        </View>
                        <View style={styles.attachmentInfo}>
                            <Text style={styles.attachmentName} numberOfLines={1}>
                                {attachment.name}
                            </Text>
                            <Text style={styles.attachmentSize}>
                                {(attachment.size / 1024).toFixed(1)} KB
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.removeButton} onPress={removeAttachment}>
                            <Ionicons name="close-circle" size={22} color="#ff3b30" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Input Container */}
            <View style={[
                styles.inputContainer,
                isDisabled && styles.inputContainerDisabled
            ]}>
                {/* Attachment Button */}
                <TouchableOpacity 
                    style={styles.attachButton}
                    onPress={toggleAttachmentOptions}
                    disabled={isDisabled}
                >
                    <Ionicons 
                        name="add-circle-outline" 
                        size={24} 
                        color={isDisabled ? "#bdbdbd" : "#0084ff"} 
                    />
                </TouchableOpacity>

                {/* Text Input */}
                <Animated.View 
                    style={[
                        styles.textInputContainer,
                        {
                            height: expandAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [40, 80]
                            })
                        }
                    ]}
                >
                    <TextInput
                        ref={textInputRef}
                        style={styles.textInput}
                        placeholder={isDisabled ? "Không thể gửi tin nhắn khi mất kết nối" : "Nhập tin nhắn..."}
                        placeholderTextColor={isDisabled ? "#999" : "#666"}
                        value={text}
                        onChangeText={handleTextChange}
                        multiline
                        editable={!isDisabled}
                    />
                </Animated.View>

                {/* Send Button */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity 
                        style={styles.sendButton} 
                        onPress={handleSend}
                        disabled={isDisabled || (text.trim().length === 0 && !attachment)}
                    >
                        <LinearGradient
                            colors={getSendButtonColor()}
                            style={styles.sendButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Attachment Options */}
            {showAttachmentOptions && (
                <View style={styles.attachmentOptions}>
                    <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
                        <View style={[styles.attachmentOptionIcon, { backgroundColor: '#4CAF50' }]}>
                            <Ionicons name="images" size={22} color="#fff" />
                        </View>
                        <Text style={styles.attachmentOptionText}>Thư viện</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
                        <View style={[styles.attachmentOptionIcon, { backgroundColor: '#2196F3' }]}>
                            <Ionicons name="camera" size={22} color="#fff" />
                        </View>
                        <Text style={styles.attachmentOptionText}>Camera</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
                        <View style={[styles.attachmentOptionIcon, { backgroundColor: '#FF9800' }]}>
                            <Ionicons name="document" size={22} color="#fff" />
                        </View>
                        <Text style={styles.attachmentOptionText}>Tài liệu</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Connection Status Indicator (only shown when disconnected) */}
            {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
                <View style={styles.connectionWarning}>
                    <Ionicons name="cloud-offline-outline" size={14} color="#ff3b30" />
                    <Text style={styles.connectionWarningText}>
                        Mất kết nối - Tin nhắn sẽ được gửi khi kết nối lại
                    </Text>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#f0f2f5',
        borderRadius: 24,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    inputContainerDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    attachButton: {
        padding: 8,
    },
    textInputContainer: {
        flex: 1,
        marginHorizontal: 8,
        justifyContent: 'center',
    },
    textInput: {
        fontSize: 16,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentPreview: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 8,
        padding: 8,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    attachmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentInfo: {
        flex: 1,
        marginLeft: 10,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    attachmentSize: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    removeButton: {
        padding: 5,
    },
    attachmentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    attachmentOption: {
        alignItems: 'center',
        width: screenWidth / 4,
    },
    attachmentOptionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    attachmentOptionText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    connectionWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginTop: 8,
    },
    connectionWarningText: {
        fontSize: 12,
        color: '#d32f2f',
        marginLeft: 6,
    },
});

export default NewMessageInput; 