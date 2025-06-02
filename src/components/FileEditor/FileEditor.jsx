import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiLeadPencil, mdiDeleteForever } from '@mdi/js';
import { extractFileContent } from '../../utils/fileExtractors';
import './FileEditor.css';

const FileEditor = ({ file, onSave, onClose, onDelete }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        loadFileContent();
    }, [file]);

    const loadFileContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
        let loadedText = ''; 
        if (file.editedContent) { 
            loadedText = file.editedContent instanceof Promise 
                         ? await file.editedContent 
                         : file.editedContent;
            console.log('Using edited content:', String(loadedText || '').length, 'characters');
        }
        if (!loadedText && file.originalContent) { 
            loadedText = file.originalContent instanceof Promise
                         ? await file.originalContent
                         : file.originalContent;
            console.log('Using original content:', String(loadedText || '').length, 'characters');
        }

        if (!loadedText) {
            const realFile = file.file || file;
            loadedText = await extractFileContent(realFile);
            console.log('Extracted content from file:', String(loadedText || '').length, 'characters');
        }
        
        setContent(String(loadedText || '')); 

    } catch (error) {
        console.error('Error reading file:', error);
        setError(error.message || 'Failed to read file content');
        setContent(''); 
    } finally {
        setIsLoading(false);
    }
};

    const handleContentChange = (e) => {
        setContent(e.target.value);
        setHasChanges(true);
    };

    const handleSave = () => {
        console.log('Saving content:', content.length, 'characters');
        onSave(file.id, content);
        setHasChanges(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirm = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
            if (!confirm) return;
        }
        const savedContent = file.editedContent !== null && file.editedContent !== undefined
        ? String(file.editedContent) 
        : String(file.originalContent || '');
        setContent(savedContent);
        setHasChanges(false);
        setIsEditing(false);
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isLoading) {
        return (
            <div className="file-editor">
                <div className="file-editor-header">
                    <h3>Loading {file.name}...</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="file-editor-content loading">
                    <div className="loading-spinner"></div>
                    <p>Reading file content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="file-editor">
                <div className="file-editor-header">
                    <h3>{file.name}</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="file-editor-content error">
                    <p className="error-message">{error}</p>
                    <button onClick={loadFileContent} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="file-editor">
            <div className="file-editor-header">
                <div className="file-info">
                    <h3>{file.name}</h3>
                    <span className="file-meta">
                        {file.type} • {(file.size / 1024).toFixed(1)} KB
                        {hasChanges && <span className="unsaved-indicator"> • Unsaved changes</span>}
                    </span>
                </div>
                <div className="file-actions">
                    {!isEditing ? (
                        <button onClick={toggleEdit} className="edit-btn">
                            <Icon path={mdiLeadPencil} size={0.8} /> 
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handleSave} 
                                className="save-btn"
                                disabled={!hasChanges}
                            >
                                💾 Save
                            </button>
                            <button onClick={handleCancel} className="cancel-btn">
                                ❌ Cancel
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => onDelete(file.id)} 
                        className="delete-btn"
                        title="Delete file"
                    >
                        <Icon path={mdiDeleteForever} size={0.8} />
                    </button>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
            </div>
            
            <div className="file-editor-content">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        className="content-editor"
                        placeholder="Start typing to edit the content..."
                        spellCheck="true"
                    />
                ) : (
                    <div className="content-viewer">
                        <pre>{typeof content == 'string' ? content: ''}</pre>
                    </div>
                )}
                
                <div className="editor-stats">
                    <span>Characters: {typeof content == 'string' ? content.length: 0}</span>
                    <span>Words: {typeof content == 'string' ? content.split(/\s+/).filter(word => word.length > 0).length: 0}</span>
                    <span>Lines: {typeof content == 'string' ? content.split('\n').length: 0}</span>
                    {isEditing && (
                        <span className="keyboard-shortcuts">
                            Ctrl+S to save • Esc to cancel
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

FileEditor.propTypes = {
    file: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,
        originalContent: PropTypes.string,
        editedContent: PropTypes.string,
        file: PropTypes.object
    }).isRequired,
    onSave: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default FileEditor;