import React from 'react';

const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

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
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="markdown-code-block"><code>$1</code></pre>');

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

    const htmlContent = convertMarkdownToHtml(content);

    return (
        <div 
            className="markdown-renderer"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export default MarkdownRenderer;