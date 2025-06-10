import React from 'react';
import Icon from '@mdi/react';
import { mdiLeadPencil, mdiDeleteForever } from '@mdi/js';
import './uploadedFiles.css';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const UploadedFiles = ({
    files, 
    onEditFile,
    onDeleteFile
}) => {
    if (files.length == 0) return null;
    
    return (
        <div className="uploaded-files-display">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Uploaded Files:</h4>
                <ThemeToggle />
            </div>
            <div className="files-list">
                {files.map(file => (
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
                            >
                                <Icon path={mdiLeadPencil} size={0.8} />
                            </button>
                            <button
                                onClick={() => onDeleteFile(file.id)}
                                className="delete-file-btn"
                                title="Delete file"
                            >
                                <Icon path={mdiDeleteForever} size={0.8} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadedFiles;