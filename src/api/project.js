import { apiGet, apiPost, API_BASE_URL } from './client';

/**
 * Gets the download URL for a generated project or downloads directly
 * @param {string} projectId - The project ID to download
 * @returns {Promise<string|Blob>} The download URL or blob data
 */
export async function downloadProject(projectId) {
    try {
        console.log('Requesting download for project:', projectId);
        
        // First try to get download URL via JSON API
        try {
            const response = await apiGet(`/code/download-zip/${projectId}`);
            
            // Extract download URL from response
            if (response.download_url) {
                return response.download_url;
            } else if (response.url) {
                return response.url;
            }
        } catch (jsonError) {
            // If JSON parsing fails, the endpoint might be returning binary data directly
            console.log('JSON API failed, trying direct download:', jsonError.message);
        }
        
        // Try direct binary download
        return await downloadProjectBlob(projectId);
        
    } catch (error) {
        console.error('Error downloading project:', error);
        throw new Error(`Failed to download project: ${error.message}`);
    }
}

/**
 * Direct download project as blob (for endpoints that return binary data)
 * @param {string} projectId - The project ID to download
 * @returns {Promise<Blob>} The project ZIP file as a blob
 */
export async function downloadProjectBlob(projectId) {
    try {
        console.log('Downloading project blob for:', projectId);
        
        // Use GET request without body (since GET requests cannot have a body)
        let response = await fetch(`${API_BASE_URL}/code/download-zip/${projectId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/zip, application/octet-stream, */*'
            }
            // Removed body and Content-Type since this is a GET request
        });
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        // Check if response is actually a ZIP file
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        return await response.blob();
    } catch (error) {
        console.error('Error downloading project blob:', error);
        throw error;
    }
}

/**
 * Get project details and status
 * @param {string} projectId - The project ID to check
 * @returns {Promise<Object>} Project details and status
 */
export async function getProjectStatus(projectId) {
    try {
        return await apiGet(`/project/status/${projectId}`);
    } catch (error) {
        console.error('Error getting project status:', error);
        throw error;
    }
}

/**
 * List all projects for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} List of user's projects
 */
export async function getUserProjects(userId) {
    try {
        return await apiGet(`/projects/user/${userId}`);
    } catch (error) {
        console.error('Error getting user projects:', error);
        throw error;
    }
}