// EMERGENCY OVERRIDE - Hoàn toàn bypass WebSocket
// Sử dụng khi WebSocket bị stuck và không thể vào ChatScreen

// ✅ DISABLED - Allow WebSocket to work normally
const EMERGENCY_ENABLED = false;

if (EMERGENCY_ENABLED) {
    console.log('🆘🆘🆘 EMERGENCY OVERRIDE ACTIVATED 🆘🆘🆘');
    console.log('📋 WebSocket đã bị disable hoàn toàn');
    console.log('📋 App sẽ chạy với mock data');
    console.log('📋 ChatScreen sẽ hoạt động bình thường');

    // Global emergency flag
    global.EMERGENCY_OVERRIDE = true;

    // Override console để track WebSocket calls
    const originalLog = console.log;
    console.log = (...args) => {
        const message = args.join(' ');
        
        // Block WebSocket related logs để giảm spam
        if (message.includes('STOMP') || 
            message.includes('WebSocket') || 
            message.includes('Waiting for') ||
            message.includes('🔌')) {
            // Chỉ show emergency logs
            if (message.includes('EMERGENCY')) {
                originalLog('🆘 [EMERGENCY]', ...args);
            }
            return;
        }
        
        originalLog(...args);
    };

    // Override WebSocket constructor để prevent tạo WebSocket connections
    if (typeof global !== 'undefined') {
        global.WebSocket = class MockWebSocket {
            constructor() {
                console.log('🆘 [EMERGENCY] Blocked WebSocket creation');
                this.readyState = 3; // CLOSED
            }
            
            send() { console.log('🆘 [EMERGENCY] Blocked WebSocket send'); }
            close() { console.log('🆘 [EMERGENCY] Blocked WebSocket close'); }
            addEventListener() { console.log('🆘 [EMERGENCY] Blocked WebSocket event'); }
        };
    }
} else {
    console.log('✅ Emergency Override DISABLED - WebSocket enabled');
    global.EMERGENCY_OVERRIDE = false;
}

export default {
    enabled: EMERGENCY_ENABLED,
    message: EMERGENCY_ENABLED ? 'Emergency Override Active - WebSocket Disabled' : 'Normal Operation'
}; 