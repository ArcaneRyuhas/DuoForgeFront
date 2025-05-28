import React from 'react';
import './MarkdownRenderer.css';

// MermaidRenderer component for rendering Mermaid diagrams
const MermaidRenderer = ({ content }) => {
    const elementRef = React.useRef(null);
    const renderingRef = React.useRef(false);

    React.useEffect(() => {
        const renderMermaid = async () => {
            if (!content || renderingRef.current) return;
            
            renderingRef.current = true;
            
            try {
                // Load mermaid dynamically
                const mermaid = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
                
                // Initialize mermaid with configuration
                mermaid.default.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                    fontFamily: 'Arial, sans-serif',
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true
                    }
                });

                if (elementRef.current) {
                    // Clear previous content
                    elementRef.current.innerHTML = '';
                    
                    // Generate unique ID for this diagram
                    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    try {
                        // Render the mermaid diagram
                        const { svg } = await mermaid.default.render(id, content);
                        elementRef.current.innerHTML = svg;
                    } catch (error) {
                        console.error('Mermaid rendering error:', error);
                        elementRef.current.innerHTML = `
                            <div style="padding: 1rem; border: 1px solid #e74c3c; border-radius: 4px; background-color: #fdf2f2; color: #e74c3c;">
                                <strong>Diagram Error:</strong> Unable to render Mermaid diagram
                                <details style="margin-top: 0.5rem;">
                                    <summary>View diagram code</summary>
                                    <pre style="background: #f8f9fa; padding: 0.5rem; margin-top: 0.5rem; border-radius: 4px; font-size: 0.8rem;">${content}</pre>
                                </details>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('Failed to load Mermaid:', error);
                if (elementRef.current) {
                    elementRef.current.innerHTML = `
                        <div style="padding: 1rem; border: 1px solid #e74c3c; border-radius: 4px; background-color: #fdf2f2; color: #e74c3c;">
                            <strong>Loading Error:</strong> Failed to load Mermaid library
                        </div>
                    `;
                }
            } finally {
                renderingRef.current = false;
            }
        };

        renderMermaid();
    }, [content]);

    return (
        <div 
            ref={elementRef} 
            className="mermaid-diagram"
            style={{ 
                width: '100%', 
                textAlign: 'center',
                padding: '1rem',
                minHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div style={{ color: '#666' }}>Loading diagram...</div>
        </div>
    );
};

const MarkdownRenderer = ({ content }) => {    
    if (!content) {
        return <div>No content</div>;
    }

    // Function to detect if content is a Mermaid diagram
    const isMermaidDiagram = (text) => {
        if (!text) return false;
        
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
            'erDiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline',
            'journey', 'quadrantChart', 'requirementDiagram', 'c4Context'
        ];
        
        // Check if any line starts with a mermaid keyword
        const lines = text.split('\n');
        return lines.some(line => {
            const trimmedLine = line.trim().toLowerCase();
            return mermaidKeywords.some(keyword => trimmedLine.startsWith(keyword));
        });
    };

    const processInlineMarkdown = (text) => {
        if (!text) return '';

        let processedText = text;
        
        // Process inline code first (to avoid conflicts with bold/italic)
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="markdown-inline-code">$1</code>');
        
        // Process bold (**text** or __text__) - be more forgiving with whitespace
        processedText = processedText.replace(/\*\*\s*([^*]+?)\s*\*\*/g, '<strong class="markdown-bold">$1</strong>');
        processedText = processedText.replace(/__\s*([^_]+?)\s*__/g, '<strong class="markdown-bold">$1</strong>');
        
        // Handle broken bold formatting (when ** is on separate lines)
        processedText = processedText.replace(/\*\*([^*]*?)\n([^*]*?)\*\*/g, '<strong class="markdown-bold">$1 $2</strong>');
        
        // Process italic (*text* or _text_) - using simpler regex to avoid lookbehind issues
        processedText = processedText.replace(/\*([^*\s][^*]*[^*\s]|\S)\*/g, '<em class="markdown-italic">$1</em>');
        processedText = processedText.replace(/_([^_\s][^_]*[^_\s]|\S)_/g, '<em class="markdown-italic">$1</em>');
        
        // Process links [text](url)
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Process strikethrough ~~text~~
        processedText = processedText.replace(/~~([^~]+)~~/g, '<del class="markdown-strikethrough">$1</del>');

        return processedText;
    };

    const renderMarkdown = (text) => {
        if (!text) return [];

        // Split content into lines for processing
        const lines = text.split('\n');
        const elements = [];
        let currentIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Handle empty lines
            if (!trimmedLine) {
                elements.push(<div key={currentIndex++} className="markdown-empty-line" />);
                continue;
            }

            // Headers (check for # first, then ##, then ###)
            if (trimmedLine.startsWith('### ')) {
                const headerText = processInlineMarkdown(trimmedLine.substring(4));
                elements.push(
                    <h3 key={currentIndex++} className="markdown-h3" 
                        dangerouslySetInnerHTML={{ __html: headerText }} />
                );
            } else if (trimmedLine.startsWith('## ')) {
                const headerText = processInlineMarkdown(trimmedLine.substring(3));
                elements.push(
                    <h2 key={currentIndex++} className="markdown-h2" 
                        dangerouslySetInnerHTML={{ __html: headerText }} />
                );
            } else if (trimmedLine.startsWith('# ')) {
                const headerText = processInlineMarkdown(trimmedLine.substring(2));
                elements.push(
                    <h1 key={currentIndex++} className="markdown-h1" 
                        dangerouslySetInnerHTML={{ __html: headerText }} />
                );
            }
            // Code blocks (enhanced to handle Mermaid diagrams)
            else if (trimmedLine.startsWith('```')) {
                const codeLines = [];
                const language = trimmedLine.substring(3).trim(); // Extract language if specified
                i++; // Skip the opening ```
                
                while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                
                const codeContent = codeLines.join('\n');
                
                // Check if this is a Mermaid diagram
                if (language.toLowerCase() === 'mermaid' || isMermaidDiagram(codeContent)) {
                    elements.push(
                        <div key={currentIndex++} className="markdown-mermaid-container">
                            <MermaidRenderer content={codeContent} />
                        </div>
                    );
                } else {
                    elements.push(
                        <pre key={currentIndex++} className="markdown-code-block">
                            <code className={language ? `language-${language}` : ''}>{codeContent}</code>
                        </pre>
                    );
                }
            }
            // Unordered lists
            else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                const listItems = [];
                let j = i;
                
                while (j < lines.length) {
                    const currentLine = lines[j].trim();
                    if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
                        const itemText = processInlineMarkdown(currentLine.substring(2));
                        listItems.push(
                            <li key={currentIndex++} className="markdown-li" 
                                dangerouslySetInnerHTML={{ __html: itemText }} />
                        );
                        j++;
                    } else if (currentLine === '') {
                        // Allow empty lines within lists
                        j++;
                    } else {
                        break;
                    }
                }
                
                i = j - 1; // Set i to the last processed line
                elements.push(
                    <ul key={currentIndex++} className="markdown-ul">
                        {listItems}
                    </ul>
                );
            }
            // Ordered lists
            else if (/^\d+\.\s/.test(trimmedLine)) {
                const listItems = [];
                let j = i;
                
                while (j < lines.length) {
                    const currentLine = lines[j].trim();
                    if (/^\d+\.\s/.test(currentLine)) {
                        const itemText = processInlineMarkdown(currentLine.replace(/^\d+\.\s/, ''));
                        listItems.push(
                            <li key={currentIndex++} className="markdown-li" 
                                dangerouslySetInnerHTML={{ __html: itemText }} />
                        );
                        j++;
                    } else if (currentLine === '') {
                        // Allow empty lines within lists
                        j++;
                    } else {
                        break;
                    }
                }
                
                i = j - 1; // Set i to the last processed line
                elements.push(
                    <ol key={currentIndex++} className="markdown-ol">
                        {listItems}
                    </ol>
                );
            }
            // Blockquotes
            else if (trimmedLine.startsWith('> ')) {
                const quoteText = processInlineMarkdown(trimmedLine.substring(2));
                elements.push(
                    <blockquote key={currentIndex++} className="markdown-blockquote" 
                        dangerouslySetInnerHTML={{ __html: quoteText }} />
                );
            }
            // Horizontal rules
            else if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
                elements.push(<hr key={currentIndex++} className="markdown-hr" />);
            }
            // Regular paragraphs
            else {
                const paragraphText = processInlineMarkdown(trimmedLine);
                elements.push(
                    <p key={currentIndex++} className="markdown-p" 
                        dangerouslySetInnerHTML={{ __html: paragraphText }} />
                );
            }
        }

        return elements;
    };

    // Check if the entire content is a standalone Mermaid diagram
    if (isMermaidDiagram(content)) {
        return (
            <div className="markdown-renderer">
                <div className="markdown-mermaid-container">
                    <MermaidRenderer content={content} />
                </div>
            </div>
        );
    }

    const renderedElements = renderMarkdown(content);

    return (
        <div className="markdown-renderer">
            {renderedElements}
        </div>
    );
};

export default MarkdownRenderer;