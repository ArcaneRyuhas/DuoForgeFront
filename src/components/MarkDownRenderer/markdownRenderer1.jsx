import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const MarkdownRenderer = ({ content }) => {
    const containerRef = useRef(null);
    const diagramCounter = useRef(0);

    useEffect (() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Arial, sans-serif', 
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
    }, []);

    if (!content) return null;

    const isMermaidDiagram = (text) => {
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
            'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey',
            'gitgraph', 'mindmap', 'timeline'
        ];
         return mermaidKeywords.some(keyword => text.trim().startsWith(keyword));
    };

    const processMermaidDiagrams = (text) => {
        if (isMermaidDiagram(text)){
            diagramCounter.current++;
            const diagramId = `mermaid-${Date.now()}-${diagramCounter.current}`;
            return{
                processedContent: `<div class="mermaid-diagram" id="${diagramId}"></div>`,
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
            processedContent += `<div class="mermaid-diagram" id="${diagramId}"></div>`;
            
            diagrams.push({
                id: diagramId,
                content: match[1].trim()
            });
            
            lastIndex = match.index + match[0].length;
        }
        
        processedContent += text.slice(lastIndex);        
        return { processedContent, diagrams };
    };

    // Simple markdown-to-HTML conversion
    const convertMarkdownToHtml = (text) => {
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

    const renderMermaidDiagrams = async (diagrams) => {
        for (const diagram of diagrams) {
            try {
                const element = document.getElementById(diagram.id);
                if (element) {
                    element.innerHTML = '';
                    const svgId= `${diagram.id}-svg`;
                    const { svg } = await mermaid.render(svgId, diagram.content);
                    element.innerHTML = svg;
                }
            } catch (error) {
                const element = document.getElementById(diagram.id);
                if (element) {
                    element.innerHTML = `<div class="mermaid-error">Error rendering diagram: ${error.message}</div>`;
                }
            }
        }
    };

    const { processedContent, diagrams } = processMermaidDiagrams(content);
    const htmlContent = convertMarkdownToHtml(processedContent);

    useEffect(() => {
        if (diagrams.length > 0) {
            const timer = setTimeout(() => {
                renderMermaidDiagrams(diagrams);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [content, diagrams.length]);

    return (
        <div
            ref= {containerRef}
            className="markdown-renderer"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.6',
                maxWidth: '100%',
                overflow: 'auto'
            }}
        />
    );
};



export default MarkdownRenderer;