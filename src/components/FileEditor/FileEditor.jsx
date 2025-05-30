import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
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
            let text = '';
            
            if (file.type === 'text/plain') {
                text = await file.text();
            } else if (file.type === 'application/pdf') {
                text = 'PDF content extraction requires additional setup. Please convert to text format.';
            } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                text = 'Word document content extraction requires additional setup. Please convert to text format.';
            } else {
                text = await file.text();
            }
            
            setContent(text);
        } catch (err) {
            setError('Failed to read file content. Please ensure it\'s a text file.');
            console.error('Error reading file:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContentChange = (e) => {
        setContent(e.target.value);
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave(file.id, content);
        setHasChanges(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirm = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
            if (!confirm) return;
        }
        loadFileContent();
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
        // Save with Ctrl+S
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
        // Cancel with Escape
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
                            ✏️ Edit
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
                        🗑️
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
                        <pre>{content}</pre>
                    </div>
                )}
                
                <div className="editor-stats">
                    <span>Characters: {content.length}</span>
                    <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
                    <span>Lines: {content.split('\n').length}</span>
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
    }).isRequired,
    onSave: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default FileEditor;