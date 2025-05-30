import React, { useState } from 'react';
import './Main.css';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import FileEditor from '../FileEditor/FileEditor';
import UploadedFiles from '../UploadedFiles/uploadedFiles';

// hooks
import { useStageManager } from '../../hooks/stageManager';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useMessageHandler } from '../../hooks/useMessageHandler1';
import { useStageTransitions } from '../../hooks/useStageTransition';
import { useFileManager } from '../../hooks/useFileManager';

//Helpers
import {
    getCurrentActionDescription,
    getGreetingText,
    getBottomInfoText
} from '../../hooks/stageHelpers';

//Constants
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

    const {
        uploadedFiles,
        editingFile,
        addFile,
        updateFileContent,
        deleteFile,
        startEditingFile,
        stopEditingFile
    } = useFileManager();

    const mainContainerRef = useAutoScroll(messages);

    const handleSend = (file) => {
        setInputValue('');
        handleSendMessage(inputValue);
    };

    const handleFileUpload = (file) => {
        addFile(file);
    };

    const handleContinueWithIndex = (index) => {
        handleContinue(index, setDisabledModifyIndexes);
    };

    
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

                <UploadedFiles
                    files = {uploadedFiles}
                    onEditFile={startEditingFile}
                    onDeleteFile={deleteFile}
                />
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
                    onFileUpload={handleFileUpload}
                    disabled={isWaitingResponse}
                />
                <p className="bottom-info">
                    {bottomInfoText}
                </p>
            </div>
            {editingFile && (
                <FileEditor
                    file={editingFile}
                    onSave={updateFileContent}
                    onClose={stopEditingFile}
                    onDelete={deleteFile}
                />
            )}
        </div>
    );
};

export default Main;