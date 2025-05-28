import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import { useStageManager } from '../../hooks/stageManager';
import { ArtifactStages, GenerationStages } from '../../constants/artifactStages';
import { generateJiraStories, generateMermaidDiagrams, generateCode } from '../../api/generation';
import { Conversation } from '../../api/conversation';
import { modifyJiraStories, modifyMermaidDiagrams, modifyCode } from '../../api/modify';


function extractProgrammingLanguage(input) {
    const languages = [
        'Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS'
    ];
    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = languages.find(lang =>
        new RegExp(`\\b${escapeRegex(lang)}\\b`, 'i').test(input)
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

    // Enhanced function to detect Mermaid diagrams
    const isMermaidDiagram = (text) => {
        if (!text) return false;
        
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
            'erDiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline',
            'journey', 'quadrantChart', 'requirementDiagram', 'c4Context'
        ];
        
        // Remove code block markers if present
        const cleanText = text.replace(/^```(?:mermaid)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
        
        // Check if any line starts with a mermaid keyword
        const lines = cleanText.split('\n');
        return lines.some(line => {
            const trimmedLine = line.trim().toLowerCase();
            return mermaidKeywords.some(keyword => trimmedLine.startsWith(keyword));
        });
    };

    const isCodeContent = (text) => {
        if (!text) return false;
        
        const codeIndicators = [
            // Function/method definitions
            /function\s+\w+\s*\(/,
            /def\s+\w+\s*\(/,
            /public\s+\w+\s+\w+\s*\(/,
            /private\s+\w+\s+\w+\s*\(/,
            
            // Class definitions
            /class\s+\w+/,
            
            // Import statements
            /import\s+/,
            /from\s+\w+\s+import/,
            /#include\s*</,
            
            // Common programming constructs
            /\{\s*$/m, // Opening braces on their own line
            /^\s*\}/m, // Closing braces
            /;\s*$/m,  // Semicolons at end of lines
            
            // HTML/XML tags
            /<[^>]+>/,
            
            // CSS selectors and properties
            /\.[a-zA-Z-]+\s*\{/,
            /#[a-zA-Z-]+\s*\{/,
            /[a-zA-Z-]+\s*:\s*[^;]+;/
        ];
        
        const lines = text.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        
        if (nonEmptyLines.length === 0) return false;
        
        const codeLines = nonEmptyLines.filter(line => 
            codeIndicators.some(pattern => pattern.test(line))
        );
        
        // If more than 30% of non-empty lines look like code, treat as code
        return (codeLines.length / nonEmptyLines.length) > 0.3;
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

    const shouldUseMarkdownForResponse = (text, sender) => {
        // Debug logging
        console.log('Markdown check:', {
            artifactStage,
            generationStage,
            sender,
            hasMarkdownPatterns: shouldRenderAsMarkdown(text),
            isMermaid: isMermaidDiagram(text),
            isCode: isCodeContent(text),
            textPreview: text?.substring(0, 100)
        });

        if (artifactStage === ArtifactStages.Conversation) {
            return shouldRenderAsMarkdown(text);
        }

        // For Code stage 
        if(sender == 'bot' && 
            (artifactStage === ArtifactStages.Code ||
            artifactStage === 'Code' ||
            artifactStage === 'code') &&
            isCodeContent(text)) {
            return true;
        }

        // For Documentation stage 
        if (sender === 'bot' && 
            (artifactStage === ArtifactStages.Documentation || 
             artifactStage === 'Documentation' || 
             artifactStage === 'documentation')) {
            return true;
        }
        
        // For Diagram stage
        if (sender === 'bot' && 
            (artifactStage === ArtifactStages.Diagram || 
             artifactStage === 'Diagram' || 
             artifactStage === 'diagram')) {
            return true;
        }
        
        // Also check if the content naturally has markdown patterns
        const hasMarkdownPatterns = shouldRenderAsMarkdown(text);
        if (hasMarkdownPatterns) {
            return true;
        }
        
        return false;
    };

    const disableButtons = () => {
        const lastBotIndex = [...messages].reverse().findIndex(m => m.sender === 'bot');
        if (lastBotIndex !== -1) {
            const actualIndex = messages.length - 1 - lastBotIndex;
            setDisabledModifyIndexes(prev => [...prev, actualIndex]);
        }
    }

    const sendMessage = (text, user) => {
        let isMarkdown = shouldUseMarkdownForResponse(text, user);
        console.log('Sending message:', { sender: user, isMarkdown, textPreview: text?.substring(0, 50) });
        setMessages(ms => [...ms, { 
            sender: user, 
            text, 
            isMarkdown,
            artifactStage: artifactStage,
            forceCodeRendering: artifactStage === ArtifactStages.Code && user === 'bot'
        }]);
        setInputValue('');
    }

    const executeStageBasedAction = async (inputText) => {
        try {
            let response;
            const userId = user?.profile?.sub;
            
            console.log(`Current stage: ${artifactStage} - ${generationStage}`);
            if (artifactStage == ArtifactStages.Conversation){
                response = await Conversation(userId, inputText);
            } else if (artifactStage === ArtifactStages.Documentation) {
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
                    response = await generateCode(userId, inputText);
                } else if (generationStage === GenerationStages.Modifying) {
                    response = await modifyCode(userId, inputText);
                }
            } else {
                throw new Error(`Unsupported stage: ${artifactStage}`);
            }

            let responseText = '';
            console.log('API Response:', response); // Debug log to see the full response
            
            if (response.jira_stories) {
                responseText = response.jira_stories;
            } else if (response.diagram) {
                responseText = response.diagram;
            } else if (response.code) {
                responseText = response.code;
            } else if (response.modified_content) {
                responseText = response.modified_content;
            } else if (response.response) { 
                responseText = response.response;
            } else if (response.stories) { 
                responseText = response.stories;
            } else if (response.content) { 
                responseText = response.content;
            } else if (response.data) {
                responseText = response.data;
            } else {
                console.warn('Unexpected API response format:', response);
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
        // Don't allow modify if in Conversation stage
        if (artifactStage === ArtifactStages.Conversation) {
            return;
        }
        
        setGenerationStage(GenerationStages.Modifying);
        setIsWaitingResponse(false);

        setStageMessageType('modify');
        setShouldShowStageMessage(true);
    };

    const handleContinue = (index) => {
        // Don't allow continue if in Conversation stage
        if (artifactStage === ArtifactStages.Conversation) {
            return;
        }
        
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
            } else if (artifactStage === ArtifactStages.Conversation) {
                sendMessage("Great! Now we can have a normal conversation. What would you like to discuss?", 'bot');
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
        if (artifactStage === ArtifactStages.Conversation) {
            return 'Having a conversation';
        }
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

    // Check if buttons should be disabled (when in Conversation stage)
    const shouldDisableButtons = artifactStage === ArtifactStages.Conversation;

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
                    shouldDisableButtons={shouldDisableButtons}
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
                        artifactStage === ArtifactStages.Conversation ?
                            "Ask me anything! We're just having a conversation." : 
                            "Specify the requirements for your project!"
                    }
                </p>
            </div>
        </div>
    );
};

export default Main;