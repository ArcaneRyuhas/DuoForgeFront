import React from 'react';
import { ArtifactStages, GenerationStages } from '../constants/artifactStages';
import { generateJiraStories, generateMermaidDiagrams, generateCode } from '../api/generation';
import { Conversation } from '../api/conversation';
import { modifyJiraStories, modifyMermaidDiagrams, modifyCode } from '../api/modify';
import { extractProgrammingLanguage } from '../components/RenderUtils/contentAnalyzers';

/**
 * Executes the appropriate API call based on current artifact and generation stage
 * @param {string} artifactStage - Current artifact stage
 * @param {string} generationStage - Current generation stage
 * @param {string} userId - User ID
 * @param {string} inputText - User input text
 * @param {Array} files - Array of uploaded files (optional)
 * @returns {Promise<string>} Response text from the API
 */
export async function executeStageBasedAction(artifactStage, generationStage, userId, inputText, files=[]) {
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