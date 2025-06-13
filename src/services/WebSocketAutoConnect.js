// WebSocketAutoConnect.js - Service tự động kết nối WebSocket khi có token
import webSocketService from './WebSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketAutoConnect {
    constructor() {
        this.isInitialized = false;
        this.connectionPromise = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    /**
     * Khởi tạo và tự động kết nối WebSocket
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        console.log('🔌 Initializing WebSocket Auto Connect...');
        
        try {
            // Lắng nghe thay đổi token trong AsyncStorage
            this._setupTokenListener();
            
            // Thử kết nối ngay lập tức với token hiện tại
            await this._attemptConnection();
            
            this.isInitialized = true;
            console.log('✅ WebSocket Auto Connect initialized');
        } catch (error) {
            console.warn('⚠️ WebSocket Auto Connect initialization failed:', error);
        }
    }

    /**
     * Thử kết nối WebSocket với token đã lưu
     */
    async _attemptConnection() {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this._doConnect();
        
        try {
            await this.connectionPromise;
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        } finally {
            this.connectionPromise = null;
        }
    }

    async _doConnect() {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            
            if (!token) {
                console.log('💤 No token available, skipping WebSocket connection');
                return;
            }

            if (webSocketService.isConnected()) {
                console.log('✅ WebSocket already connected');
                return;
            }

            console.log('🔄 Connecting WebSocket with stored token...');
            await webSocketService.connect(token);
            
            this.reconnectAttempts = 0;
            console.log('✅ WebSocket connected successfully');
            
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            this._scheduleReconnect();
            throw error;
        }
    }

    /**
     * Lên lịch kết nối lại
     */
    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            this._attemptConnection();
        }, delay);
    }

    /**
     * Setup listener để theo dõi thay đổi token
     */
    _setupTokenListener() {
        // Trong môi trường React Native, bạn có thể sử dụng AppState
        // để detect khi app active và check token
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('focus', () => {
                if (!webSocketService.isConnected()) {
                    console.log('🔄 App focused, attempting WebSocket reconnection...');
                    this._attemptConnection();
                }
            });
        }
    }

    /**
     * Force reconnect (cho debugging hoặc manual retry)
     */
    async forceReconnect() {
        console.log('🔄 Force reconnecting WebSocket...');
        this.reconnectAttempts = 0;
        
        if (webSocketService.isConnected()) {
            webSocketService.disconnect();
        }
        
        await this._attemptConnection();
    }

    /**
     * Disconnect
     */
    disconnect() {
        console.log('🔌 Disconnecting WebSocket Auto Connect...');
        if (webSocketService.isConnected()) {
            webSocketService.disconnect();
        }
        this.isInitialized = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Check connection status
     */
    isConnected() {
        return webSocketService.isConnected();
    }

    /**
     * Manually connect với token
     */
    async connectWithToken(token) {
        try {
            if (token) {
                await AsyncStorage.setItem('accessToken', token);
            }
            await this._attemptConnection();
        } catch (error) {
            console.error('❌ Manual connect failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
const webSocketAutoConnect = new WebSocketAutoConnect();
export default webSocketAutoConnect; 