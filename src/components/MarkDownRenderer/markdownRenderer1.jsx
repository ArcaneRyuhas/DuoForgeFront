import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
    processMermaidDiagrams,
    validateAndCleanDiagram,
    convertMarkdownToHtml,
    svgToImageDataUrl
} from '../RenderUtils/contentAnalyzers';

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
            fontFamily: 'Arial, sans-serif',
            fontSize: 16, // Increased font size
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
                padding: 20 // Increased padding
            },
            sequence: {
                diagramMarginX: 50,
                diagramMarginY: 30,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35
            },
            gantt: {
                gridLineStartPadding: 350,
                fontSize: 14,
                sectionFontSize: 16
            },
            class: {
                titleTopMargin: 25
            },
            git: {
                mainBranchName: 'main'
            },
            // Enhanced rendering settings
            themeVariables: {
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif'
            }
        });
    }, []);

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

                    if (diagramImages.has(diagram.content)) {
                        console.log('Using cached image for:', diagram.id);
                        element.innerHTML = `<img src="${diagramImages.get(diagram.content)}" alt="Mermaid Diagram" style="max-width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />`;
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
                    
                    // Create a temporary container to properly handle the SVG
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = svg;
                    const svgElement = tempContainer.querySelector('svg');
                    
                    if (svgElement) {
                        // Set explicit dimensions for better rendering
                        const bbox = svgElement.getBBox();
                        const width = Math.max(bbox.width, 400);
                        const height = Math.max(bbox.height, 250);
                        
                        svgElement.setAttribute('width', width);
                        svgElement.setAttribute('height', height);
                        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
                        
                        // First display the SVG
                        element.innerHTML = svg;
                        
                        try {
                            // Convert to high-quality image with 2x scale factor
                            const imageDataUrl = await svgToImageDataUrl(svgElement, 2);
                            newImages.set(diagram.content, imageDataUrl);
                            console.log('Converted to high-quality image successfully:', diagram.id);
                            
                            // Replace with the high-quality image
                            element.innerHTML = `<img src="${imageDataUrl}" alt="Mermaid Diagram" style="
                                max-width: 100%; 
                                height: auto; 
                                image-rendering: -webkit-optimize-contrast; 
                                image-rendering: crisp-edges;
                                min-width: 300px;
                                min-height: 200px;
                                object-fit: contain;
                            " />`;
                        } catch (imgError) {
                            console.warn('Failed to convert SVG to image, keeping SVG:', imgError);
                            // Keep the SVG if conversion fails
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

    if (content !== lastContentRef.current) {
        const { processedContent, diagrams } = processMermaidDiagrams(content, diagramCounter);
        let htmlContent = processedContent;
        
        diagrams.forEach(diagram => {
            if (diagramImages.has(diagram.content)) {
                const imageHtml = `<img src="${diagramImages.get(diagram.content)}" alt="Mermaid Diagram" style="
                    max-width: 100%; 
                    height: auto; 
                    image-rendering: -webkit-optimize-contrast; 
                    image-rendering: crisp-edges;
                    min-width: 300px;
                    min-height: 200px;
                    object-fit: contain;
                " />`;
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
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.6',
                maxWidth: '100%',
                overflow: 'auto'
            }}
        />
    );
};

export default MarkdownRenderer;