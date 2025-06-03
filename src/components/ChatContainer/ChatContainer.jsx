import React from 'react';
import './ChatContainer.css';
import MarkdownRenderer from '../MarkDownRenderer/markdownRenderer1';
import { shouldUseMarkdownForResponse } from '../RenderUtils/markDownDetector';

const ChatContainer = ({ 
    messages, 
    onModify, 
    onContinue, 
    disabledModifyIndexes, 
    shouldDisableButtons,
    artifactStage,
    generationStage,
    isWaitingResponse
}) => {
    const lastBotMessageIndex = messages.map((m,i) => ({...m, originalIndex:i}))
        .reverse()
        .find(m => m.sender === 'bot')?.originalIndex;

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

    return (
        <div className="chat-container">
            {messages.map((m, i) => {
                let useMarkdown;
                if (m.hasOwnProperty('useMarkdown')) {
                    useMarkdown = m.useMarkdown;
                } else if (m.hasOwnProperty('isMarkdown')) {
                    useMarkdown = m.isMarkdown;
                } else {
                    useMarkdown = shouldUseMarkdownForResponse(
                        artifactStage, 
                        generationStage, 
                        m.text, 
                        m.sender
                    );
                }

                return (
                    <div key={i} className={`chat-bubble ${m.sender}`} style={{ 
                        backgroundColor: m.sender === 'bot' ? '#f0f0f0' : '#007bff',
                        color: m.sender === 'bot' ? '#333' : 'white',
                        padding: '1rem',
                        margin: '0.5rem',
                        borderRadius: '0.5rem',
                        minHeight: '50px'
                    }}>
                        {m.files && m.files.length > 0 && (
                            <div className="message-files" style={{ marginBottom: '8px' }}>
                                {m.files.map(renderFilePreview)}
                            </div>
                        )}
                        <div>
                            {useMarkdown ? (
                                <MarkdownRenderer content={m.text} />
                            ) : (
                                <div>{m.text}</div>
                            )}
                        </div>
                        
                        {m.sender === 'bot' &&
                         i === lastBotMessageIndex && 
                         !disabledModifyIndexes.includes(i) &&
                         !shouldDisableButtons && 
                         !isWaitingResponse && (
                            <div className="chat-actions" style={{ marginTop: '10px' }}>
                                <button onClick={() => onModify && onModify(i)}>Modify</button>
                                <button onClick={() => onContinue && onContinue(i)}>Continue</button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ChatContainer;