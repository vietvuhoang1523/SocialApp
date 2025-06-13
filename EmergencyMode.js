// Emergency Mode - Bypass WebSocket hoàn toàn
// Sử dụng khi WebSocket bị timeout và không thể connect

export const EMERGENCY_MODE = {
    // enabled: true, // Set to true when backend is not running
    enabled: false, // Set to true when backend is not running
    // WebSocket settings
    websocket: {
        mockConnection: true,
        simulateDelay: 1000
    },

    // Messages settings
    messages: {
        useMockData: true,
        autoGenerateReplies: true,
        simulateTyping: true
    },

    // Video Call settings
    videoCalls: {
        useMockData: true,
        simulateCallDelay: 2000,
        autoAcceptCalls: false,
        mockCallDuration: 120, // seconds
        simulateCallQuality: 'GOOD'
    },

    // API settings
    api: {
        mockResponses: true,
        simulateNetworkDelay: true,
        defaultDelay: 1500
    },

    mockMessages: [
        {
            id: 'emergency-1',
            content: 'Tin nhắn thử nghiệm 1',
            senderId: 3,
            receiverId: 1,
            createdAt: new Date().toISOString(),
            read: false,
            delivered: true
        },
        {
            id: 'emergency-2', 
            content: 'Tin nhắn thử nghiệm 2',
            senderId: 1,
            receiverId: 3,
            createdAt: new Date(Date.now() - 60000).toISOString(),
            read: true,
            delivered: true
        }
    ]
};

// Emergency message service
export const EmergencyMessageService = {
    async getMessagesBetweenUsers(user1Id, user2Id) {
        console.log('🆘 [EMERGENCY] Using mock messages for users:', user1Id, user2Id);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return EMERGENCY_MODE.mockMessages.filter(msg => 
            (msg.senderId === user1Id && msg.receiverId === user2Id) ||
            (msg.senderId === user2Id && msg.receiverId === user1Id)
        );
    },
    
    async sendMessage(messageData) {
        console.log('🆘 [EMERGENCY] Mock sending message:', messageData);
        
        const newMessage = {
            id: `emergency-${Date.now()}`,
            content: messageData.content,
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            createdAt: new Date().toISOString(),
            read: false,
            delivered: true
        };
        
        EMERGENCY_MODE.mockMessages.push(newMessage);
        return newMessage;
    }
}; 