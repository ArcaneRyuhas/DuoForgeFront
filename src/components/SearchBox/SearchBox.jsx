import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useFileUpload } from '../../hooks/useFileUpload';
import { assets } from '../../assets/assets';
import Icon from '@mdi/react';
import { mdiLeadPencil, mdiDeleteForever } from '@mdi/js'; 
import './SearchBox.css';


const SearchBox = ({ 
    value, 
    onChange, 
    onSend, 
    onFileUpload, 
    disabled,
    uploadedFiles = [],
    onEditFile,
    onDeleteFile
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
        if (e.key === 'Enter' && !disabled && value.trim()) {
            e.preventDefault(); 
            onSend(value.trim());
         }
    };

    const handleSendClick = () => {
        if (!disabled && value.trim()) {
        onSend(value.trim());
        }
    };

    const handleUploadClick = (uploadFunction) => {
        if (!disabled) {
            uploadFunction();
        }
    };

    return (
        <div className="search-box">
            {/* Uploaded Files Display - Shows above the input */}
            {uploadedFiles.length > 0 && (
                <div className="uploaded-files-display">
                    <h4>Uploaded Files:</h4>
                    <div className="files-list">
                        {uploadedFiles.map(file => (
                            <div key={file.id} className="file-item">
                                <div className="file-main-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-type">({file.type})</span>
                                    <span className="file-size">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                                <div className="file-actions">
                                    <button
                                        onClick={() => onEditFile(file)}
                                        className="edit-file-btn"
                                        title="Edit file content"
                                        disabled={disabled}
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
                        ))}
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
    onEditFile: PropTypes.func,
    onDeleteFile: PropTypes.func
};

SearchBox.defaultProps = {
    disabled: false,
    uploadedFiles: [],
    onEditFile: () => {},
    onDeleteFile: () => {}
};

export default SearchBox;