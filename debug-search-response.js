// debug-search-response.js - Test search API response format
import UserProfileService from './src/services/UserProfileService';

const testSearchAPI = async () => {
    try {
        console.log('🔍 Testing search API...');
        
        const response = await UserProfileService.searchUsers('l');
        
        console.log('📊 Full Response:', JSON.stringify(response, null, 2));
        console.log('📊 Response type:', typeof response);
        console.log('📊 Response keys:', Object.keys(response));
        
        // Check if it's a Page object
        if (response.content) {
            console.log('📄 Page object detected');
            console.log('📄 Content:', response.content);
            console.log('📄 Content length:', response.content.length);
            console.log('📄 Page info:', {
                totalElements: response.totalElements,
                totalPages: response.totalPages,
                size: response.size,
                number: response.number
            });
        }
        
        // Check if it's a direct array
        if (Array.isArray(response)) {
            console.log('📋 Direct array detected');
            console.log('📋 Length:', response.length);
        }
        
        // Check if it has success wrapper
        if (response.success !== undefined) {
            console.log('✅ Success wrapper detected');
            console.log('✅ Success:', response.success);
            console.log('✅ Data:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('❌ Error response:', error.response?.data);
    }
};

// Export for use
export default testSearchAPI;

// Auto-run if in debug mode
if (__DEV__) {
    console.log('🚀 Auto-running search API test...');
    testSearchAPI();
} 