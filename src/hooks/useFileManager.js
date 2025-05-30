import { useState, useCallback } from 'react';

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
        if (file.type === 'text/plain') {
            try {
                const text = await file.text();
                setUploadedFiles(prev => 
                    prev.map(f => 
                        f.id === fileId 
                            ? { ...f, originalContent: text, editedContent: text }
                            : f
                    )
                );
            } catch (error) {
                console.error('Error reading text file:', error);
            }
        }
    }, []);

    const processAudioFile = useCallback(async (file) => {
        console.log('Audio uploaded:', file.name);
    }, []);

    const updateFileContent = useCallback((fileId, content) => {
        setUploadedFiles(prev=>
            prev.map(file =>
                file.id = fileId
                ? {...file, editedContent: content}
                : file
            )
        );
        console.log('File content saved:', fileId, content.length, 'characters');
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
        return uploadedFiles.find(f => f.id === fileId);
    }, [uploadedFiles]);

    const startEditingFile = useCallback((file) => {
        setEditingFile(file);
    }, []);

    const stopEditingFile = useCallback(() => {
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




         