import { apiPost } from './client';

export async function validateJiraConnection(payload) {
    return apiPost('/jira/validate', payload);
}

export async function uploadStoriesToJira(payload) {
    return apiPost('/jira/upload', payload);
}