import React, { useState, useCallback, useMemo } from 'react';
import './ChatContainer.css';
import MarkdownRenderer from '../MarkDownRenderer/markdownRenderer1';
import { shouldRenderAsMarkdown } from '../RenderUtils/contentAnalyzers';
import { GenerationStages } from '../../constants/artifactStages'; 

const ChatContainer = ({ 
    messages, 
    onModify, 
    onContinue, 
    onUploadToJira, 
    disabledModifyIndexes, 
    shouldDisableButtons,
    artifactStage,
    generationStage, 
    isWaitingResponse, 
    currentInput = ''
}) => {

    const [persistedDiagrams, setPersistedDiagrams] = useState(new Map());

    const lastBotMessageIndex = messages.map((m,i) => ({...m, originalIndex:i}))
        .reverse()
        .find(m => m.sender === 'bot')?.originalIndex;

    const handleDiagramsRendered = useCallback((imageMap) => {
        setPersistedDiagrams(prev => {
            const newMap = new Map(prev);
            Object.entries(imageMap).forEach(([content, imageUrl]) => {
                newMap.set(content, imageUrl);
            });
            return newMap;
        });
    }, []);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes)/Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (fileType === 'audio') return '🎵';
        if (fileType === 'document') return '📄';
        return '📎';
    }

    const renderFilePreview = (file) => (
        <div key={file.id} className="file-preview" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '8px 12px',
            margin: '4px 0',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.9em'
        }}>
            <span style={{ marginRight: '8px' }}>{getFileIcon(file.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                    fontWeight: '500', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                }}>
                    {file.name}
                </div>
                <div style={{ 
                    fontSize: '0.8em', 
                    opacity: 0.8,
                    display: 'flex',
                    gap: '8px'
                }}>
                    <span>{file.type}</span>
                    <span>{formatFileSize(file.size)}</span>
                </div>
            </div>
        </div>
    );

    const EnhancedMarkdownRenderer = ({ content, messageIndex }) => {
        return (
            <MarkdownRenderer 
                content={content} 
                onDiagramsRendered={handleDiagramsRendered}
                persistedDiagrams={persistedDiagrams}
                key={`markdown-${messageIndex}`} 
            />
        );
    };

    const shouldUseMarkdownForMessage = (message) => {
        if (message.hasOwnProperty('useMarkdown')) {
            return message.useMarkdown;
        }
        if (message.hasOwnProperty('isMarkdown')) {
            return message.isMarkdown;
        }
        
        return shouldRenderAsMarkdown(message.text);
    };

    const isErrorMessage = (message) => {
        if (message.isError) {
            return true;
        }

        const errorPatterns = [
            /sorry.*error.*processing.*request/i,
            /please rewrite.*requirements.*more robust/i,
            /error.*occurred/i,
            /failed.*process/i,
            /unable.*complete/i,
            /requirement cannot be empty/i,
            /requirement is too short/i,
            /requirement is too long/i,
            /please provide more details/i,
            /keep it under \d+ characters/i,
            /validation service error/i
        ];
        
        return errorPatterns.some(pattern => pattern.test(message.text));
    };

    const shouldShowButtons = (message, messageIndex) => {
        return (
            message.sender === 'bot' &&
            messageIndex === lastBotMessageIndex && 
            !disabledModifyIndexes.includes(messageIndex) &&
            !shouldDisableButtons && 
            !isWaitingResponse &&
            !isErrorMessage(message) 
        );
    };

    // Helper function to check if bot is asking for initial setup/configuration
    const isBotAskingForSetup = (message) => {
        if (!message || message.sender !== 'bot') return false;
        
        const setupPatterns = [
            /what type.*diagram.*do you want/i,
            /let's set up.*project/i,
            /please specify.*how do you want/i,
            /what.*frontend/i,
            /what.*backend/i,
            /what.*database/i,
            /what.*deployment/i,
        ];
        
        return setupPatterns.some(pattern => pattern.test(message.text));
    };

    // Helper function to determine which buttons to show
    const getButtonsToShow = (message, messageIndex) => {
        if (!shouldShowButtons(message, messageIndex)) {
            return { showModify: false, showContinue: false };
        }
        
        const isSetupQuestion = isBotAskingForSetup(message);
        
        return {
            showModify: !isSetupQuestion, 
            showContinue: true 
        };
    };

    // Helper function to determine if bot is waiting for user input
    const isBotWaitingForInput = () => {
        return generationStage === GenerationStages.Modifying || 
               generationStage === GenerationStages.WaitingForInput || 
               (!isWaitingResponse && !generationStage); 
    };

    
    const shouldRequireInput = () => {
        console.log('Debug shouldRequireInput:', {
            generationStage,
            isWaitingResponse,
            artifactStage
        });
        
        if (isWaitingResponse) {
            console.log('Bot is waiting for response, input not required');
            return false;
        }
        
        const lastBotMessage = messages
            .slice()
            .reverse()
            .find(m => m.sender === 'bot');
        
        console.log('Last bot message:', lastBotMessage?.text);
        
        if (!lastBotMessage) {
            console.log('No bot message found, requiring input');
            return true;
        }
        
        const askingForInputPatterns = [
            /what.*would you like/i,
            /what.*do you want/i,
            /what.*type/i,
            /please specify/i,
            /what changes/i,
            /let's set up/i,
            /how do you want/i,
            /tell me/i,
            /describe/i,
            /\?/,  
        ];
        
        const isAskingForInput = askingForInputPatterns.some(pattern => {
            const matches = pattern.test(lastBotMessage.text);
            if (matches) console.log('Question pattern matched:', pattern);
            return matches;
        });
        
        console.log('Is asking for input:', isAskingForInput);
        
        
        const botJustGeneratedContent = [
            /here.*diagram/i,
            /here.*code/i,
            /generated.*diagram/i,
            /created.*diagram/i,
            /story.*created/i,
            /upload.*completed/i,
        ].some(pattern => pattern.test(lastBotMessage.text));
        
        if (botJustGeneratedContent && !isAskingForInput) {
            console.log('Bot just generated content, input not required');
            return false;
        }
        
        return isAskingForInput;
    };

    const handleContinueClick = (messageIndex) => {
        if (shouldRequireInput() && (!currentInput || currentInput.trim() === '')) {
            const confirm = window.confirm('You have not provided any input. Do you want to continue without input?');
            if (!confirm) {
                return;
            }
        }
        if (onContinue) {
            onContinue(messageIndex);
        }
    };

    const handleModifyClick = (messageIndex) => {
        if (shouldRequireInput() && (!currentInput || currentInput.trim() === '')) {
            const confirm = window.confirm('You have not provided any input. Do you want to continue without input?');
            if (!confirm) {
                return;
            }
        }
        if (onModify) {
            onModify(messageIndex);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages-wrapper">
                {messages.map((m, i) => {
                    const useMarkdown = shouldUseMarkdownForMessage(m);
                    const buttonsConfig = getButtonsToShow(m, i);

                    return (
                        <div key={i} className={`chat-bubble ${m.sender}`}>
                            {m.files && m.files.length > 0 && (
                                <div className="message-files">
                                    {m.files.map(renderFilePreview)}
                                </div>
                            )}
                            <div>
                                {useMarkdown ? (
                                    <EnhancedMarkdownRenderer content={m.text} messageIndex={i} />
                                ) : (
                                    <div>{m.text}</div>
                                )}
                            </div>
                            
                            {(buttonsConfig.showModify || buttonsConfig.showContinue) && (
                                <div className="chat-actions" style={{ marginTop: '10px' }}>
                                    {buttonsConfig.showModify && (
                                        <button onClick={() => handleModifyClick(i)}>Modify</button>
                                    )}
                                    {buttonsConfig.showContinue && (
                                        <button onClick={() => handleContinueClick(i)}>Continue</button>
                                    )}
                                </div>
                            )}
                            
                            {(buttonsConfig.showModify || buttonsConfig.showContinue) && artifactStage === 'Documentation' && (
                                <div className="chat-actions" style={{ marginTop: '10px' }}>
                                    <button onClick={() => {
                                        if (onUploadToJira) onUploadToJira(i);
                                    }}>
                                        Upload to Jira
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatContainer;