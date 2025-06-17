import webSocketService from './WebSocketService';

/**
 * WebSocket Reconnection Manager
 * Manages reconnection attempts with exponential backoff
 */
class WebSocketReconnectionManager {
  constructor() {
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // 1 second
    this.maxReconnectDelay = 30000; // 30 seconds
    this.reconnectTimeoutId = null;
    this.isReconnecting = false;
    this.listeners = new Map();
  }

  /**
   * Start reconnection process with exponential backoff
   */
  async startReconnection() {
    if (this.isReconnecting) {
      console.log('🔄 Already attempting to reconnect');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('⚠️ Maximum reconnection attempts reached');
      this._notifyListeners('maxAttemptsReached');
      return;
    }

    this.isReconnecting = true;
    this._notifyListeners('reconnecting', { attempt: this.reconnectAttempts + 1, max: this.maxReconnectAttempts });

    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts) * (0.9 + Math.random() * 0.2),
      this.maxReconnectDelay
    );

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${delay}ms`);

    // Clear any existing timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    // Schedule reconnection attempt
    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        
        // Try to reconnect
        await webSocketService.connectWithStoredToken();
        
        // Check if connection was successful
        if (webSocketService.isConnected()) {
          console.log('✅ Reconnection successful');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this._notifyListeners('reconnected');
        } else {
          console.log('❌ Reconnection failed');
          this.reconnectAttempts++;
          this.isReconnecting = false;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            // Try again
            this.startReconnection();
          } else {
            console.log('⚠️ Maximum reconnection attempts reached');
            this._notifyListeners('maxAttemptsReached');
          }
        }
      } catch (error) {
        console.error('❌ Reconnection error:', error);
        this.reconnectAttempts++;
        this.isReconnecting = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          // Try again
          this.startReconnection();
        } else {
          console.log('⚠️ Maximum reconnection attempts reached');
          this._notifyListeners('maxAttemptsReached');
        }
      }
    }, delay);
  }

  /**
   * Force immediate reconnection attempt
   */
  async forceReconnect() {
    // Clear any existing timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    
    // Reset attempts counter to give more chances
    if (this.reconnectAttempts > 3) {
      this.reconnectAttempts = Math.floor(this.reconnectAttempts / 2);
    }
    
    this.isReconnecting = false;
    await this.startReconnection();
  }

  /**
   * Reset reconnection attempts counter
   */
  resetAttempts() {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Check if currently attempting to reconnect
   */
  isAttemptingReconnect() {
    return this.isReconnecting;
  }

  /**
   * Get current reconnection attempt count
   */
  getAttemptCount() {
    return this.reconnectAttempts;
  }

  /**
   * Register event listener
   * @param {string} event - Event name ('reconnecting', 'reconnected', 'maxAttemptsReached')
   * @param {Function} callback - Callback function
   * @returns {string} - Listener key for removal
   */
  on(event, callback) {
    const key = `${event}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    this.listeners.get(event).set(key, callback);
    return key;
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {string} key - Listener key
   */
  off(event, key) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(key);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Create singleton instance
const webSocketReconnectionManager = new WebSocketReconnectionManager();

export default webSocketReconnectionManager; 