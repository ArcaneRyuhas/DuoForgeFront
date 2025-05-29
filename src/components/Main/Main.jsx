import React, { useState } from 'react';
import './Main.css';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import { useStageManager } from '../../hooks/stageManager';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { getCurrentActionDescription, getGreetingText, getBottomInfoText } from '../../hooks/stageHelpers';
import { useMessageHandler } from '../../hooks/useMessageHandler1';
import { useStageTransitions } from '../../hooks/useStageTransition';
import { ArtifactStages } from '../../constants/artifactStages';

const Main = ({ user }) => {
    const [inputValue, setInputValue] = useState('');
    const {
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        reset,
    } = useStageManager();

    const {
        messages,
        isWaitingResponse,
        disabledModifyIndexes,
        setDisabledModifyIndexes,
        sendMessage,
        handleSendMessage
    } = useMessageHandler(artifactStage, generationStage, user);

    const { handleModify, handleContinue } = useStageTransitions(
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        sendMessage
    );

    const mainContainerRef = useAutoScroll(messages);

    const handleSend = (text) => {
        setInputValue('');
        handleSendMessage(text);
    };

    const handleContinueWithIndex = (index) => {
        handleContinue(index, setDisabledModifyIndexes);
    };

    // Check if buttons should be disabled (when in Conversation stage)
    const shouldDisableButtons = artifactStage === ArtifactStages.Conversation;

    const currentActionDescription = getCurrentActionDescription(artifactStage, generationStage);
    const greetingText = getGreetingText(artifactStage);
    const bottomInfoText = getBottomInfoText(artifactStage, isWaitingResponse, () => currentActionDescription);

    return (
        <div className="main">
            <Nav />
            <div className="main-container" ref={mainContainerRef}>
                <div className="greet">
                    <p>
                        <span>Hello!</span>
                    </p>
                    <p>
                        <span>{greetingText}</span>
                    </p>
                </div>
                <ChatContainer
                    messages={messages}
                    onModify={handleModify}
                    onContinue={handleContinueWithIndex}
                    disabledModifyIndexes={disabledModifyIndexes}
                    shouldDisableButtons={shouldDisableButtons}
                    artifactStage={artifactStage}
                    generationStage={generationStage}
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
                    {bottomInfoText}
                </p>
            </div>
        </div>
    );
};

export default Main;