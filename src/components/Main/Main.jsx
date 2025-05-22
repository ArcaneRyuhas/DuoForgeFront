import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { generateJiraStories } from '../../api/generation';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import DynamicButtonGroup from '../DynamicButtonGroup/DynamicButtonGroup';

const Main = ({user}) => {
    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [messages, setMessages] = useState([]);
    const [selectedTechnologies, setSelectedTechnologies] = useState({
        diagrams: [],
        code: []
    });

    // Define your button groups data
    const buttonGroups = [
        {
            title: 'Diagrams',
            buttons: ['UML', 'Graphviz', 'Mermaid'],
            icon: assets.bulb_icon
        },
        {
            title: 'Code',
            buttons: [
                'Python', 'JavaScript', 'Java', 'C++', 'C#', 
                'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 
                'SQL', 'HTML', 'CSS'
            ],
            icon: assets.code_icon
        }
    ];

    const handleSelectionChange = (category, activeButtons) => {
        setSelectedTechnologies(prev => ({
            ...prev,
            [category]: activeButtons
        }));
    };

    const handleSend = text => {
        if (!text.trim()) return;

        const lastBotIndex = [...messages].reverse().findIndex(m => m.sender === 'bot');
        if (lastBotIndex !== -1) {
            const actualIndex = messages.length - 1 - lastBotIndex;
            setDisabledModifyIndexes(prev => [...prev, actualIndex]);
        }
        
        setMessages(ms => [...ms, { sender: 'user', text }]);
        setInputValue('');
        setIsWaitingResponse(true);

        // You can now include selected technologies in your API call
        const requestData = {
            message: text,
            selectedTechnologies: selectedTechnologies
        };

        generateJiraStories(user?.profile?.sub, text)
            .then(data => {
                setMessages(ms => [...ms, { sender: 'bot', text: data.jira_stories }]);
                setIsWaitingResponse(false);
            })
            .catch(err => {
                setMessages(ms => [...ms, { sender: 'bot', text: "Sorry, there was an error." }]);
                setIsWaitingResponse(false);
                console.error(err);
            });
    };

    const handleModify = (index) => {
        setIsWaitingResponse(prev => !prev);
    };

    const handleContinue = (index) => {
        setDisabledModifyIndexes(prev => [...prev, index]);
        console.log('Continue clicked for message', index);
    };

    const mainContainerRef = useRef(null);
    const prevMessagesLength = useRef(0);

    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            if (mainContainerRef.current) {
                mainContainerRef.current.scrollTo({
                    top: mainContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    // Debug: Log selected technologies when they change
    useEffect(() => {
        console.log('Selected technologies:', selectedTechnologies);
    }, [selectedTechnologies]);

    return (
        <div className="main">
            <Nav />
            <div className="main-container" ref={mainContainerRef}>
                <div className="greet">
                    <p>
                        <span>Hello!</span>
                    </p>
                    <p>
                        <span>What are we developing today?</span>
                    </p>
                </div>
                <div className="cards">
                    {buttonGroups.map(group => (
                        <DynamicButtonGroup
                            key={group.title}
                            title={group.title}
                            buttons={group.buttons}
                            icon={group.icon}
                            onSelectionChange={handleSelectionChange}
                        />
                    ))}
                </div>
                <ChatContainer
                    messages={messages}
                    onModify={handleModify}
                    onContinue={handleContinue}
                    disabledModifyIndexes={disabledModifyIndexes}
                />
            </div>
            <div className="main-bottom">
                <SearchBox
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onSend={handleSend}
                    disabled={isWaitingResponse}
                />
                <p className="bottom-info">
                    specify the outputs you require below!
                </p>
            </div>
        </div>
    );
};

export default Main;