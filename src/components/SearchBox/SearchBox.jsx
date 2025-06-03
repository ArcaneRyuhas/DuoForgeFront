import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useFileUpload } from '../../hooks/useFileUpload';
import { assets } from '../../assets/assets';
import Icon from '@mdi/react';
import { mdiLeadPencil, mdiDeleteForever, mdiCircleOutline, mdiCheckCircle } from '@mdi/js'; 
import './SearchBox.css';


const SearchBox = ({ 
    value, 
    onChange, 
    onSend, 
    onFileUpload, 
    disabled,
    uploadedFiles = [],
    selectedFileIds=[],
    onFileSelect,
    onEditFile,
    onDeleteFile,
    isFileProcessed
 }) => {
    const {
        documentInputRef,
        audioInputRef,
        triggerDocumentUpload,
        triggerAudioUpload,
        handleDocumentChange,
        handleAudioChange
    } = useFileUpload(onFileUpload);

    const handleKeyDown = e => {
        if (e.key === 'Enter' && !disabled && (value.trim() || selectedFileIds.length>0)) {
            e.preventDefault(); 
            onSend(value.trim(), selectedFileIds);
         }
    };

    const handleSendClick = () => {
        if (!disabled && (value.trim() || selectedFileIds.length > 0)) {
        onSend(value.trim(), selectedFileIds);
        }
    };

    const handleUploadClick = (uploadFunction) => {
        if (!disabled) {
            uploadFunction();
        }
    };

    const handleFileToggle = (fileId) => {
        if (onFileSelect) {
            onFileSelect(fileId);
        }
    };

    const isFileSelected = (fileId) => {
        return selectedFileIds.includes(fileId);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (fileType === 'audio') return '🎵';
        if (fileType === 'document') return '📄';
        return '📎';
    };

    return (
        <div className="search-box">
            {uploadedFiles.length > 0 && (
                <div className="uploaded-files-display">
                    <div className="files-header">
                        <h4>Available Files:</h4>
                        {selectedFileIds.length > 0 && (
                            <span className="selected-count">
                                {selectedFileIds.length} selected
                            </span>
                        )}
                    </div>
                    <div className="files-list">
                        {uploadedFiles.map(file => {
                            const selected = isFileSelected(file.id);
                            const processed = isFileProcessed ? isFileProcessed(file.id) : true;
                            
                            return (
                                <div 
                                    key={file.id} 
                                    className={`file-item ${selected ? 'selected' : ''} ${!processed ? 'processing' : ''}`}
                                >
                                    <div className="file-selection-area" onClick={() => handleFileToggle(file.id)}>
                                        <button
                                            type="button"
                                            className="file-select-btn"
                                            disabled={disabled || !processed}
                                            title={selected ? "Remove from message" : "Include in message"}
                                        >
                                            <Icon 
                                                path={selected ? mdiCheckCircle : mdiCircleOutline} 
                                                size={0.9}
                                                color={selected ? '#007bff' : '#666'}
                                            />
                                        </button>
                                        <div className="file-main-info">
                                            <div className="file-name-row">
                                                <span className="file-icon">{getFileIcon(file.type)}</span>
                                                <span className="file-name" title={file.name}>{file.name}</span>
                                            </div>
                                            <div className="file-meta">
                                                <span className="file-type">{file.type}</span>
                                                <span className="file-size">{formatFileSize(file.size)}</span>
                                                {!processed && <span className="processing-indicator">Processing...</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="file-actions">
                                        <button
                                            onClick={() => onEditFile(file)}
                                            className="edit-file-btn"
                                            title="Edit file content"
                                            disabled={disabled || !processed}
                                        >
                                            <Icon path={mdiLeadPencil} size={0.8} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteFile(file.id)}
                                            className="delete-file-btn"
                                            title="Delete file"
                                            disabled={disabled}
                                        >
                                            <Icon path={mdiDeleteForever} size={0.8} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="search-input-container">
                <input
                    type="text"
                    placeholder="Input your project requirements here..."
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-label="Project requirements input"
                />
                <div className="icon-group">
                    <input
                        ref={documentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleDocumentChange}
                        style={{ display: 'none' }}
                        aria-label="Document file input"
                    />
                    <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg"
                        onChange={handleAudioChange}
                        style={{ display: 'none' }}
                        aria-label="Audio file input"
                    />

                    <button
                        type="button"
                        onClick={() => handleUploadClick(triggerDocumentUpload)}
                        className="upload-btn"
                        disabled={disabled}
                        title="Upload Document"
                        aria-label="Upload document file"
                    >
                        <img 
                            src={assets.file} 
                            alt=""
                            className="upload-icon"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => handleUploadClick(triggerAudioUpload)}
                        className="upload-btn"
                        disabled={disabled}
                        title="Upload Audio File"
                        aria-label="Upload audio file"
                    >
                        <img 
                            src={assets.mic_icon} 
                            alt=""
                            className="upload-icon"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={handleSendClick}
                        className="send-btn"
                        title="Send message"
                        aria-label="Send message"
                        disabled={disabled || (!value.trim() && selectedFileIds.length === 0)}
                    >
                        <img
                            src={assets.send_icon}
                            alt=""
                            className="send-icon"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

SearchBox.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSend: PropTypes.func.isRequired,
    onFileUpload: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    uploadedFiles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired
    })),
    selectedFileIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    onFileSelect: PropTypes.func,
    onEditFile: PropTypes.func,
    onDeleteFile: PropTypes.func,
    isFileProcessed: PropTypes.func
};

SearchBox.defaultProps = {
    disabled: false,
    uploadedFiles: [],
    selectedFileIds: [],
    onFileSelect: () => {},
    onEditFile: () => {},
    onDeleteFile: () => {},
    isFileProcessed: () => true
};

export default SearchBox;