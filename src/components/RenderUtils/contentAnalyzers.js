// Programming Language

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

// Diagram mermaid Renderer
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
            return mermaidKeywords.some(keyword => trimmedLine.startsWith(keyword));
        });
    };

// Code renderer
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

// Final Renderer
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


