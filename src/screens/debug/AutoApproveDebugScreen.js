import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AutoApproveDebugTool from '../../components/debug/AutoApproveDebugTool';

const AutoApproveDebugScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <AutoApproveDebugTool />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
});

export default AutoApproveDebugScreen; 