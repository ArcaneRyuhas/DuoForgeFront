import React from 'react';
import { ArtifactStages, GenerationStages } from '../constants/artifactStages';
import { generateJiraStories, generateMermaidDiagrams, generateCode } from '../api/generation';
import { Conversation } from '../api/conversation';
import { modifyJiraStories, modifyMermaidDiagrams, modifyCode } from '../api/modify';
import { extractProgrammingLanguage } from '../components/Renderer/Renderer';

export async function executeStageBasedAction(artifactStage, generationStage, userId, inputText) {
    try {
        let response;
        
        console.log(`Current stage: ${artifactStage} - ${generationStage}`);
        
        if (artifactStage === ArtifactStages.Conversation) {
            // In conversation stage, just call the conversation API directly
            response = await Conversation(userId, inputText);
        } else if (artifactStage === ArtifactStages.Documentation) {
            if (generationStage === GenerationStages.Creating) {
                response = await generateJiraStories(userId, inputText);
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