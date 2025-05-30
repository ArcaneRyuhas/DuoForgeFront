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
        if (e.key === 'Enter') {
            onSend(value);
        }
    };

    const handleClick = () => {
        onSend(value);
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
            />
            <div className="icon-group">
                <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleDocumentChange}
                    style={{ display: 'none' }}
                />
                <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*, .mp3, .wav, .m4a, .ogg"
                    onChange={handleAudioChange}
                    style={{ display: 'none' }}
                />
                <img 
                    src={assets.file} 
                    alt="document"
                    onClick={triggerDocumentUpload}
                    className='upload-icon'
                    title= 'Upload Document'
                />
                <img 
                    src={assets.mic_icon} 
                    alt="mic"
                    onClick={triggerAudioUpload}
                    className='upload-icon'
                    title= 'Upload Audio File' />
                <img
                    src={assets.send_icon}
                    alt="send"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </div>
    );
};

SearchBox.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSend: PropTypes.func.isRequired,
    onFileUpload: PropTypes.func.isRequired,
    disable: PropTypes.bool
};

export default SearchBox;
