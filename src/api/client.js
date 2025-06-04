const API_BASE_URL = 'http://127.0.0.1:8000';

export { API_BASE_URL }; // Export for use in other modules

export async function apiGet(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error(`GET ${endpoint} failed: ${response.status}`);
    }
    return response.json();
}

export async function apiPost(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`POST ${endpoint} failed: ${response.status}`);
    }
    return response.json();
}

/**
 * Download file from URL and return as blob
 * @param {string} url - The URL to download from
 * @returns {Promise<Blob>} Downloaded file as blob
 */
export async function downloadFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }
    return response.blob();
}