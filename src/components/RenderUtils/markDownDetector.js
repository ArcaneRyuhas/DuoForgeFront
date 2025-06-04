import { shouldRenderAsMarkdown, isMermaidDiagram, isCodeContent } from './contentAnalyzers'
import { ArtifactStages } from '../../constants/artifactStages';
import React from 'react';

export const shouldUseMarkdownForResponse = (artifactStage, generationStage, text, sender) => {
    // Debug logging
    console.log('Markdown check:', {
        artifactStage,
        generationStage,
        sender,
        hasMarkdownPatterns: shouldRenderAsMarkdown(text),
        isMermaid: isMermaidDiagram(text),
        isCode: isCodeContent(text),
        textPreview: text?.substring(0, 100)
    });

    if (artifactStage === ArtifactStages.Conversation) {
        return shouldRenderAsMarkdown(text);
    }

    // For Code stage 
    if(sender === 'bot' && 
        (artifactStage === ArtifactStages.Code ||
        artifactStage === 'Code' ||
        artifactStage === 'code') &&
        isCodeContent(text)) {
        return true;
    }

    // For Documentation stage 
    if (sender === 'bot' && 
        (artifactStage === ArtifactStages.Documentation || 
         artifactStage === 'Documentation' || 
         artifactStage === 'documentation')) {
        return true;
    }
    
    // For Diagram stage
    if (sender === 'bot' && 
        (artifactStage === ArtifactStages.Diagram || 
         artifactStage === 'Diagram' || 
         artifactStage === 'diagram')) {
        return true;
    }
    
    // Also check if the content naturally has markdown patterns
    const hasMarkdownPatterns = shouldRenderAsMarkdown(text);
    if (hasMarkdownPatterns) {
        return true;
    }
    
    return false;
};