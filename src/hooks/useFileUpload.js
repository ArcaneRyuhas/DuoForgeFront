import { useRef, useCallback } from 'react';

export const useFileUpload = (onFileUpload) => {
    const documentInputRef = useRef(null);
    const audioInputRef = useRef(null);

    const triggerDocumentUpload = useCallback(() => {
        documentInputRef.current?.click();
    }, []);

    const triggerAudioUpload = useCallback(() => {
        audioInputRef.current?.click();
    }, []);

    const handleDocumentChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file, 'document');
        }
        e.target.value = '';
    }, [onFileUpload]);

    const handleAudioChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(file, 'audio');
        }
        e.target.value = '';
    }, [onFileUpload]);

    return {
        documentInputRef,
        audioInputRef,
        triggerDocumentUpload,
        triggerAudioUpload,
        handleDocumentChange,
        handleAudioChange
    };
};