import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
    processMermaidDiagrams,
    validateAndCleanDiagram,
    convertMarkdownToHtml,
    svgToImageDataUrl
} from '../RenderUtils/contentAnalyzers';
import { set } from 'zod/v4';

const MarkdownRenderer = ({ content, onDiagramsRendered, persistedDiagrams }) => {
    const containerRef = useRef(null);
    const diagramCounter = useRef(0);
    const [diagramImages, setDiagramImages] = useState(persistedDiagrams || new Map());
    const processedContentRef = useRef('');
    const lastContentRef = useRef('');

    useEffect(() => {
        mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis',
        },
        sequence: {
            useMaxWidth: false,
            wrap: true
        },
        gantt: {
            useMaxWidth: false
        }
    });
    }, []);

    useEffect(() => {
        if (persistedDiagrams && persistedDiagrams.size > 0) {
            setDiagramImages(new Map(persistedDiagrams));
        }
        window.handleMermaidImageClick= (imageSrc) =>{
            if(window.chatContainerImageHandler) {
                window.chatContainerImageHandler(imageSrc);
            }
        };
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

                    if (diagramImages.has(diagram.content)) {
                        console.log('Using cached image for:', diagram.id);
                        const imageDataUrl = diagramImages.get(diagram.content);
                        element.innerHTML = `<div style="overflow-x: auto; padding: 8px;"><img src="${imageDataUrl}" alt="Mermaid Diagram" style="max-width: 100%; height: auto; display: block; margin: 0 auto; cursor: pointer;" onclick="window.handleMermaidImageClick('${imageDataUrl}')" /></div>`;
                        continue;
                    }

                    element.innerHTML = '';

                    let cleanContent;
                    try {
                        cleanContent = validateAndCleanDiagram(diagram.content);
                    } catch (validationError) {
                        throw new Error(`Diagram validation failed: ${validationError.message}`);
                    }
                    
                    console.log('Rendering new diagram:', diagram.id);
                    const svgId = `${diagram.id}-svg`;
                    const { svg } = await mermaid.render(svgId, cleanContent);
                    element.innerHTML = svg;
                    const svgElement = element.querySelector('svg');
                    if (svgElement) {
                    svgElement.style.display='block';
                    svgElement.style.margin='0 auto';}

                    const textElements = svgElement.querySelectorAll('text'); 
                    textElements.forEach(text => {
                        text.style.fontFamily= 'system-ui, -apple-system, sans-serif'; 
                        text.style.fontSize= text.style.fontSize || '14px';}
                    );

                    const pathElements= svgElement.querySelectorAll('path, line');
                        pathElements.forEach(path =>{
                            path.style.strokeWidth = path.style.strokeWidth ||'2px';
                        });
                    if (svgElement) {
                        try {
                            const imageDataUrl = await svgToImageDataUrl(svgElement, { scale: 2, quality: 0.95 });
                            newImages.set(diagram.content, imageDataUrl);
                            console.log('Converted to image successfully:', diagram.id);
                            element.innerHTML = `<div style="overflow-x: auto; padding: 8px;"><img src="${imageDataUrl}" alt="Mermaid Diagram" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" /></div>`;
                        } catch (imgError) {
                            console.warn('Failed to convert SVG to image:', imgError);
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
            if (onDiagramsRendered) {
                const imageMap = {};
                newImages.forEach((imageUrl, content) => {
                    imageMap[content] = imageUrl;
                });
                onDiagramsRendered(imageMap);
            }
        }
    };

    if (!content) return null;

    if(content!== lastContentRef.current) {

        const { processedContent, diagrams } = processMermaidDiagrams(content, diagramCounter);
        let htmlContent = processedContent;
        diagrams.forEach(diagram => {
            if (diagramImages .has(diagram.content)){
                const imageHtml = `<img src="${diagramImages.get(diagram.content)}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;" />`;
                htmlContent = htmlContent.replace(
                    `<div class="mermaid-diagram" id="${diagram.id}" data-diagram-content="${encodeURIComponent(diagram.content)}"></div>`,
                    `<div class="mermaid-diagram" id="${diagram.id}">${imageHtml}</div>`
                );
            }
        });
        processedContentRef.current = convertMarkdownToHtml(htmlContent);
        lastContentRef.current = content;
        if (diagrams.length > 0) {
            setTimeout(() => {
                renderMermaidDiagrams(diagrams);
            }, 100);
        }
    }

 

    return (
        <div
            ref={containerRef}
            className="markdown-renderer"
            dangerouslySetInnerHTML={{ __html: processedContentRef.current }}
            style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.6',
                maxWidth: '100%',
                overflow: 'visible', 
                padding: '8px 0'
            }}
        />
    );
};

export default MarkdownRenderer;