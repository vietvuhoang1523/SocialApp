// MessagesService.js - WebSocket Only - Không sử dụng REST API
import AsyncStorage from '@react-native-async-storage/async-storage';
import webSocketService from './WebSocketService';

class MessagesService {
    constructor() {
        this.eventListeners = new Map();
        this.cache = new Map();
        this.lastMessageId = null;
        this.wsTimeout = 20000; // Tăng timeout lên 20 giây để backend có thời gian xử lý
        this.callbacks = new Map();
        
        // Setup WebSocket listeners
        this._setupWebSocketListeners();
    }

    _setupWebSocketListeners() {
        // Listen for new messages
        webSocketService.on('newMessage', (message) => {
        this._cacheMessage(message);
        this._notifyCallbacks('newMessage', this.normalizeMessage(message));
        });

        // Listen for message history - handle both array and paginated format
        webSocketService.on('messageHistory', (data) => {
            console.log('Received messageHistory:', data);
            
            let messages = [];
            let pagination = null;

            // Check if it's paginated response (from backend)
            if (data && typeof data === 'object' && data.messages) {
                // Paginated format: { messages: [...], pagination: {...} }
                messages = data.messages;
                pagination = data.pagination;
            } else if (Array.isArray(data)) {
                // Simple array format
                messages = data;
            } else {
                console.warn('Unexpected message history format:', data);
                return;
            }

            // Normalize and cache messages
            const normalizedMessages = messages.map(msg => this.normalizeMessage(msg));
            normalizedMessages.forEach(message => this._cacheMessage(message));

            // Notify callbacks
            const result = pagination 
                ? { messages: normalizedMessages, pagination }
                : normalizedMessages;
                
            this._notifyCallbacks('messageHistory', result);
        });

        // Listen for conversations
        webSocketService.on('conversations', (conversations) => {
            console.log('📨 Received conversations from WebSocket:', conversations);
            this._notifyCallbacks('conversations', conversations);
        });

        // Listen for unread messages
        webSocketService.on('unreadMessages', (messages) => {
            const normalizedMessages = messages.map(msg => this.normalizeMessage(msg));
            this._notifyCallbacks('unreadMessages', normalizedMessages);
        });

        // Listen for typing notifications
        webSocketService.on('typing', (notification) => {
            this._notifyCallbacks('typing', notification);
        });

        // Listen for errors
        webSocketService.on('error', (error) => {
            console.error('WebSocket Error from backend:', error);
            this._notifyCallbacks('error', error);
        });

        // Listen for read confirmations
        webSocketService.on('readSuccess', (data) => {
            this._notifyCallbacks('readSuccess', data);
        });

        // Listen for unread count
        webSocketService.on('unreadCount', (data) => {
            this._notifyCallbacks('unreadCount', data);
        });
    }

