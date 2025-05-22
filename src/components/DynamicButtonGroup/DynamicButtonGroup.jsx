import React, { useState } from 'react';
import './DynamicButtonGroup.css';

const DynamicButtonGroup = ({ title, buttons, icon, onSelectionChange }) => {
    const [activeButtons, setActiveButtons] = useState([]);

    const handleButtonClick = (buttonName) => {
        setActiveButtons(prev => {
            const newActiveButtons = prev.includes(buttonName)
                ? prev.filter(name => name !== buttonName)
                : [...prev, buttonName];
            
            // Call the callback function to notify parent component
            if (onSelectionChange) {
                onSelectionChange(title.toLowerCase(), newActiveButtons);
            }
            
            return newActiveButtons;
        });
    };

    return (
        <div className="dynamic-button-group">
            <p>{title}</p>
            <div className="button-container">
                {buttons.map(button => (
                    <button
                        key={button}
                        className={`tech-button ${activeButtons.includes(button) ? 'active' : ''}`}
                        onClick={() => handleButtonClick(button)}
                    >
                        {button}
                    </button>
                ))}
            </div>
            <img src={icon} alt={`${title} icon`} />
        </div>
    );
};

export default DynamicButtonGroup;