import { apiPost } from './client';
/**
 * Calls the backend to generate code.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The response from the backend.
 */

export async function Conversation(userId, inputText) {
    return apiPost('/conversation/', {
        user_id: userId,
        content: inputText,
    }); 
}