    // Get messages between users with improved WebSocket handling
    async getMessagesBetweenUsers(user1Id, user2Id) {
        try {
            console.log(`📥 Loading messages between ${user1Id} and ${user2Id}`);
            
            // Try WebSocket first if connected
            if (webSocketService.isConnected()) {
                try {
                    console.log('🔌 Using WebSocket for message history...');
                    
                    // Send WebSocket request
                    await webSocketService.getMessagesBetweenUsers(user1Id, user2Id);
                    
                    // Wait for WebSocket response
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            console.warn('⚠️ WebSocket timeout, falling back to REST API');
                            this._getMessagesViaREST(user1Id, user2Id).then(resolve).catch(reject);
                        }, this.wsTimeout);

                        // Listen for WebSocket response
                        const handleResponse = (data) => {
                            clearTimeout(timeout);
                            webSocketService.off('messageHistory', handleResponse);
                            
                            // Handle both array and paginated response
                            if (data && data.messages) {
                                resolve(data.messages); // Return just messages for backward compatibility
                            } else if (Array.isArray(data)) {
                                resolve(data);
                            } else {
                                console.warn('Unexpected response format, falling back to REST');
                                this._getMessagesViaREST(user1Id, user2Id).then(resolve).catch(reject);
                            }
                        };

                        webSocketService.on('messageHistory', handleResponse);
                    });

                } catch (wsError) {
                    console.warn('⚠️ WebSocket request failed:', wsError.message);
                    // Fall through to REST API
                }
            }

            // Fallback to REST API
            return await this._getMessagesViaREST(user1Id, user2Id);

        } catch (error) {
            console.error('❌ Error getting messages:', error);
            throw new Error('Failed to load messages');
        }
    }

    // Private method to get messages via REST API
    async _getMessagesViaREST(user1Id, user2Id) {
        console.log('❌ REST API not supported by backend - messages only available via WebSocket');
        throw new Error('Backend only supports WebSocket for messages. Please ensure WebSocket connection is established.');
    }

    // Send message with WebSocket - WebSocket only
    async sendMessage(messageData) {
        try {
            console.log('📤 [MessagesService] Sending message:', messageData);

            // Validate message data
            if (!messageData.receiverId) {
                throw new Error('Receiver ID is required');
            }

            if (!messageData.content && !messageData.attachmentUrl) {
                throw new Error('Message content or attachment is required');
            }

            // ⚡ FIX: Better WebSocket connection checking
            const isConnected = webSocketService.isConnected();
            console.log('🔍 [MessagesService] WebSocket connection status:', {
                isConnected,
                serviceStatus: webSocketService.getConnectionStatus()
            });
            
            if (!isConnected) {
                // ⚡ FIX: Try to reconnect once before failing
                console.log('🔄 [MessagesService] WebSocket not connected, attempting reconnection...');
                try {
                    await webSocketService.connectWithStoredToken();
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for connection to stabilize
                    
                    if (!webSocketService.isConnected()) {
                        throw new Error('Reconnection failed - WebSocket still not connected');
                    }
                    console.log('✅ [MessagesService] Reconnection successful');
                } catch (reconnectError) {
                    console.error('❌ [MessagesService] Reconnection failed:', reconnectError);
                    throw new Error('WebSocket not connected and reconnection failed. Backend only supports WebSocket for sending messages.');
                }
            }

            console.log('🔌 [MessagesService] Sending message via WebSocket...');
            
            // ⚡ FIX: Add timeout wrapper for WebSocket send
            const sendPromise = webSocketService.sendMessage(messageData);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('WebSocket send timeout')), 15000);
            });
            
            await Promise.race([sendPromise, timeoutPromise]);
            
            console.log('✅ [MessagesService] Message sent successfully via WebSocket');
            return { success: true, method: 'websocket' };

        } catch (error) {
            console.error('❌ [MessagesService] Error sending message:', error);
            
            // ⚡ FIX: Provide more specific error information
            const errorDetails = {
                message: error.message,
                isConnected: webSocketService.isConnected(),
                serviceStatus: webSocketService.getConnectionStatus()
            };
            console.error('❌ [MessagesService] Error details:', errorDetails);
            
            throw new Error(`Failed to send message via WebSocket: ${error.message}`);
        }
    }

    // Get conversations with WebSocket - WebSocket only
    async getConversations() {
        try {
            console.log('📥 Loading conversations');

            // ✅ Only use WebSocket - backend only supports WebSocket for conversations
            if (webSocketService.isConnected()) {
                try {
                    console.log('🔌 Using WebSocket for conversations...');
                    await webSocketService.getConversations();
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            console.error('⚠️ WebSocket timeout for conversations');
                            reject(new Error('WebSocket timeout - conversations not received'));
                        }, this.wsTimeout);

                        const handleResponse = (response) => {
                            clearTimeout(timeout);
                            webSocketService.off('conversations', handleResponse);
                            console.log('🔍 Raw conversations response:', response);
                            let conversationsData = [];
                            // Handle different response formats from backend
                            if (response && response.conversations && Array.isArray(response.conversations)) {
                                // Backend returns: { conversations: [...], count: X, status: "success" }
                                conversationsData = response.conversations;
                                console.log(`📊 Found ${response.count || conversationsData.length} conversations in response`);
                            } else if (Array.isArray(response)) {
                                // Backend returns: [conversation1, conversation2, ...]
                                conversationsData = response;
                                console.log(`📊 Found ${conversationsData.length} conversations as array`);
                            } else if (response && response.data && Array.isArray(response.data)) {
                                // Another possible format
                                conversationsData = response.data;
                                console.log(`📊 Found ${conversationsData.length} conversations in data field`);
                            } else {
                                console.log('⚠️ Unexpected response format:', typeof response, response);
                                conversationsData = [];
                            }
                            resolve(conversationsData);
                        };
                        webSocketService.on('conversations', handleResponse);
                    });
                } catch (wsError) {
                    console.error('❌ WebSocket request failed for conversations:', wsError.message);
                    throw wsError;
                }
            } else {
                throw new Error('WebSocket not connected. Backend only supports WebSocket for conversations.');
            }
        } catch (error) {
            console.error('❌ Error getting conversations:', error);
            throw new Error('Failed to load conversations');
        }
    }

    // Get unread messages with WebSocket - WebSocket only
    async getUnreadMessages() {
        try {
            console.log('📥 Loading unread messages');

            if (webSocketService.isConnected()) {
                await webSocketService.getUnreadMessages();
                return true; // Request sent, results will come via listener
            } else {
                throw new Error('WebSocket not connected. Backend only supports WebSocket for unread messages.');
            }

        } catch (error) {
            console.error('❌ Error getting unread messages:', error);
            throw new Error('Failed to load unread messages');
        }
    }

    // Mark message as read with WebSocket - WebSocket only
    async markMessageAsRead(messageId) {
        try {
            console.log(`📖 Marking message ${messageId} as read`);

            if (webSocketService.isConnected()) {
                await webSocketService.markMessageAsRead(messageId);
                return { success: true, method: 'websocket' };
            } else {
                throw new Error('WebSocket not connected. Backend only supports WebSocket for mark as read.');
            }

        } catch (error) {
            console.error('❌ Error marking message as read:', error);
            throw new Error('Failed to mark message as read');
        }
    }

    // Mark all messages as read between two users - WebSocket only
    async markAllMessagesAsRead(senderId, receiverId) {
        try {
            console.log(`📖 Marking all messages as read between ${senderId} and ${receiverId}`);

            // ✅ Only use WebSocket - backend doesn't support REST API for this
            if (webSocketService.isConnected()) {
                try {
                    // ✅ Use WebSocket method - backend supports /app/mark-all-read
                    await webSocketService.markAllMessagesAsRead(senderId, receiverId);
                    console.log('✅ WebSocket markAllMessagesAsRead successful');
                    return { success: true, method: 'websocket' };
                } catch (wsError) {
                    console.error('❌ WebSocket markAllMessagesAsRead failed:', wsError);
                    throw wsError;
                }
            } else {
                // ✅ No fallback to REST API - backend only supports WebSocket
                throw new Error('WebSocket not connected and backend only supports WebSocket for mark-all-read');
            }

        } catch (error) {
            console.error('❌ Error marking all messages as read:', error);
            // Don't throw error for this non-critical operation
            return { success: false, error: error.message };
        }
    }

    // Send typing notification with WebSocket
    async sendTypingNotification(receiverId, isTyping = true) {
        try {
            if (webSocketService.isConnected()) {
                return await webSocketService.sendTyping(receiverId, isTyping);
            }
            
            console.warn('🔌 WebSocket not connected, cannot send typing notification');
            return false;
        } catch (error) {
            console.error('❌ Error sending typing notification:', error);
            return false;
        }
    }

    // Normalize message format to ensure consistency
    normalizeMessage(message) {
        if (!message) return null;

        return {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            timestamp: message.timestamp,
            attachmentUrl: message.attachmentUrl,
            isRead: message.isRead || false,
            isDelivered: message.isDelivered || false,
            messageType: message.messageType || 'TEXT'
        };
    }

    // Cache message
    _cacheMessage(message) {
        if (message && message.id) {
            this.cache.set(message.id, message);
        }
    }

    // Subscribe to events
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event).add(callback);
    }

    // Unsubscribe from events
    off(event, callback) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).delete(callback);
        }
    }

    // Notify callbacks
    _notifyCallbacks(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in callback for ${event}:`, error);
                }
            });
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cached message
    getCachedMessage(messageId) {
        return this.cache.get(messageId);
    }

    // Get connection status
    getConnectionStatus() {
        return webSocketService.getConnectionStatus();
    }

    // Connect WebSocket
    async connectWebSocket() {
        try {
            return await webSocketService.connectWithStoredToken();
        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
            throw error;
        }
    }

    // Disconnect WebSocket
    disconnectWebSocket() {
        webSocketService.disconnect();
    }

    // ✅ Get messages with pagination support - WebSocket only
    async getMessagesBetweenUsersPaginated(user1Id, user2Id, options = {}) {
        try {
            const {
                page = 0,
                size = 20,
                sortBy = 'timestamp',
                order = 'desc'
            } = options;

            console.log(`📥 Loading paginated messages between ${user1Id} and ${user2Id}`, {
                page, size, sortBy, order
            });
            
            // ✅ Only use WebSocket - backend only supports WebSocket for messages
            if (webSocketService.isConnected()) {
                try {
                    console.log('🔌 Using WebSocket for paginated message history...');
                    
                    // ✅ Send WebSocket request with pagination options
                    await webSocketService.getMessagesBetweenUsers(user1Id, user2Id, {
                        enablePagination: true,
                        page,
                        size,
                        sortBy,
                        order
                    });
                    
                    // Wait for WebSocket response
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            console.error('⚠️ WebSocket timeout for paginated messages');
                            reject(new Error('WebSocket timeout - paginated messages not received'));
                        }, this.wsTimeout);

                        // Listen for WebSocket response
                        const handleResponse = (data) => {
                            clearTimeout(timeout);
                            webSocketService.off('messageHistory', handleResponse);
                            
                            // Handle paginated response
                            if (data && data.messages && data.pagination) {
                                const normalizedMessages = data.messages.map(msg => this.normalizeMessage(msg));
                                resolve({
                                    messages: normalizedMessages,
                                    pagination: data.pagination,
                                    method: 'websocket'
                                });
                            } else if (Array.isArray(data)) {
                                // Fallback for non-paginated response
                                const normalizedMessages = data.map(msg => this.normalizeMessage(msg));
                                resolve({
                                    messages: normalizedMessages,
                                    pagination: {
                                        currentPage: 0,
                                        totalPages: 1,
                                        totalElements: normalizedMessages.length,
                                        size: normalizedMessages.length,
                                        hasNext: false,
                                        hasPrevious: false,
                                        first: true,
                                        last: true
                                    },
                                    method: 'websocket'
                                });
                            } else {
                                reject(new Error('Unexpected WebSocket response format'));
                            }
                        };

                        webSocketService.on('messageHistory', handleResponse);
                    });

                } catch (wsError) {
                    console.error('❌ WebSocket request failed for paginated messages:', wsError.message);
                    throw wsError;
                }
            } else {
                throw new Error('WebSocket not connected. Backend only supports WebSocket for messages.');
            }

        } catch (error) {
            console.error('❌ Error getting paginated messages:', error);
            throw new Error('Failed to load paginated messages');
        }
    }

    // ✅ UTILITY METHODS for pagination and WebSocket-only operations

    // Create pagination parameters
    createPaginationParams(page = 0, size = 20, sortBy = 'timestamp', order = 'desc') {
        return {
            page: Math.max(0, page),
            size: Math.max(1, Math.min(100, size)), // Limit between 1-100
            sortBy,
            order
        };
    }

    // Load first page of messages
    async loadFirstPage(user1Id, user2Id, size = 20) {
        const options = this.createPaginationParams(0, size);
        return await this.getMessagesBetweenUsersPaginated(user1Id, user2Id, options);
    }

    // Load next page of messages
    async loadNextPage(user1Id, user2Id, currentPage = 0, size = 20) {
        const options = this.createPaginationParams(currentPage + 1, size);
        return await this.getMessagesBetweenUsersPaginated(user1Id, user2Id, options);
    }

    // Load previous page of messages
    async loadPreviousPage(user1Id, user2Id, currentPage = 1, size = 20) {
        const options = this.createPaginationParams(Math.max(0, currentPage - 1), size);
        return await this.getMessagesBetweenUsersPaginated(user1Id, user2Id, options);
    }

    // Check if WebSocket is ready for messaging
    isWebSocketReady() {
        return webSocketService.isConnected();
    }

    // Wait for WebSocket connection
    async waitForWebSocketConnection(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (this.isWebSocketReady()) {
                resolve(true);
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, timeout);

            const checkConnection = () => {
                if (this.isWebSocketReady()) {
                    clearTimeout(timeoutId);
                    resolve(true);
                } else {
                    setTimeout(checkConnection, 100);
                }
            };

            checkConnection();
        });
    }

    // Force WebSocket reconnection
    async forceReconnectWebSocket() {
        try {
            console.log('🔄 Force reconnecting WebSocket...');
            webSocketService.disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return await webSocketService.connectWithStoredToken();
        } catch (error) {
            console.error('❌ Force reconnection failed:', error);
            throw error;
        }
    }

    async sendGetMessages(user1Id, user2Id, page = 0, size = 20, order = 'desc', sortBy = ['timestamp']) {
        return new Promise((resolve, reject) => {
            if (!webSocketService.isConnected()) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            // Lắng nghe response
            const handleResponse = (data) => {
                webSocketService.off('messageHistory', handleResponse);
                resolve(data);
            };
            webSocketService.on('messageHistory', handleResponse);

            // Gửi request
            webSocketService.sendGetMessages(user1Id, user2Id, page, size, order, sortBy);

            // Timeout nếu không có phản hồi
            setTimeout(() => {
                webSocketService.off('messageHistory', handleResponse);
                reject(new Error('Timeout waiting for message history'));
            }, 15000);
        });
    }
}

export default new MessagesService();

/*
=== USAGE EXAMPLES FOR WebSocket-Only MESSAGING ===

// 1. Load messages with pagination (WebSocket only):
const result = await messagesService.getMessagesBetweenUsersPaginated(user1Id, user2Id, {
    page: 0,
    size: 20,
    sortBy: 'timestamp',
    order: 'desc'
});

// Result format:
// {
//     messages: [...], // Array of ChatMessageResponse
//     pagination: {
//         currentPage: 0,
//         totalPages: 5,
//         totalElements: 98,
//         size: 20,
//         hasNext: true,
//         hasPrevious: false,
//         first: true,
//         last: false
//     },
//     method: 'websocket'
// }

// 2. Load all messages (backward compatibility, WebSocket only):
const messages = await messagesService.getMessagesBetweenUsers(user1Id, user2Id);

// 3. Send message (WebSocket only):
const result = await messagesService.sendMessage({
    receiverId: 123,
    content: 'Hello!',
    messageType: 'text'
});

// 4. Utility methods for pagination:
const firstPage = await messagesService.loadFirstPage(user1Id, user2Id, 20);
const nextPage = await messagesService.loadNextPage(user1Id, user2Id, 0, 20);
const prevPage = await messagesService.loadPreviousPage(user1Id, user2Id, 1, 20);

// 5. Create pagination params:
const pagination = messagesService.createPaginationParams(0, 20, 'timestamp', 'desc');

// 6. WebSocket management:
const isReady = messagesService.isWebSocketReady();
await messagesService.waitForWebSocketConnection(); // Wait for connection
await messagesService.forceReconnectWebSocket(); // Force reconnect

// 7. Event listeners:
messagesService.on('newMessage', (message) => {
    console.log('New message received:', message);
});

messagesService.on('messageHistory', (result) => {
    if (result.pagination) {
        console.log('Paginated messages:', result.messages);
        console.log('Pagination info:', result.pagination);
    } else {
        console.log('All messages:', result);
    }
});

// 8. Get conversations (WebSocket only):
const conversations = await messagesService.getConversations();

// 9. Mark messages as read (WebSocket only):
await messagesService.markMessageAsRead(messageId);
await messagesService.markAllMessagesAsRead(senderId, receiverId);

// 10. Typing notifications (WebSocket only):
await messagesService.sendTypingNotification(receiverId, true);

// IMPORTANT NOTES:
// - All methods now require WebSocket connection
// - No REST API fallback available
// - Backend only supports WebSocket for messaging
// - Emergency mode can be used for testing when WebSocket fails
*/