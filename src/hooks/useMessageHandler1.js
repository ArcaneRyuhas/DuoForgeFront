import {useState, useCallback} from 'react';
import { shouldUseMarkdownForResponse } from '../components/RenderUtils/markDownDetector';
import { ArtifactStages } from '../constants/artifactStages';
import { executeStageBasedAction } from '../api/connectionApi';


export function useMessageHandler(artifactStage, generationStage, user) {
    const [messages, setMessages] = useState([]);
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);

    const sendMessage = useCallback((text, sender) => {
        const useMarkdown = shouldUseMarkdownForResponse(
            artifactStage,
            generationStage,
            text,
            sender
        );

        console.log('Sending message:', { 
            sender, 
            useMarkdown, 
            artifactStage,
            generationStage,
            textPreview: text?.substring(0, 50) });
        
        const messageObject = {
            sender,
            text,
            useMarkdown,
            artifactStage: artifactStage,
            generationStage: generationStage,
            timestamp: Date.now(),
            isMarkdown: useMarkdown,
            forceCodeRendering: artifactStage == ArtifactStages.Code && sender == 'bot'
        };

        setMessages(prevMessages => [...prevMessages, messageObject]);
    }, [artifactStage, generationStage]);

    const disableButtons = useCallback(() => {
        if (artifactStage === ArtifactStages.Conversation) {
            return;
        }
        
        setMessages(currentMessages => {
            const lastBotIndex = [...currentMessages].reverse().findIndex(m => m.sender === 'bot');
            if (lastBotIndex !== -1) {
                const actualIndex = currentMessages.length - 1 - lastBotIndex;
                setDisabledModifyIndexes(prev => [...prev, actualIndex]);
            }
            return currentMessages;
        });
    }, [artifactStage]);

    const handleSendMessage = useCallback(async (text, files =[]) => {
        if (!text.trim()) return;

        disableButtons();
        setIsWaitingResponse(true);
        sendMessage(text, 'user');

        if (files && files.length > 0 ) {
            console.log('Sending files with message:', files.map(f => ({ name: f.name, size: f.size })));
        }

        try {
            const userId = user?.profile?.sub;
            const responseText = await executeStageBasedAction(artifactStage, generationStage, userId, text, files);
            sendMessage(responseText, 'bot');
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            sendMessage("Sorry, there was an error processing your request.", 'bot');
        } finally {
            setIsWaitingResponse(false);
        }
    }, [artifactStage, generationStage, user, disableButtons, sendMessage]);

    return {
        messages,
        isWaitingResponse,
        disabledModifyIndexes,
        setDisabledModifyIndexes,
        sendMessage,
        handleSendMessage
    };
}