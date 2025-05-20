import React from 'react';
import './ChatContainer.css';

const ChatContainer = ({ messages }) => (
    <div className="chat-container">
        {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`}>
                {m.text}
            </div>
        ))}
    </div>
);

export default ChatContainer;