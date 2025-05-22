// src/components/chat/MessageInput.js
import React, { memo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MessageInput = ({
                          messageText,
                          handleMessageTextChange,
                          sending,
                          attachment,
                          pickImage,
                          sendMessage,
                          setAttachment
                      }) => {
    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
                <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                    <Icon name="camera-outline" size={24} color="#0095F6" />
                </TouchableOpacity>
                <TextInput
                    style={styles.textInput}
                    placeholder="Tin nhắn..."
                    value={messageText}
                    onChangeText={handleMessageTextChange}
                    multiline
                    editable={!sending}
                />
                {messageText.trim() === '' && !attachment ? (
                    <View style={styles.inputActions}>
                        <TouchableOpacity style={styles.inputActionButton}>
                            <Icon name="microphone-outline" size={24} color="#0095F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.inputActionButton}
                            onPress={pickImage}
                        >
                            <Icon name="image-outline" size={24} color="#0095F6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.inputActionButton}>
                            <Icon name="sticker-emoji" size={24} color="#0095F6" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={sendMessage}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#0095F6" />
                        ) : (
                            <Text style={styles.sendButtonText}>Gửi</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: '#DEDEDE',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
        borderRadius: 22,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    textInput: {
        flex: 1,
        maxHeight: 100,
        fontSize: 16,
        marginHorizontal: 8,
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputActionButton: {
        marginLeft: 8,
    },
    sendButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        height: 32,
    },
    sendButtonText: {
        color: '#0095F6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cameraButton: {
        paddingHorizontal: 5,
    },
});

export default memo(MessageInput);