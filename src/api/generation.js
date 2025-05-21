import { apiPost } from './client';

/**
 * Calls the backend to generate Jira stories.
 * @param {string} userId - The user ID.
 * @param {string} requirement - The requirement text.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function generateJiraStories(userId, requirement) {
    return apiPost('/generate/jira-stories', {
        user_id: userId,
        requirement: requirement,
    });
}