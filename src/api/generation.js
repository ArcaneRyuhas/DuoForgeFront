import { apiPost } from './client';

/**
 * Calls the backend to generate Jira stories.
 * @param {string} userId - The user ID.
 * @param {string} requirement - The requirement text.
 * @param {Array} files - Array of uplaoded files (optional)
 * @returns {Promise<Object>} The response from the backend.
 */
export async function generateJiraStories(userId, requirement, files= []) {
    const payload = {
        user_id: "userId", 
        requirement: requirement,
    };
    if (files && files.length > 0) {
        payload.files = files.map(file => ({
            name: file.name,
            content: file.content,
            type: file.type || 'text/plain',
            size: file.size
        }));
    }
    return apiPost('/documentation/generate', payload);
}


/**
 * Calls the backend to generate Mermaid Diagrams.
 * @param {string} userId - The user ID.
 * @param {string} diagram_type - The type of diagram required.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function generateMermaidDiagrams(userId, diagram_type) {
    return apiPost('/diagram/generate', {
        user_id: "userId",
        diagram_type: diagram_type,
    });
}

/**
 * Calls the backend to generate code.
 * @param {string} userId - The user ID.
 * @param {string} programmingLanguage - The programming language required.
 * @returns {Promise<Object>} The response from the backend.
 */

export async function generateCode(userId, inputText) {
    return apiPost('/code/generate-project', {
        user_id: "userId",
        prompt: inputText,
    }); 
}



