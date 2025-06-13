// WebSocketDebugTool.js - Tool để debug WebSocket connection và messaging
import AsyncStorage from '@react-native-async-storage/async-storage';
import webSocketService from './src/services/WebSocketService';
import messagesService from './src/services/messagesService';

class WebSocketDebugTool {
    async debugConnectionStatus() {
        console.log('\n🔍 =========================');
        console.log('🔍 WEBSOCKET DEBUG REPORT');
        console.log('🔍 =========================\n');

        // 1. Check storage tokens
        console.log('📦 1. STORAGE TOKENS:');
        try {
            const keys = await AsyncStorage.getAllKeys();
            const relevantKeys = keys.filter(key => 
                key.toLowerCase().includes('token') || 
                key.toLowerCase().includes('auth') ||
                key.toLowerCase().includes('user')
            );
            
            for (const key of relevantKeys) {
                const value = await AsyncStorage.getItem(key);
                console.log(`  📋 ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
            }
        } catch (error) {
            console.error('  ❌ Error reading storage:', error);
        }

        // 2. Check WebSocket Service status
        console.log('\n🔌 2. WEBSOCKET SERVICE STATUS:');
        try {
            const serviceStatus = webSocketService.getConnectionStatus();
            const isConnected = webSocketService.isConnected();
            
            console.log(`  🔗 Service Connected: ${isConnected}`);
            console.log(`  📊 Service Status: ${serviceStatus}`);
            console.log(`  🏗️  Client exists: ${!!webSocketService.client}`);
            
            if (webSocketService.client) {
                console.log(`  🔗 STOMP Connected: ${webSocketService.client.connected}`);
                console.log(`  🌐 WebSocket State: ${webSocketService.client.ws?.readyState}`);
                console.log(`  📡 WebSocket URL: ${webSocketService.client.ws?.url}`);
            }
        } catch (error) {
            console.error('  ❌ Error checking service status:', error);
        }

        // 3. Check MessagesService status
        console.log('\n📨 3. MESSAGES SERVICE STATUS:');
        try {
            const msgServiceStatus = messagesService.getConnectionStatus();
            const isReady = messagesService.isWebSocketReady();
            
            console.log(`  🔗 Messages Service Ready: ${isReady}`);
            console.log(`  📊 Connection Status: ${msgServiceStatus}`);
        } catch (error) {
            console.error('  ❌ Error checking messages service:', error);
        }

        console.log('\n🔍 =========================\n');
    }

    async testConnection() {
        console.log('\n🧪 =========================');
        console.log('🧪 CONNECTION TEST');
        console.log('🧪 =========================\n');

        try {
            console.log('🔄 Testing WebSocket connection...');
            
            if (!webSocketService.isConnected()) {
                console.log('🔌 Attempting to connect...');
                await webSocketService.connectWithStoredToken();
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for connection
            }

            const finalStatus = webSocketService.isConnected();
            console.log(`✅ Final connection status: ${finalStatus}`);
            
            if (finalStatus) {
                console.log('🎉 WebSocket connection successful!');
                return true;
            } else {
                console.log('❌ WebSocket connection failed');
                return false;
            }
        } catch (error) {
            console.error('❌ Connection test error:', error);
            return false;
        }
    }

    async testSendMessage(receiverId = 2, content = 'Debug test message') {
        console.log('\n📤 =========================');
        console.log('📤 MESSAGE SEND TEST');
        console.log('📤 =========================\n');

        try {
            console.log(`📤 Testing message send to user ${receiverId}...`);
            console.log(`📝 Message content: "${content}"`);

            if (!webSocketService.isConnected()) {
                console.log('🔌 WebSocket not connected, attempting connection...');
                await this.testConnection();
            }

            const messageData = {
                receiverId: receiverId,
                content: content,
                messageType: 'text'
            };

            console.log('📤 Sending via MessagesService...');
            const result = await messagesService.sendMessage(messageData);
            
            console.log('✅ Send result:', result);
            console.log('🎉 Message send test completed!');
            return result;
        } catch (error) {
            console.error('❌ Message send test error:', error);
            return { success: false, error: error.message };
        }
    }

    async fullDebugCycle(receiverId = 2) {
        console.log('\n🚀 ===================================');
        console.log('🚀 FULL WEBSOCKET DEBUG CYCLE');
        console.log('🚀 ===================================\n');

        // 1. Debug connection status
        await this.debugConnectionStatus();

        // 2. Test connection
        const connectionResult = await this.testConnection();
        
        if (!connectionResult) {
            console.log('❌ Connection failed, stopping debug cycle');
            return { success: false, step: 'connection' };
        }

        // 3. Wait a moment for connection to stabilize
        console.log('⏳ Waiting for connection to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 4. Test message sending
        const sendResult = await this.testSendMessage(receiverId, `Debug test ${new Date().toISOString()}`);

        console.log('\n📊 FINAL RESULTS:');
        console.log(`  🔗 Connection: ${connectionResult ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`  📤 Message Send: ${sendResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (!sendResult.success) {
            console.log(`  ❌ Send Error: ${sendResult.error}`);
        }

        console.log('\n🚀 ===================================\n');

        return {
            success: connectionResult && sendResult.success,
            connectionResult,
            sendResult
        };
    }

    // Helper method to reset WebSocket connection
    async resetConnection() {
        console.log('\n🔄 RESETTING WEBSOCKET CONNECTION...\n');
        
        try {
            // Disconnect if connected
            if (webSocketService.isConnected()) {
                console.log('🔌 Disconnecting existing connection...');
                webSocketService.disconnect();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Clear any cached connection state
            console.log('🧹 Clearing connection state...');
            webSocketService.connected = false;
            webSocketService.client = null;

            // Try fresh connection
            console.log('🔌 Attempting fresh connection...');
            await webSocketService.connectWithStoredToken();
            await new Promise(resolve => setTimeout(resolve, 3000));

            const finalStatus = webSocketService.isConnected();
            console.log(`✅ Reset result: ${finalStatus ? 'SUCCESS' : 'FAILED'}`);
            
            return finalStatus;
        } catch (error) {
            console.error('❌ Reset connection error:', error);
            return false;
        }
    }
}

// Export singleton instance
const webSocketDebugTool = new WebSocketDebugTool();
export default webSocketDebugTool;

// Usage examples:
// 
// import webSocketDebugTool from './WebSocketDebugTool';
// 
// // Quick status check
// webSocketDebugTool.debugConnectionStatus();
// 
// // Test connection only
// webSocketDebugTool.testConnection();
// 
// // Test sending a message
// webSocketDebugTool.testSendMessage(2, 'Hello test');
// 
// // Full debug cycle (recommended)
// webSocketDebugTool.fullDebugCycle(2);
// 
// // Reset connection if having issues
// webSocketDebugTool.resetConnection(); 