import React from 'react';
import {useState, useEffect, useCallback} from 'react';
import {ArtifactStages, GenerationStages} from '../constants/artifactStages';

export function useStageTransitions(
    artifactStage, 
    generationStage, 
    advanceArtifactStage, 
    setGenerationStage,
    sendMessage
) {
    const [shouldShowStageMessage, setShouldShowStageMessage] = useState(false);
    const [stageMessageType, setStageMessageType] = useState('');

    const handleModify = useCallback((index) => {
        if (artifactStage === ArtifactStages.Conversation) {
            return;
        }
        
        setGenerationStage(GenerationStages.Modifying);
        setStageMessageType('modify');
        setShouldShowStageMessage(true);
    }, [artifactStage, setGenerationStage]);

    const handleContinue = useCallback((index, setDisabledModifyIndexes) => {
        if (artifactStage === ArtifactStages.Conversation) {
            return;
        }
        
        setDisabledModifyIndexes(prev => [...prev, index]);
        advanceArtifactStage();
        setGenerationStage(GenerationStages.Creating);
        setStageMessageType('continue');
        setShouldShowStageMessage(true);
    }, [artifactStage, advanceArtifactStage, setGenerationStage]);

    useEffect(() => {
        console.log('Generation stage advanced to:', generationStage);
        if (shouldShowStageMessage && stageMessageType === 'modify' && generationStage === GenerationStages.Modifying) {
            sendMessage("What changes would you like me to apply?", 'bot');
            setShouldShowStageMessage(false);
        }
    }, [generationStage, shouldShowStageMessage, stageMessageType, sendMessage]);

    useEffect(() => {
        console.log('Artifact stage advanced to:', artifactStage);
        if (shouldShowStageMessage && stageMessageType === 'continue') {
            if (artifactStage === ArtifactStages.Diagram) {
                sendMessage("What type of diagram do you want me to generate?", 'bot');
            } else if (artifactStage === ArtifactStages.Code) {
                sendMessage("Let's set up your project! Please tell me:\n\n• Frontend: React, Vue, Angular, or other?\n• Backend: Python, Java, Node.js, or other?\n• Database: MySQL, PostgreSQL, MongoDB, or other?\n• Deployment: AWS, Azure, Google Cloud, or local?", 'bot');
            } else if (artifactStage === ArtifactStages.Conversation) {
                sendMessage("Great! Now we can have a normal conversation. What would you like to discuss?", 'bot');
            }
            setShouldShowStageMessage(false);
        }
    }, [artifactStage, shouldShowStageMessage, stageMessageType, sendMessage]);

    return {
        handleModify,
        handleContinue
    };
}