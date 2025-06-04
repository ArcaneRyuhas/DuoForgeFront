import React from 'react';
import { ArtifactStages, GenerationStages } from '../constants/artifactStages';
import { generateJiraStories, generateMermaidDiagrams, generateCode } from '../api/generation';
import { Conversation } from '../api/conversation';
import { modifyJiraStories, modifyMermaidDiagrams, modifyCode } from '../api/modify';
import { extractProgrammingLanguage } from '../components/RenderUtils/contentAnalyzers';
import { downloadProject, downloadProjectBlob } from '../api/project';

/**
 * Executes the appropriate API call based on current artifact and generation stage
 * @param {string} artifactStage - Current artifact stage
 * @param {string} generationStage - Current generation stage
 * @param {string} userId - User ID
 * @param {string} inputText - User input text
 * @param {Array} files - Array of uploaded files (optional)
 * @param {Function} onProjectGenerated - Callback when project is generated (optional)
 * @returns {Promise<string>} Response text from the API
 */
export async function executeStageBasedAction(artifactStage, generationStage, userId, inputText, files=[], onProjectGenerated = null) {
    try {
        let response;
        
        console.log(`Current stage: ${artifactStage} - ${generationStage}`);
        console.log(`Files attached: ${files?.length || 0}`);
        
        if (artifactStage === ArtifactStages.Conversation) {
            response = await Conversation(userId, inputText);
        } else if (artifactStage === ArtifactStages.Documentation) {
            if (generationStage === GenerationStages.Creating) {
                response = await generateJiraStories(userId, inputText, files);
            } else if (generationStage === GenerationStages.Modifying) {
                response = await modifyJiraStories(userId, inputText);
            }
        } else if (artifactStage === ArtifactStages.Diagram) {
            if (generationStage === GenerationStages.Creating) {
                response = await generateMermaidDiagrams(userId, inputText);
            } else if (generationStage === GenerationStages.Modifying) {
                response = await modifyMermaidDiagrams(userId, inputText);
            }
        } else if (artifactStage === ArtifactStages.Code) {
            const programmingLanguage = extractProgrammingLanguage(inputText);
            if (generationStage === GenerationStages.Creating) {
                response = await generateCode(userId, inputText);
                
                // Handle project generation response
                if (response && response.project_id) {
                    console.log('Project generated with ID:', response.project_id);
                    
                    // Call the callback if provided (for UI updates)
                    if (onProjectGenerated) {
                        onProjectGenerated(response.project_id, response);
                    }
                    
                    // Handle download in background
                    handleProjectDownload(response.project_id, response);
                    
                    // Return formatted response immediately with download link
                    return formatProjectGenerationResponse(response, true);
                }
            } else if (generationStage === GenerationStages.Modifying) {
                response = await modifyCode(userId, inputText);
            }
        } else {
            throw new Error(`Unsupported stage: ${artifactStage}`);
        }

        return extractResponseText(response);
        
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

/**
 * Handles project download in the background
 * @param {string} projectId - The project ID
 * @param {Object} projectData - The full project response data
 */
async function handleProjectDownload(projectId, projectData) {
    try {
        console.log('Initiating download for project:', projectId);
        
        // Try to download the project (could return URL or Blob)
        const downloadResult = await downloadProject(projectId);
        
        if (typeof downloadResult === 'string') {
            // It's a URL, trigger URL download
            await triggerProjectDownload(downloadResult, projectId, projectData);
        } else if (downloadResult instanceof Blob) {
            // It's a blob, trigger blob download
            triggerBlobDownload(downloadResult, projectId, projectData);
        } else {
            throw new Error('Unexpected download result type');
        }
        
        console.log('Project download completed successfully');
        showDownloadNotification('success', `Project ${projectId} downloaded successfully!`);
        
    } catch (error) {
        console.error('Download failed:', error);
        showDownloadNotification('error', `Automatic download failed. Use the manual download link above.`, projectId);
    }
}

/**
 * Triggers the download of a project from URL
 * @param {string} downloadUrl - The URL to download the project
 * @param {string} projectId - The project ID for naming the file
 * @param {Object} projectData - Additional project data
 */
async function triggerProjectDownload(downloadUrl, projectId, projectData) {
    try {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Create a meaningful filename
        const technologies = projectData.technologies || [];
        const techString = technologies.length > 0 ? `_${technologies.join('_')}` : '';
        link.download = `project_${projectId}${techString}.zip`;
        
        link.style.display = 'none';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Project download initiated via URL for:', projectId);
    } catch (error) {
        console.error('Error triggering URL download:', error);
        throw error;
    }
}

/**
 * Triggers download from blob data
 * @param {Blob} blob - The file blob
 * @param {string} projectId - The project ID
 * @param {Object} projectData - Additional project data
 */
function triggerBlobDownload(blob, projectId, projectData = {}) {
    try {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Create a meaningful filename
        const technologies = projectData.technologies || [];
        const techString = technologies.length > 0 ? `_${technologies.join('_')}` : '';
        link.download = `project_${projectId}${techString}.zip`;
        
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
        
        console.log('Project download initiated via blob for:', projectId);
    } catch (error) {
        console.error('Error triggering blob download:', error);
        throw error;
    }
}

/**
 * Shows a download notification to the user
 * @param {string} type - 'success' or 'error'
 * @param {string} message - The notification message
 * @param {string} projectId - Project ID for manual download link (optional)
 */
function showDownloadNotification(type, message, projectId = null) {
    // You can implement this based on your UI framework
    // For now, we'll use console and could be replaced with toast notifications
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create a notification element
    const notification = document.createElement('div');
    
    let notificationContent = message;
    
    // Add manual download link for error notifications
    if (type === 'error' && projectId) {
        notificationContent += ` Click here for manual download.`;
    }
    
    notification.innerHTML = type === 'error' && projectId ? 
        `${message} <a href="${window.location.origin}/api/code/download-zip/${projectId}" target="_blank" style="color: white; text-decoration: underline;">Click here for manual download</a>` :
        notificationContent;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        cursor: pointer;
    `;
    
    // Make notification clickable for manual download
    if (type === 'error' && projectId) {
        notification.onclick = () => {
            window.open(`${window.location.origin}/api/code/download-zip/${projectId}`, '_blank');
        };
        notification.style.cursor = 'pointer';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 10 seconds (longer for error messages with download links)
    const timeout = type === 'error' ? 10000 : 5000;
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, timeout);
}

/**
 * Formats the project generation response for user display
 * @param {Object} response - The API response containing project info
 * @param {boolean} includeDownloadLink - Whether to include manual download link
 * @returns {string} Formatted response text
 */
function formatProjectGenerationResponse(response, includeDownloadLink = false) {
    const { project_id, technologies, files, message, readmecontent } = response;
    
    let formattedResponse = `# 🎉 Project Generated Successfully!\n\n`;
    formattedResponse += `**Project ID:** \`${project_id}\`\n\n`;
    
    if (technologies && technologies.length > 0) {
        formattedResponse += `**Technologies Used:** ${technologies.join(', ')}\n\n`;
    }
    
    if (files && files.length > 0) {
        formattedResponse += `**Generated Files:** ${files.length} files\n\n`;
        
        // Group files by directory for better visualization
        const fileStructure = groupFilesByDirectory(files);
        formattedResponse += `**Project Structure:**\n\`\`\`\n`;
        formattedResponse += formatFileStructure(fileStructure);
        formattedResponse += `\`\`\`\n\n`;
    }
    
    if (message) {
        formattedResponse += `**Status:** ${message}\n\n`;
    }
    
    // Download section
    formattedResponse += `## 📥 Download Options\n\n`;
    formattedResponse += `🔄 **Automatic Download:** Your project files are being prepared for download...\n\n`;
    
    if (includeDownloadLink) {
        // Add manual download link
        formattedResponse += `📎 **Manual Download:** If the automatic download doesn't work, you can download manually:\n`;
        formattedResponse += `[Click here to download your project](http://127.0.0.1:8000/api/code/download-zip/${project_id})\n\n`;
        formattedResponse += `*Right-click the link above and select "Save link as..." if needed.*\n\n`;
    }
    
    // Include README content if available
    if (readmecontent) {
        formattedResponse += `## 📋 Project Overview\n\n${readmecontent}\n\n`;
    }
    
    formattedResponse += `---\n\n`;
    formattedResponse += `✨ You can now use the generated code as a starting point for your project!\n\n`;
    formattedResponse += `💡 **Next Steps:**\n`;
    formattedResponse += `1. Extract the downloaded ZIP file\n`;
    formattedResponse += `2. Navigate to the project directory\n`;
    formattedResponse += `3. Follow the setup instructions in the README.md file\n`;
    formattedResponse += `4. Start developing your application!`;
    
    return formattedResponse;
}

/**
 * Groups files by their directory structure
 * @param {Array} files - Array of file objects
 * @returns {Object} Grouped file structure
 */
function groupFilesByDirectory(files) {
    const structure = {};
    
    files.forEach(file => {
        const pathParts = file.path.split('/');
        let current = structure;
        
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                // It's a file
                current[part] = {
                    type: 'file',
                    language: file.language || 'text',
                    content: file.content
                };
            } else {
                // It's a directory
                if (!current[part]) {
                    current[part] = { type: 'directory' };
                }
                current = current[part];
            }
        });
    });
    
    return structure;
}

