import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyListComponent = ({ searchQuery }) => (
    <View style={styles.emptySearchContainer}>
        <Text style={styles.emptySearchText}>
            {searchQuery && searchQuery.trim()
                ? "Không tìm thấy bạn bè khớp với tìm kiếm"
                : "Bạn chưa có bạn bè nào"}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    emptySearchContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptySearchText: {
        color: '#65676B',
        fontSize: 16,
    },
});

export default EmptyListComponent;