import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extract text content from PDF files
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - Extracted text content
 */
export const extractPDFContent = async (file) => {
    try {
        console.log('Starting PDF extraction for file:', file.name);
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);
        
        if (arrayBuffer.byteLength === 0) {
            throw new Error('PDF file appears to be empty');
        }
        
        const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0 // Reduce console spam
        });
        
        const pdf = await loadingTask.promise;
        console.log('PDF loaded successfully. Pages:', pdf.numPages);
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .filter(item => item.str && item.str.trim()) // Filter out empty strings
                    .map(item => item.str)
                    .join(' ');
                
                if (pageText.trim()) {
                    fullText += pageText + '\n\n';
                }
                
                console.log(`Extracted text from page ${i}: ${pageText.length} characters`);
            } catch (pageError) {
                console.warn(`Error extracting page ${i}:`, pageError);
                // Continue with other pages
            }
        }
        
        if (!fullText.trim()) {
            throw new Error('No text content found in PDF. The PDF might be image-based or encrypted.');
        }
        
        console.log('Total extracted text length:', fullText.length);
        return fullText.trim();
        
    } catch (error) {
        console.error('PDF extraction error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        if (error.message.includes('Invalid PDF')) {
            throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF.');
        } else if (error.message.includes('password')) {
            throw new Error('PDF is password protected. Please provide an unprotected PDF.');
        } else if (error.message.includes('worker')) {
            throw new Error('PDF worker failed to load. Please check your internet connection.');
        } else {
            throw new Error(`Failed to extract PDF content: ${error.message}`);
        }
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