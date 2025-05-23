import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import { useStageManager } from '../../hooks/stageManager';
import { ArtifactStages, GenerationStages } from '../../constants/artifactStages';
import { generateJiraStories, generateMermaidDiagrams, generateCode } from '../../api/generation';
import { modifyJiraStories, modifyMermaidDiagrams, modifyCode } from '../../api/modify';

function extractProgrammingLanguage(input) {
    const languages = [
        'Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS'
    ];
    const found = languages.find(lang =>
        new RegExp(`\\b${lang}\\b`, 'i').test(input)
    );
    return found || '';
}

const Main = ({ user }) => {
    const [disabledModifyIndexes, setDisabledModifyIndexes] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const [messages, setMessages] = useState([]);
    const {
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        reset,
    } = useStageManager();
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

    const executeStageBasedAction = async (inputText) => {
        try {
            let response;
            const userId = user?.profile?.sub;
            
            console.log(`Current stage: ${artifactStage} - ${generationStage}`);
            if (artifactStage === ArtifactStages.Documentation) {
                if (generationStage === GenerationStages.Creating) {
                    response = await generateJiraStories(userId, inputText);
                } else if (generationStage === GenerationStages.Modifying) {
                    response = await modifyJiraStories(userId, inputText);
                }
            } else if (artifactStage === ArtifactStages.Diagram) {
                if (generationStage === GenerationStages.Creating) {
                    response = await generateMermaidDiagrams(userId, inputText);
                } else if (generationStage === GenerationStages.Modifying) {
                    response = await modifyMermaidDiagrams(userId, inputText);
                }
            } else if (artifactStage === ArtifactStages.Code) {
                const programmingLanguage = extractProgrammingLanguage(inputText);
                if (generationStage === GenerationStages.Creating) {
                    response = await generateCode(userId, inputText, programmingLanguage);
                } else if (generationStage === GenerationStages.Modifying) {
                    response = await modifyCode(userId, inputText, programmingLanguage);
                }
            } else {
                throw new Error(`Unsupported stage: ${artifactStage}`);
            }

            let responseText = '';
            if (response.jira_stories) {
                responseText = response.jira_stories;
            } else if (response.diagram) {
                responseText = response.diagram;
            } else if (response.code) {
                responseText = response.code;
            } else if (response.modified_content) {
                responseText = response.modified_content;
            } else {
                responseText = JSON.stringify(response, null, 2);
            }

            sendMessage(responseText, 'bot');
            setIsWaitingResponse(false);
            
        } catch (error) {
            console.error('API call failed:', error);
            sendMessage("Sorry, there was an error processing your request.", 'bot');
            setIsWaitingResponse(false);
        }
    };

    const handleSend = text => {
        if (!text.trim()) return;

        disableButtons();
        setInputValue('');
        setIsWaitingResponse(true);
        sendMessage(text, 'user');
        executeStageBasedAction(text);
    };
        const [shouldShowStageMessage, setShouldShowStageMessage] = useState(false);
        const [stageMessageType, setStageMessageType] = useState('');

    const handleModify = (index) => {
        setGenerationStage(GenerationStages.Modifying);
        setIsWaitingResponse(false);

        setStageMessageType('modify');
        setShouldShowStageMessage(true);
    };

    const handleContinue = (index) => {
        setDisabledModifyIndexes(prev => [...prev, index]);
        advanceArtifactStage();
        setGenerationStage(GenerationStages.Creating);

        setStageMessageType('continue');
        setShouldShowStageMessage(true);
    };

    useEffect(() => {
        console.log('Generation stage advanced to:', generationStage);
        if (shouldShowStageMessage && stageMessageType === 'modify' && generationStage === GenerationStages.Modifying) {
            sendMessage("What changes would you like me to apply?", 'bot');
            setShouldShowStageMessage(false);
        }
    }, [generationStage]);

    useEffect(() => {
        console.log('Artifact stage advanced to:', artifactStage);
        if (shouldShowStageMessage && stageMessageType === 'continue') {
            if (artifactStage === ArtifactStages.Diagram) {
                sendMessage("What type of diagram do you want me to generate?", 'bot');
            } else if (artifactStage === ArtifactStages.Code) {
                sendMessage("In which programming language would you like the code?", 'bot');
            }
            setShouldShowStageMessage(false);
        }
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

    const getCurrentActionDescription = () => {
        const actions = {
            [ArtifactStages.Documentation]: {
                [GenerationStages.Creating]: 'Generating documentation (Jira stories)',
                [GenerationStages.Modifying]: 'Modifying documentation'
            },
            [ArtifactStages.Diagram]: {
                [GenerationStages.Creating]: 'Generating diagrams',
                [GenerationStages.Modifying]: 'Modifying diagrams'
            },
            [ArtifactStages.Code]: {
                [GenerationStages.Creating]: 'Generating code',
                [GenerationStages.Modifying]: 'Modifying code'
            }
        };
        return actions[artifactStage]?.[generationStage] || 'Ready for input';
    };

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
                    {isWaitingResponse ? 
                        `Processing: ${getCurrentActionDescription()}...` : 
                        "Specify the requirements for your project!"
                    }
                </p>
            </div>
        </div>
    );
};

export default Main;