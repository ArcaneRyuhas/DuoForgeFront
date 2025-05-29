import React from 'react';
import './ChatContainer.css';
import MarkdownRenderer from '../Renderer/markdownRenderer1';
import { shouldUseMarkdownForResponse } from '../Renderer/markDownDetector';

const ChatContainer = ({ 
    messages, 
    onModify, 
    onContinue, 
    disabledModifyIndexes, 
    shouldDisableButtons,
    artifactStage,
    generationStage 
}) => {
    const lastBotMessageIndex = messages.map((m,i) => ({...m, originalIndex:i}))
        .reverse()
        .find(m => m.sender === 'bot')?.originalIndex;

    return (
        <div className="chat-container">
            {messages.map((m, i) => {
                // Determine if this message should use markdown rendering
                const useMarkdown = shouldUseMarkdownForResponse(
                    artifactStage, 
                    generationStage, 
                    m.text, 
                    m.sender
                );

                return (
                    <div key={i} className={`chat-bubble ${m.sender}`} style={{ 
                        backgroundColor: m.sender === 'bot' ? '#f0f0f0' : '#007bff',
                        color: m.sender === 'bot' ? '#333' : 'white',
                        padding: '1rem',
                        margin: '0.5rem',
                        borderRadius: '0.5rem',
                        minHeight: '50px' // Ensure minimum height
                    }}>
                        {/* Render text based on markdown detection */}
                        <div>
                            {useMarkdown ? (
                                <MarkdownRenderer content={m.text} />
                            ) : (
                                <div>{m.text}</div>
                            )}
                        </div>
                        
                        {/* Only show buttons for the last bot message and if it's not disabled */}
                        {m.sender === 'bot' &&
                         i === lastBotMessageIndex && 
                         !disabledModifyIndexes.includes(i) &&
                         !shouldDisableButtons && (
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