import {useState, useCallback} from 'react';
import { shouldUseMarkdownForResponse } from '../components/Renderer/markDownDetector';
import { ArtifactStages } from '../constants/artifactStages';
import { executeStageBasedAction } from '../api/connectionApi';


export function useMessageHandler(artifactStage, generationStage, user) {
    const [messages, setMessages] = useState([]);
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);

    const sendMessage = useCallback((text, sender) => {
        const isMarkdown = shouldUseMarkdownForResponse(text, sender, artifactStage);
        console.log('Sending message:', { sender, isMarkdown, textPreview: text?.substring(0, 50) });
        
        setMessages(prevMessages => [...prevMessages, { 
            sender, 
            text, 
            isMarkdown,
            artifactStage: artifactStage,
            forceCodeRendering: artifactStage === ArtifactStages.Code && sender === 'bot'
        }]);
    }, [artifactStage]);

    const disableButtons = useCallback(() => {
        // Don't disable buttons in Conversation stage since there are no modify/continue buttons
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

    const handleSendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        disableButtons();
        setIsWaitingResponse(true);
        sendMessage(text, 'user');

        try {
            const userId = user?.profile?.sub;
            const responseText = await executeStageBasedAction(artifactStage, generationStage, userId, text);
            sendMessage(responseText, 'bot');
        } catch (error) {
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