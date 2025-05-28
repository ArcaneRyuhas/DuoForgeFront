import React, { useEffect, useRef } from 'react';

const MermaidRenderer = ({ content }) => {
    const elementRef = useRef(null);
    const renderingRef = useRef(false);

    useEffect(() => {
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

export default MermaidRenderer;