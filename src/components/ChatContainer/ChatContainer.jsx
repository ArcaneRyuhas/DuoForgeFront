import React from 'react';
import './ChatContainer.css';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';

const ChatContainer = ({ messages, onModify, onContinue, disabledModifyIndexes }) => (
    <div className="chat-container">
        {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`} style={{ 
                backgroundColor: m.sender === 'bot' ? '#f0f0f0' : '#007bff',
                color: m.sender === 'bot' ? '#333' : 'white',
                padding: '1rem',
                margin: '0.5rem',
                borderRadius: '0.5rem',
                minHeight: '50px' // Ensure minimum height
            }}>
                {/* Only show the rendered text */}
                <div>
                    {m.isMarkdown ? (
                        <MarkdownRenderer content={m.text} />
                    ) : (
                        <div>{m.text}</div>
                    )}
                </div>
                
                {m.sender === 'bot' && (
                    <div className="chat-actions" style={{ marginTop: '10px' }}>
                        <button onClick={() => onModify && onModify(i)}>Modify</button>
                        <button onClick={() => onContinue && onContinue(i)}>Continue</button>
                    </div>
                )}
            </div>
        ))}
    </div>
);

export default ChatContainer;