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
                      }) => {
    const canSend = messageText.trim() || attachment;

    const ActionButtons = () => (
        <View style={styles.actions}>
            {['microphone-outline', 'image-outline', 'sticker-emoji'].map((icon, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.actionBtn}
                    onPress={index === 1 ? pickImage : undefined}
                >
                    <Icon name={icon} size={22} color="#0084FF" />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TouchableOpacity onPress={pickImage} style={styles.cameraBtn}>
                    <Icon name="camera-outline" size={22} color="#0084FF" />
                </TouchableOpacity>

                <TextInput
                    style={styles.textInput}
                    placeholder="Tin nhắn..."
                    value={messageText}
                    onChangeText={handleMessageTextChange}
                    multiline
                    maxLength={500}
                    editable={!sending}
                />

                {!canSend ? (
                    <ActionButtons />
                ) : (
                    <TouchableOpacity
                        style={styles.sendBtn}
                        onPress={sendMessage}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Icon name="send" size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 48,
    },
    cameraBtn: {
        padding: 4,
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 8,
        color: '#000',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 4,
        marginLeft: 8,
    },
    sendBtn: {
        backgroundColor: '#0084FF',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default memo(MessageInput);