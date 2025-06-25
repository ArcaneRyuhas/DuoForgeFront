import { apiPost } from "./client";

/**
 * Calls the backend to authenticate a user.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} The response from the backend.    
 */

export async function authenticateUser(username, password) {
    return apiPost('/session/login/', { 
        username: username,
        password: password 
    });
}