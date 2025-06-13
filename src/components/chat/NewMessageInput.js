// NewMessageInput.js - Input tin nhắn mới với UI hiện đại
import React, { memo, useState, useRef, useCallback } from 'react';
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
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const NewMessageInput = memo(({
    messageText,
    onChangeText,
    onSend,
    attachment,
    setAttachment,
    sending = false,
    disabled = false
}) => {
    // 📱 State
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

    // 📝 References
    const textInputRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;
    const recordAnim = useRef(new Animated.Value(1)).current;

    // 📱 Focus input
    const focusInput = useCallback(() => {
        textInputRef.current?.focus();
    }, []);

    // 📱 Handle send message
    const handleSend = useCallback(() => {
        // ⚡ Debounce protection - prevent double press
        if (sending || disabled) {
            console.log('⚠️ Send blocked - sending:', sending, 'disabled:', disabled);
            return;
        }

        if (messageText.trim().length > 0 || attachment) {
            console.log('📤 Triggering send message...');
            onSend();
            setIsExpanded(false);
            
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
        } else {
            console.log('⚠️ No content to send');
        }
    }, [messageText, attachment, onSend, scaleAnim, sending, disabled]);

    // 📱 Handle text change
    const handleTextChange = useCallback((text) => {
        onChangeText(text);
        
        // Auto-expand input for long text
        const shouldExpand = text.length > 50;
        if (shouldExpand !== isExpanded) {
            setIsExpanded(shouldExpand);
            Animated.timing(expandAnim, {
                toValue: shouldExpand ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [onChangeText, isExpanded, expandAnim]);

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

    // 🎨 Get send button color
    const getSendButtonColor = () => {
        if (sending) return ['#ccc', '#999'];
        if (messageText.trim().length > 0 || attachment) return ['#667eea', '#764ba2'];
        return ['#e0e0e0', '#bdbdbd'];
    };

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
                                color="#667eea" 
                            />
                        </View>
                        <View style={styles.attachmentInfo}>
                            <Text style={styles.attachmentName} numberOfLines={1}>
                                {attachment.name}
                            </Text>
                            <Text style={styles.attachmentSize}>
                                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.removeAttachment}
                            onPress={removeAttachment}
                        >
                            <Ionicons name="close" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Attachment Options */}
            {showAttachmentOptions && (
                <View style={styles.attachmentOptions}>
                    <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
                        <View style={[styles.attachmentOptionIcon, { backgroundColor: '#4CAF50' }]}>
                            <Ionicons name="camera" size={24} color="#fff" />
                        </View>
                        <Text style={styles.attachmentOptionText}>Camera</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
                        <View style={[styles.attachmentOptionIcon, { backgroundColor: '#2196F3' }]}>
                            <Ionicons name="image" size={24} color="#fff" />
                        </View>
                        <Text style={styles.attachmentOptionText}>Thư viện</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
                        <View style={[styles.attachmentOptionIcon, { backgroundColor: '#FF9800' }]}>
                            <Ionicons name="document" size={24} color="#fff" />
                        </View>
                        <Text style={styles.attachmentOptionText}>File</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Input Container */}
            <View style={styles.inputContainer}>
                {/* Text Input */}
                <View style={styles.inputWrapper}>
                    <TouchableOpacity
                        style={styles.attachmentButton}
                        onPress={toggleAttachmentOptions}
                        disabled={disabled}
                    >
                        <Ionicons 
                            name={showAttachmentOptions ? "close" : "add"} 
                            size={24} 
                            color={disabled ? "#ccc" : "#667eea"} 
                        />
                    </TouchableOpacity>

                    <TextInput
                        ref={textInputRef}
                        style={[
                            styles.textInput,
                            isExpanded && styles.expandedInput,
                            disabled && styles.disabledInput
                        ]}
                        placeholder={disabled ? "Đang kết nối..." : "Nhập tin nhắn..."}
                        placeholderTextColor="#999"
                        value={messageText}
                        onChangeText={handleTextChange}
                        multiline
                        maxLength={1000}
                        editable={!disabled && !sending}
                        returnKeyType="default"
                        blurOnSubmit={false}
                    />

                    {/* Emoji Button */}
                    <TouchableOpacity
                        style={styles.emojiButton}
                        onPress={() => {
                            // TODO: Implement emoji picker
                            console.log('Emoji picker');
                        }}
                        disabled={disabled}
                    >
                        <Ionicons 
                            name="happy-outline" 
                            size={24} 
                            color={disabled ? "#ccc" : "#667eea"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {messageText.trim().length === 0 && !attachment ? (
                        // Voice Recording Button
                        <Animated.View style={{ transform: [{ scale: recordAnim }] }}>
                            <TouchableOpacity
                                style={[
                                    styles.voiceButton,
                                    isRecording && styles.recordingButton
                                ]}
                                onPress={toggleRecording}
                                disabled={disabled}
                            >
                                <Ionicons 
                                    name={isRecording ? "stop" : "mic"} 
                                    size={24} 
                                    color="#fff" 
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        // Send Button
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSend}
                                disabled={disabled || sending || (messageText.trim().length === 0 && !attachment)}
                            >
                                <LinearGradient
                                    colors={getSendButtonColor()}
                                    style={styles.sendButtonGradient}
                                >
                                    {sending ? (
                                        <Animated.View style={styles.sendingIcon}>
                                            <Ionicons name="hourglass" size={24} color="#fff" />
                                        </Animated.View>
                                    ) : (
                                        <Ionicons name="send" size={20} color="#fff" />
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
            </View>

            {/* Recording Indicator */}
            {isRecording && (
                <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Đang ghi âm...</Text>
                    <TouchableOpacity 
                        style={styles.cancelRecording}
                        onPress={() => setIsRecording(false)}
                    >
                        <Text style={styles.cancelRecordingText}>Hủy</Text>
                    </TouchableOpacity>
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
    },
    attachmentPreview: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 5,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    attachmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    attachmentSize: {
        fontSize: 12,
        color: '#666',
    },
    removeAttachment: {
        padding: 5,
    },
    attachmentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    attachmentOption: {
        alignItems: 'center',
    },
    attachmentOptionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    attachmentOptionText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 5,
        paddingVertical: 5,
        marginRight: 10,
        minHeight: 44,
    },
    attachmentButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 8,
        paddingHorizontal: 5,
        maxHeight: 100,
        textAlignVertical: 'center',
    },
    expandedInput: {
        maxHeight: 120,
    },
    disabledInput: {
        color: '#999',
        backgroundColor: '#f5f5f5',
    },
    emojiButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    actionButtons: {
        justifyContent: 'flex-end',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    sendingIcon: {
        // Animation can be added here
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F44336',
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    recordingText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    cancelRecording: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    cancelRecordingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default NewMessageInput; 