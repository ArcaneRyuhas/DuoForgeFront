import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.mjs';

/**
 * Extract text content from PDF files
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - Extracted text content
 */

export const extractPDFContent = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract PDF content. Please try converting to text format.');
    }
};

/**
 * Extract text content from Word documents
 * @param {File} file - The Word document to extract text from
 * @returns {Promise<string>} - Extracted text content
 */
export const extractWordContent = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('Word extraction error:', error);
        throw new Error('Failed to extract Word document content. Please try converting to text format.');
    }
};

/**
 * Determine file type and extract content accordingly
 * @param {File} file - The file to extract content from
 * @returns {Promise<string>} - Extracted text content
 */
export const extractFileContent = async (file) => {
    const fileType = file.type || '';
    const fileName = file.name || '';
    
    try {
        if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            return await file.text();
        } 
        
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await extractPDFContent(file);
        }
        
        if (fileType.includes('word') || 
            fileType.includes('document') || 
            fileName.endsWith('.docx') || 
            fileName.endsWith('.doc')) {
            return await extractWordContent(file);
        }
        
        // Try to read as text for other file types
        try {
            return await file.text();
        } catch (e) {
            throw new Error('Unable to extract text content from this file type.');
        }
    } catch (error) {
        console.error('Error extracting file content:', error);
        throw error;
    }
};

export default extractFileContent;