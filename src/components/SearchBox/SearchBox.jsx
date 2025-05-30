import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useFileUpload } from '../../hooks/useFileUpload';
import { assets } from '../../assets/assets';
import './SearchBox.css';


const SearchBox = ({ value, onChange, onSend, onFileUpload, disabled }) => {
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
                    disabled={disabled || !value.trim()}
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
    );
};

SearchBox.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSend: PropTypes.func.isRequired,
    onFileUpload: PropTypes.func.isRequired,
    disabled: PropTypes.bool 
};

SearchBox.defaultProps = {
    disabled: false
};

export default SearchBox;