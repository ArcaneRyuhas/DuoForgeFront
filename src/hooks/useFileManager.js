import { useState, useCallback } from 'react';
import {extractFileContent } from '../../src/utils/fileExtractors'

export const useFileManager = () => {
    const[uploadedFiles, setUploadedFiles] = useState([]);
    const[editingFile, setEditingFile] = useState(null);

    const addFile = useCallback(async(file, type) => {
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
        try {
            const content = await extractFileContent(file);

            setUploadedFiles(prev => {
                const updated= prev.map(f =>
                    f.id === fileId
                        ? { ...f, originalContent: content, editedContent: content }
                        : f
                ) 
                return updated;
            });
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
        setUploadedFiles(prev=> {
            const updated = prev.map(file => {
                if (file.id === fileId){
                    return {...file, editedContent: content};
                }
                return file;
                });
        return updated;
    }, []);

    setEditingFile(prev => {
            if (prev && prev.id === fileId) {
                const updatedEditingFile = { ...prev, editedContent: content };
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
        return file;
    }, [uploadedFiles]);

    const startEditingFile = useCallback((file) => {
        setEditingFile(file);
    }, []);

    const stopEditingFile = useCallback(() => {
        setEditingFile(null);
    }, []);

    const getFileContent = useCallback((fileId) =>{
        const file = getFileById(fileId);
        return file ? (file.editedContent || file.originalContent): null;
    }, [getFileById]);

    const getProcessedFiles = useCallback(()=> {
        return uploadedFiles.filter(file => file.originalContent !== null);
    }, [uploadedFiles]);

    const isFileProcessed = useCallback((fileId)=> {
        const file = getFileById(fileId);
        return file && file.originalContent !== null;
    }, [getFileById])

    return {
        uploadedFiles,
        editingFile,
        addFile,
        updateFileContent,
        deleteFile,
        startEditingFile,
        stopEditingFile,
        getFileById,
        getFileContent,
        getProcessedFiles,
        isFileProcessed
    };
};




         