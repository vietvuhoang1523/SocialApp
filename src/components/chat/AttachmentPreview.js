import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AttachmentPreview = ({ attachment, setAttachment }) => {
    if (!attachment) return null;

    return (
        <View style={styles.container}>
            <Image source={{ uri: attachment.uri }} style={styles.image} />
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setAttachment(null)}
            >
                <Icon name="close-circle" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 10,
        width: 100,
        height: 100,
        borderRadius: 12,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        padding: 2,
    },
});

export default AttachmentPreview;