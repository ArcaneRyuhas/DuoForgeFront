// Programming Language Detection
export function extractProgrammingLanguage(input) {
    const languages = [
        'Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS'
    ];
    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = languages.find(lang =>
        new RegExp(`\\b${escapeRegex(lang)}\\b`, 'i').test(input)
    );
    return found || '';
}

// Mermaid Diagram Detection
export const isMermaidDiagram = (text) => {
    if (!text) return false;
    
    const mermaidKeywords = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'erDiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline',
        'journey', 'quadrantChart', 'requirementDiagram', 'c4Context'
    ];
    
    // Remove code block markers if present
    const cleanText = text.replace(/^```(?:mermaid)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    
    // Check if any line starts with a mermaid keyword
    const lines = cleanText.split('\n');
    return lines.some(line => {
        const trimmedLine = line.trim().toLowerCase();
        return mermaidKeywords.some(keyword => trimmedLine.startsWith(keyword.toLowerCase()));
    });
};

// Code Content Detection
export const isCodeContent = (text) => {
    if (!text) return false;
    
    const codeIndicators = [
        // Function/method definitions
        /function\s+\w+\s*\(/,
        /def\s+\w+\s*\(/,
        /public\s+\w+\s+\w+\s*\(/,
        /private\s+\w+\s+\w+\s*\(/,
        
        // Class definitions
        /class\s+\w+/,
        
        // Import statements
        /import\s+/,
        /from\s+\w+\s+import/,
        /#include\s*</,
        
        // Common programming constructs
        /\{\s*$/m, // Opening braces on their own line
        /^\s*\}/m, // Closing braces
        /;\s*$/m,  // Semicolons at end of lines
        
        // HTML/XML tags
        /<[^>]+>/,
        
        // CSS selectors and properties
        /\.[a-zA-Z-]+\s*\{/,
        /#[a-zA-Z-]+\s*\{/,
        /[a-zA-Z-]+\s*:\s*[^;]+;/
    ];
    
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    if (nonEmptyLines.length === 0) return false;
    
    const codeLines = nonEmptyLines.filter(line =>
        codeIndicators.some(pattern => pattern.test(line))
    );
    
    // If more than 30% of non-empty lines look like code, treat as code
    return (codeLines.length / nonEmptyLines.length) > 0.3;
};

// Markdown Detection
export const shouldRenderAsMarkdown = (text) => {
    if (!text) return false;
    
    const markdownPatterns = [
        /^#+\s/m,
        /\*\*.*\*\*/,
        /\*.*\*/,
        /`.*`/,
        /```[\s\S]*```/,
        /^\s*[-*+]\s/m,
        /^\s*\d+\.\s/m,
        /^\s*>/m,
        /\[.*\]\(.*\)/,
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
};

// Mermaid Diagram Processing
export const processMermaidDiagrams = (text, diagramCounter = { current: 0 }) => {
    if (isMermaidDiagram(text)) {
        diagramCounter.current++;
        const diagramId = `mermaid-${Date.now()}-${diagramCounter.current}`;
        return {
            processedContent: `<div class="mermaid-diagram" id="${diagramId}" data-diagram-content="${encodeURIComponent(text.trim())}"></div>`,
            diagrams: [{
                id: diagramId,
                content: text.trim()
            }]
        };
    }
    
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    let match;
    const diagrams = [];
    let lastIndex = 0;
    let processedContent = '';

    while ((match = mermaidRegex.exec(text)) !== null) {
        processedContent += text.slice(lastIndex, match.index);
        diagramCounter.current++;
        const diagramId = `mermaid-${Date.now()}-${diagramCounter.current}`;
        processedContent += `<div class="mermaid-diagram" id="${diagramId}" data-diagram-content="${encodeURIComponent(match[1].trim())}"></div>`;
        
        diagrams.push({
            id: diagramId,
            content: match[1].trim()
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    processedContent += text.slice(lastIndex);
    return { processedContent, diagrams };
};

// Basic Diagram Validation and Cleanup
export const validateAndCleanDiagram = (content) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
        throw new Error('Empty diagram content');
    }

    const firstLine = lines[0].toLowerCase().trim();
    const validStarters = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline', 'journey', 'quadrantchart', 'requirementdiagram', 'c4context'];
    if (!validStarters.some(starter =>firstLine.startsWith(starter))){
        throw new Error(`Invalid diagram type. Must start with one of: ${validStarters.join(', ')}`);
    }

    const diagramType = lines[0].toLowerCase();
    
    // Basic validation for sequence diagrams
    if (diagramType.includes('sequence')) {
        const validatedLines = [lines[0]]; // Keep the diagram type
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip empty lines and comments
            if (line.startsWith('%%') || line.length === 0) {
                validatedLines.push(line);
                continue;
            }
            
            // Fix common sequence diagram issues
            if (line.includes('->>') || line.includes('-->>') || line.includes('->>+') || line.includes('-->>+')) {
                // Check if arrow line is complete
                const arrowPatterns = ['->>>', '-->>', '->>+', '-->>+', '->>', '-->>'];
                const hasValidArrow = arrowPatterns.some(pattern => line.includes(pattern));
                
                if (hasValidArrow) {
                    const parts = line.split(/(->>|\-\->>|\->>+|\-\->>+)/);
                    if (parts.length >= 3 && parts[0].trim() && parts[2].trim()) {
                        validatedLines.push(line);
                    } else {
                        console.warn('Skipping incomplete arrow line:', line);
                    }
                } else {
                    validatedLines.push(line);
                }
            } else {
                validatedLines.push(line);
            }
        }
        
        return validatedLines.join('\n');
    }
    
    // For other diagram types, return as-is for now
    return content;
};

// Simple Markdown to HTML Conversion
export const convertMarkdownToHtml = (text) => {
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(?!mermaid)([\s\S]*?)```/g, '<pre class="markdown-code-block"><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="markdown-inline-code">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Lists (basic)
    html = html.replace(/^\* (.+)$/gm, '<li class="markdown-li">$1</li>');
    html = html.replace(/(<li class="markdown-li">.*<\/li>)/s, '<ul class="markdown-ul">$1</ul>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');

    return html;
};

// SVG to Image Data URL Conversion

export const svgToImageDataUrl = (svgElement, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const { scale = 3, quality= 1 } = options; 
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const rect = svgElement.getBoundingClientRect();
                const actualWidth = img.naturalWidth||img.width || rect.width || 800;
                const actualHeight = img.naturalHeight || img.height || rect.height || 600; 
                
                canvas.width = actualWidth * scale;
                canvas.height = actualHeight * scale;
                ctx.scale(scale,scale);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.imageSmoothingEnabled=true;
                ctx.imageSmoothingQuality= 'high';
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png', quality));
            };

            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        } catch (error) {
            reject(error);
        }
    });
};