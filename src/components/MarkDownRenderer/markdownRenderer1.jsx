import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
    isMermaidDiagram,
    processMermaidDiagrams,
    validateAndCleanDiagram,
    convertMarkdownToHtml,
    svgToImageDataUrl
} from '../RenderUtils/contentAnalyzers';

const MarkdownRenderer = ({ content, onDiagramsRendered, persistedDiagrams }) => {
    const containerRef = useRef(null);
    const diagramCounter = useRef(0);
    const [diagramImages, setDiagramImages] = useState(persistedDiagrams || new Map());

    useEffect(() => {
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

    // Sync with persistedDiagrams when it changes
    useEffect(() => {
        if (persistedDiagrams && persistedDiagrams.size > 0) {
            setDiagramImages(new Map(persistedDiagrams));
        }
    }, [persistedDiagrams]);

    if (!content) return null;

    const renderMermaidDiagrams = async (diagrams) => {
        const newImages = new Map(diagramImages);
        
        console.log('Rendering diagrams:', diagrams.length, 'diagrams');
        console.log('Current cached images:', diagramImages.size);
        
        for (const diagram of diagrams) {
            try {
                const element = document.getElementById(diagram.id);
                if (element) {
                    console.log('Processing diagram:', diagram.id);
                    
                    // Check if we already have an image for this diagram content
                    if (diagramImages.has(diagram.content)) {
                        console.log('Using cached image for:', diagram.id);
                        element.innerHTML = `<img src="${diagramImages.get(diagram.content)}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;" />`;
                        continue;
                    }

                    element.innerHTML = '';
                    
                    // Validate and clean the diagram content
                    let cleanContent;
                    try {
                        cleanContent = validateAndCleanDiagram(diagram.content);
                    } catch (validationError) {
                        throw new Error(`Diagram validation failed: ${validationError.message}`);
                    }
                    
                    console.log('Rendering new diagram:', diagram.id);
                    const svgId = `${diagram.id}-svg`;
                    const { svg } = await mermaid.render(svgId, cleanContent);
                    
                    // Temporarily add SVG to get dimensions and convert to image
                    element.innerHTML = svg;
                    const svgElement = element.querySelector('svg');
                    
                    if (svgElement) {
                        try {
                            const imageDataUrl = await svgToImageDataUrl(svgElement);
                            newImages.set(diagram.content, imageDataUrl);
                            console.log('Converted to image successfully:', diagram.id);
                            
                            // Replace SVG with image
                            element.innerHTML = `<img src="${imageDataUrl}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;" />`;
                        } catch (imgError) {
                            console.warn('Failed to convert SVG to image:', imgError);
                            // Keep the SVG if image conversion fails
                        }
                    }
                }
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                const element = document.getElementById(diagram.id);
                if (element) {
                    element.innerHTML = `
                        <div class="mermaid-error" style="
                            background-color: #fee;
                            border: 1px solid #fcc;
                            border-radius: 4px;
                            padding: 12px;
                            margin: 8px 0;
                            color: #c33;
                            font-family: monospace;
                            font-size: 0.9em;
                        ">
                            <strong>Diagram Error:</strong> ${error.message}
                            <details style="margin-top: 8px;">
                                <summary style="cursor: pointer; color: #666;">View diagram source</summary>
                                <pre style="background: #f5f5f5; padding: 8px; margin-top: 4px; border-radius: 2px; overflow-x: auto;">${diagram.content}</pre>
                            </details>
                        </div>
                    `;
                }
            }
        }
        
        if (newImages.size > diagramImages.size) {
            setDiagramImages(newImages);
            
            // Notify parent component about rendered diagrams
            if (onDiagramsRendered) {
                const imageMap = {};
                newImages.forEach((imageUrl, content) => {
                    imageMap[content] = imageUrl;
                });
                onDiagramsRendered(imageMap);
            }
        }
    };

    const { processedContent, diagrams } = processMermaidDiagrams(content, diagramCounter);
    
    // Replace diagram placeholders with cached images if available
    let htmlContent = processedContent;
    diagrams.forEach(diagram => {
        if (diagramImages.has(diagram.content)) {
            const imageHtml = `<img src="${diagramImages.get(diagram.content)}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;" />`;
            htmlContent = htmlContent.replace(
                `<div class="mermaid-diagram" id="${diagram.id}" data-diagram-content="${encodeURIComponent(diagram.content)}"></div>`,
                `<div class="mermaid-diagram" id="${diagram.id}">${imageHtml}</div>`
            );
        }
    });
    
    htmlContent = convertMarkdownToHtml(htmlContent);

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
            ref={containerRef}
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