/**
 * Formats file structure for display
 * @param {Object} structure - File structure object
 * @param {string} indent - Current indentation
 * @returns {string} Formatted structure string
 */
function formatFileStructure(structure, indent = '') {
    let result = '';
    
    Object.keys(structure).forEach(key => {
        const item = structure[key];
        if (item.type === 'directory') {
            result += `${indent}📁 ${key}/\n`;
            result += formatFileStructure(item, indent + '  ');
        } else {
            const icon = getFileIcon(item.language);
            result += `${indent}${icon} ${key}\n`;
        }
    });
    
    return result;
}

/**
 * Gets appropriate icon for file type
 * @param {string} language - File language/type
 * @returns {string} Emoji icon
 */
function getFileIcon(language) {
    const icons = {
        'javascript': '📜',
        'typescript': '📘',
        'python': '🐍',
        'html': '🌐',
        'css': '🎨',
        'json': '📋',
        'markdown': '📝',
        'yaml': '⚙️',
        'dockerfile': '🐳',
        'text': '📄'
    };
    
    return icons[language?.toLowerCase()] || '📄';
}

function extractResponseText(response) {
    console.log('API Response:', response);

    if (response.validation_result !== undefined) {
        if (response.validation_result === true) {
            return `Based on your input, I understand that you need:\n\n${response.requirements || response.jira_stories || response.content}`;
        } else {
            return `I re-wrote your requirements to make them robust. Let me know if they are what you wanted:\n\n${response.rewritten_requirements || response.requirements || response.content}`;
        }
    }

    if (response.error && response.error.includes('Requirement validation failed')) {
        return response.rewritten_requirements || response.requirements || "Your requirements need to be more detailed. Please provide additional information.";
    }
    
    if (response.jira_stories) return response.jira_stories;
    if (response.diagram) return response.diagram;
    if (response.code) return response.code;
    if (response.modified_content) return response.modified_content;
    if (response.response) return response.response;
    if (response.stories) return response.stories;
    if (response.content) return response.content;
    if (response.data) return response.data;
    
    console.warn('Unexpected API response format:', response);
    return JSON.stringify(response, null, 2);
}