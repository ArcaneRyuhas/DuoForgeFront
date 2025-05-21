import React from 'react';
import './ChatContainer.css';

const ChatContainer = ({ messages, onModify, onContinue, disabledModifyIndexes }) => (
    <div className="chat-container">
        {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`}>
                {m.text}
                {m.sender === 'bot' && (
                    <div className="chat-actions">
                        <button
                            onClick={() => onModify && onModify(i)}
                            disabled={disabledModifyIndexes.includes(i)}>
                            Modify
                        </button>
                        <button 
                        onClick={() => onContinue && onContinue(i)}
                        disabled={disabledModifyIndexes.includes(i)}>
                        Continue
                        </button>
                    </div>
                )}
            </div>
        ))}
    </div>
);

export default ChatContainer;