import {useState, useCallback} from 'react';
import { shouldUseMarkdownForResponse } from '../components/RenderUtils/markDownDetector';
import { ArtifactStages } from '../constants/artifactStages';
import { executeStageBasedAction } from '../api/connectionApi';

export function useMessageHandler(artifactStage, generationStage, user, getFileById, isFileProcessed) {
    const [messages, setMessages] = useState([]);
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);

    const sendMessage = useCallback((text, sender, files =[], isError= false) => {
        const useMarkdown = shouldUseMarkdownForResponse(
            artifactStage,
            generationStage,
            text,
            sender
        );
        
        const messageObject = {
            sender,
            text,
            useMarkdown,
            artifactStage: artifactStage,
            generationStage: generationStage,
            timestamp: Date.now(),
            isMarkdown: useMarkdown,
            forceCodeRendering: artifactStage == ArtifactStages.Code && sender == 'bot', 
            files: files || [], 
            isError: isError
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

    const prepareFileContent = useCallback((fileIds) => {
        if (!fileIds || fileIds.length === 0) return '';

        const fileContents = fileIds.map(fileId => {
            const file = getFileById(fileId);
            if (!file) {
                console.warn(`File with ID ${fileId} not found`);
                return null;
            }
            const content = file.editedContent || file.originalContent;
            if (!content) {
                console.warn(`No content available for file: ${file.name}`);
                return null;
            }
            if (content.includes('Error reading file') || content.includes('Failed to extract')) {
                console.warn(`Skipping file with extraction error: ${file.name}`);
                return null;
            }
            return {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                content: content
            };
        }).filter(Boolean);

        if (fileContents.length === 0) return '';

        const formattedContent = fileContents.map(file => {
            const header = `--- FILE: ${file.fileName} (${file.fileType}, ${(file.fileSize / 1024).toFixed(1)}KB) ---`;
            const footer = `--- END OF ${file.fileName} ---`;
            return `${header}\n${file.content}\n${footer}`;
        }).join('\n\n');

        return `\n\nATTACHED FILES:\n${formattedContent}`;
    }, [getFileById]);

    const handleSendMessage = useCallback(async (text, fileIds = []) => {
        if (!text.trim() && (!fileIds || fileIds.length === 0)) return;
        if (fileIds.length > 0 && isFileProcessed) {
            const unprocessedFiles = fileIds.filter(id => !isFileProcessed(id));
            if (unprocessedFiles.length > 0) {
                sendMessage("Please wait for all files to finish processing before sending.", 'bot');
                return;
            }
        }

        disableButtons();
        setIsWaitingResponse(true);

        let completeMessage = text.trim();
        const fileContent = prepareFileContent(fileIds);
        
        if (fileContent) {
            completeMessage += fileContent;
        }
        const selectedFiles = fileIds.map(fileId => {
            const file = getFileById(fileId);
            if (!file) {
                return null;
            }
            return {
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.size
            };
        }).filter(Boolean);

        sendMessage(text, 'user', selectedFiles);

        if (fileIds && fileIds.length > 0) {
            const fileNames = fileIds.map(id => {
                const file = getFileById(id);
                return file ? file.name : `File ${id}`;
            }).join(', ');
            sendMessage(`Processing your request with attached files: ${fileNames}...`, 'bot');
        }

        try {
            const userId = user?.profile?.sub;

            const selectedFilesForAPI = fileIds.map(fileId => {
            const file = getFileById(fileId); 
            if (!file) {
                console.warn(`File with ID ${fileId} not found`);
                return null;
            }
            return {
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.size,
                content: file.editedContent || file.originalContent,
                originalContent: file.originalContent,
                editedContent: file.editedContent
            };
        }).filter(Boolean);

            const response = await executeStageBasedAction(
                artifactStage, 
                generationStage, 
                userId, 
                completeMessage, 
                selectedFilesForAPI
            );

            let parsedResponse;
            try {
                parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
            } catch (parseError) {
                sendMessage(response, 'bot');
                return;
            }

            if (parsedResponse && typeof parsedResponse.is_valid === 'boolean') {
                if (!parsedResponse.is_valid) {
                    const validationMessage = parsedResponse.jira_stories || "Please rewrite your requirements to make them more robust.";
                    sendMessage(validationMessage, 'bot');
                } else {
                    sendMessage(parsedResponse.jira_stories, 'bot');
                }
            } else {
                const responseText = parsedResponse.jira_stories || response;
                sendMessage(responseText, 'bot');
            }
        } catch (error) {
            console.error('Error processing request:', error);
            sendMessage("Sorry, there was an error processing your request. Please re-write your requirements.", 'bot');
        } finally {
            setIsWaitingResponse(false);
        }
        }, [artifactStage, generationStage, user, disableButtons, sendMessage, prepareFileContent, getFileById, isFileProcessed]);
    
        return {
        messages,
        isWaitingResponse,
        disabledModifyIndexes,
        setDisabledModifyIndexes,
        sendMessage,
        handleSendMessage
    };
}