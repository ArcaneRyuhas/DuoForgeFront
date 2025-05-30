import { useState, useCallback } from 'react';
import {extractFileContent } from '../../src/utils/fileExtractors'

export const useFileManager = () => {
    const[uploadedFiles, setUploadedFiles] = useState([]);
    const[editingFile, setEditingFile] = useState(null);

    const addFile = useCallback(async(file, type) => {
        console.log("File uploaded:", file.name, "Type:", type);
        const newFile = {
            id: Date.now(),
            file,
            type,
            name: file.name,
            size: file.size,
            uploadTime: new Date().toISOString(),
            originalContent: null,
            editedContent:null,
         };

        setUploadedFiles(prev => [...prev, newFile]);

        try{
            if (type === 'document') {
                await processDocumentFile(file, newFile.id);
            } else if (type === 'audio') {
                await processAudioFile(file);
            }
        } catch (error) {
            console.error(`Error processing ${type} file:`, error);
        }

    }, []);

    const processDocumentFile = useCallback(async (file, fileId) => {
        console.log('Processing document:', file.name);
        try {
            const content = extractFileContent(file);

            setUploadedFiles(prev => {
                const updated= prev.map(f =>
                    f.id === fileId
                        ? { ...f, originalContent: content, editedContent: content }
                        : f
                )
                console.log('Updated files state:', updated); 
                return updated;
            });
            console.log('Document processed successfully, content length:', content.length?.length || 0);
        } catch (error) {
            console.error('Error reading document file:', error);
            const errorMessage = error.message || 'Error reading file';
            
            setUploadedFiles(prev =>
                prev.map(f =>
                    f.id === fileId
                        ? { ...f, originalContent: errorMessage, editedContent: errorMessage }
                        : f
                )
            );
        }
    }, []);

    const processAudioFile = useCallback(async (file) => {
        console.log('Audio uploaded:', file.name);
    }, []);

    const updateFileContent = useCallback((fileId, content) => {
        console.log('Updating file content for ID:', fileId, 'New content length:', content?.length || 0);

        setUploadedFiles(prev=> {
            const updated = prev.map(file => {
                if (file.id === fileId){
                    console.log('Found matching file, updating content');
                    return {...file, editedContent: content};
                }
                return file;
                });
        console.log('Files after update:', updated);
        return updated;
    }, []);

    setEditingFile(prev => {
            if (prev && prev.id === fileId) {
                const updatedEditingFile = { ...prev, editedContent: content };
                console.log('Updated editing file:', updatedEditingFile);
                return updatedEditingFile;
            }
            return prev;
        });
    }, []);

    const deleteFile = useCallback((fileId) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (file && window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
            setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
            if (editingFile && editingFile.id === fileId) {
                setEditingFile(null);
            }
        }
    }, [uploadedFiles, editingFile]);

    const getFileById = useCallback((fileId) => {
        const file= uploadedFiles.find(f => f.id === fileId);
        console.log('Getting file by ID:', fileId, 'Found:', file);
        return file;
    }, [uploadedFiles]);

    const startEditingFile = useCallback((file) => {
        console.log('Starting to edit file:', file);
        setEditingFile(file);
    }, []);

    const stopEditingFile = useCallback(() => {
        console.log('Stopping file editing');
        setEditingFile(null);
    }, []);

    return {
        uploadedFiles,
        editingFile,
        addFile,
        updateFileContent,
        deleteFile,
        startEditingFile,
        stopEditingFile,
        getFileById
    };
};




         