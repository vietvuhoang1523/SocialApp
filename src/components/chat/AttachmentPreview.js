// src/components/chat/AttachmentPreview.js
import React from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AttachmentPreview = ({ attachment, setAttachment }) => {
    if (!attachment) return null;

    return (
        <View style={styles.attachmentPreview}>
            <Image
                source={{ uri: attachment.uri }}
                style={styles.attachmentPreviewImage}
            />
            <TouchableOpacity
                style={styles.attachmentRemoveButton}
                onPress={() => setAttachment(null)}
            >
                <Icon name="close-circle" size={20} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    attachmentPreview: {
        margin: 10,
        width: 100,
        height: 100,
        borderRadius: 10,
        position: 'relative',
    },
    attachmentPreviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    attachmentRemoveButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
    },
});

export default AttachmentPreview;