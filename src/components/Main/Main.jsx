import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { generateJiraStories } from '../../api/generation';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import DynamicButtonGroup from '../DynamicButtonGroup/DynamicButtonGroup';
import { useStageManager } from '../../hooks/stageManager';
import { ArtifactStages, GenerationStages } from '../../constants/artifactStages';


const Main = ({ user }) => {
    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [messages, setMessages] = useState([]);
    const [selectedTechnologies, setSelectedTechnologies] = useState({
        diagrams: [],
        code: []
    });
    const {
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        reset,
    } = useStageManager();

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

    const shouldRenderAsMarkdown = (text) => {
        if (!text) return false;

        const markdownPatterns = [
            /^#+\s/m,
            /\*\*.*\*\*/,
            /\*.*\*/,
            /`.*`/,
            /```[\s\S]*```/,
            /^\s*[-*+]\s/m,
            /^\s*\d+\.\s/m,
            /^\s*>/m,
            /\[.*\]\(.*\)/,
        ];

        return markdownPatterns.some(pattern => pattern.test(text));
    };

    const disableButtons = () => {
        const lastBotIndex = [...messages].reverse().findIndex(m => m.sender === 'bot');
        if (lastBotIndex !== -1) {
            const actualIndex = messages.length - 1 - lastBotIndex;
            setDisabledModifyIndexes(prev => [...prev, actualIndex]);
        }
    }

    const sendMessage = (text, user) => {
        let isMarkdown = shouldRenderAsMarkdown(text);
        setMessages(ms => [...ms, { sender: user, text, isMarkdown}]);
        setInputValue('');
    }

    const handleSend = text => {
        if (!text.trim()) return;

        disableButtons();
        setInputValue('');
        setIsWaitingResponse(true);
        sendMessage(text, 'user');
        setGenerationStage(GenerationStages.Modifying);

        generateJiraStories(user?.profile?.sub, text)
            .then(data => {
                sendMessage(data.jira_stories, 'bot');
            })
            .catch(err => {
                sendMessage("Sorry, there was an error.", 'bot');
                //LOG the error for debugging
                console.error(err);
            });
    };

    const handleModify = (index) => {
        setIsWaitingResponse(prev => !prev);
    };

    const handleContinue = (index) => {
        setDisabledModifyIndexes(prev => [...prev, index]);
        advanceArtifactStage();
        setGenerationStage(GenerationStages.Creating);
    };

    useEffect(() => {
        console.log('Generation stage advanced to:', generationStage);
    }, [generationStage]);

    useEffect(() => {
        console.log('Artifact stage advanced to:', artifactStage);
    }, [artifactStage]);

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