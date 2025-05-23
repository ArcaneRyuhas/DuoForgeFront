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


/**
 * Calls the backend to generate Mermaid Diagrams.
 * @param {string} userId - The user ID.
 * @param {string} diagram_type - The type of diagram required.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function generateMermaidDiagrams(userId, diagram_type) {
    return apiPost('/generate/diagram', {
        user_id: userId,
        diagram_type: diagram_type,
    });
}

/**
 * Calls the backend to generate code.
 * @param {string} userId - The user ID.
 * @param {string} programmingLanguage - The programming language required.
 * @returns {Promise<Object>} The response from the backend.
 */

export async function generateCode(userId, inputText, programmingLanguage) {
    return apiPost('/generate/code', {
        user_id: userId,
        prompt: inputText,
        programming_language: programmingLanguage,
    }); 
}

