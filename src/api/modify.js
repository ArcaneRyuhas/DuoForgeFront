import { apiPost } from './client';

/**
 * Calls the backend to modify Jira stories.
 * @param {string} userId - The user ID.
 * @param {string} modificationJiraPrompt - The modification text to the Jira.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function modifyJiraStories(userId, modificationJiraPrompt) {
    return apiPost('/documentation/modify', {
        user_id: userId,
        modification_prompt: modificationJiraPrompt,
    });
}

/**
 * Calls the backend to modify Mermaid Diagrams.
 * @param {string} userId - The user ID.
 * @param {string} modificationDiagramPrompt - The modification text to the diagram.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function modifyMermaidDiagrams(userId, modificationDiagramPrompt) {
    return apiPost('/diagram/modify', {
        user_id: userId,
        modification_prompt: modificationDiagramPrompt,
    });
}

/**
 * Calls the backend to modify code.
 * @param {string} userId - The user ID.
 * @param {string} modificationCodePrompt - The modification text to the code.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function modifyCode(userId, modificationCodePrompt) {
    return apiPost('/code/modify', {
        user_id: userId,
        modification_prompt: modificationCodePrompt,
    });
}