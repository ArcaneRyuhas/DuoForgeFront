import React, { useState } from 'react';
import './Main.css';
import SearchBox from '../SearchBox/SearchBox';
import Nav from '../Nav/Nav';
import ChatContainer from '../ChatContainer/ChatContainer';
import FileEditor from '../FileEditor/FileEditor';

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
    const[selectedFileIds, setSelectedFileIds] = useState([]);

    const {
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        reset,
    } = useStageManager();

    const fileManager = useFileManager();

    const {
        uploadedFiles,
        editingFile,
        addFile,
        updateFileContent,
        deleteFile,
        removeFiles,
        startEditingFile,
        stopEditingFile,
        getFileById,
        isFileProcessed
    } = fileManager;

    const {
        messages,
        isWaitingResponse,
        disabledModifyIndexes,
        setDisabledModifyIndexes,
        sendMessage,
        handleSendMessage
    } = useMessageHandler(artifactStage, generationStage, user, getFileById, isFileProcessed);

    const { handleModify, handleContinue } = useStageTransitions(
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        sendMessage
    );

    const mainContainerRef = useAutoScroll(messages);

    const handleSend = async (message, fileIds=[]) => {
        const selectedFiles = fileIds.map(fileId => {
        const file = getFileById(fileId);
        console.log(`File ${fileId}:`, file);
        return file;
    }).filter(Boolean);
    
        setInputValue('');
        setSelectedFileIds([]);

        await handleSendMessage(message, fileIds);

        if (fileIds.length > 0){
            fileIds.forEach(fileId => {
                removeFiles(fileId);
            });
        }
    };

    const handleFileUpload = (file) => {
        let type = 'document';
        if (file.type && file.type.startsWith('audio')) {
            type = 'audio';
        } else if (file.type && (file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text'))) {
            type = 'document'
        }
        addFile(file, type);
    };

    const handleFileSelect = (fileId) => {
        setSelectedFileIds(prev => {
            if (prev.includes(fileId)) {
                return prev.filter(id => id !== fileId);
            } else {
                return [...prev, fileId];
            }
        });
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

                <ChatContainer
                    messages={messages}
                    onModify={handleModify}
                    onContinue={handleContinueWithIndex}
                    disabledModifyIndexes={disabledModifyIndexes}
                    shouldDisableButtons={shouldDisableButtons}
                    artifactStage={artifactStage}
                    generationStage={generationStage}
                    isWaitingResponse={isWaitingResponse}
                />
            </div>
            <div className="main-bottom">
                <SearchBox
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onSend={handleSend}
                    onFileUpload={handleFileUpload}
                    disabled={isWaitingResponse}
                    uploadedFiles={uploadedFiles}
                    selectedFileIds={selectedFileIds}
                    onFileSelect= {handleFileSelect}
                    onEditFile={startEditingFile}
                    onDeleteFile={deleteFile}
                    isFileProcessed={isFileProcessed}
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