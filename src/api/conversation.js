import { apiPost } from './client';

/**
 * Calls the backend to generate code with comprehensive debugging.
 * @param {string} userId - The user ID.
 * @param {string} inputText - The input message.
 * @param {string} [token] - Optional token (will auto-retrieve if not provided).
 * @returns {Promise<Object>} The response from the backend.
 */
export async function Conversation(inputText, files = []) {
    const userData = JSON.parse(localStorage.getItem('infycode_user'));
    let finalToken = userData.id_token; // ✅ Use ID token since it works in your backend
    const userId = userData.user_info.user_id;

    // Validate token exists
    if (!finalToken) {
        console.error('❌ No access token found');
        throw new Error('No access token available. Please log in again.');
    }

    // Step 4: Prepare API call
    const requestData = {
        user_id: userId,
        message: inputText,
    };

    // Step 5: Make API call
    try {
        if (Array.isArray(files) && files.length > 0) {
            requestData.files = files.map(file => ({
                name: file.name,
                content: file.content,
                type: file.type || 'text/plain',
                size: file.size
            }));
        }
        console.log('🔍 Request data being sent:', JSON.stringify(requestData, null, 2));

        const response = await apiPost('/chat/', requestData, {
            headers: {
                'Authorization': `Bearer ${finalToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response;
    } catch (error) {
        console.error('❌ API call failed:', {
            errorType: error.constructor.name,
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data
        });

        // Handle specific auth errors
        if (error.response?.status === 401) {
            console.warn('🔒 401 Unauthorized - clearing stored tokens');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('infycode_user');
            throw new Error('Authentication failed. Please log in again.');
        }

        if (error.response?.status === 403) {
            console.warn('🚫 403 Forbidden - token might be valid but lacking permissions');
        }

        throw error;
    }
}

// Helper function to clean invalid tokens
export function cleanInvalidTokens() {
    console.group('🧹 CLEANING INVALID TOKENS');

    const authToken = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('infycode_user');

    console.log('Before cleaning:', { authToken, userData });

    // Check auth_token
    if (authToken) {
        try {
            const parsed = JSON.parse(authToken);
            if (Array.isArray(parsed) || typeof parsed === 'object') {
                console.log('🗑️ Removing invalid auth_token (array/object)');
                localStorage.removeItem('auth_token');
            }
        } catch (e) {
            // It's a string, check if it's valid
            if (typeof authToken !== 'string' || authToken.length === 0) {
                console.log('🗑️ Removing invalid auth_token (empty/wrong type)');
                localStorage.removeItem('auth_token');
            }
        }
    }

    // Check user data tokens
    if (userData) {
        try {
            const parsed = JSON.parse(userData);
            let modified = false;

            if (parsed.token && (Array.isArray(parsed.token) || typeof parsed.token === 'object')) {
                console.log('🗑️ Removing invalid token from user data');
                delete parsed.token;
                modified = true;
            }

            if (parsed.access_token && (Array.isArray(parsed.access_token) || typeof parsed.access_token === 'object')) {
                console.log('🗑️ Removing invalid access_token from user data');
                delete parsed.access_token;
                modified = true;
            }

            if (modified) {
                localStorage.setItem('infycode_user', JSON.stringify(parsed));
                console.log('✅ Updated user data without invalid tokens');
            }
        } catch (error) {
            console.error('❌ Error processing user data:', error);
        }
    }

    console.groupEnd();
}

export default Conversation;