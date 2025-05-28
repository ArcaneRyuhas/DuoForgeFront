const CodeRenderer = ({ content, language = '' }) => {
    const [highlighted, setHighlighted] = React.useState('');
    
    React.useEffect(() => {
        // Simple syntax highlighting for common languages
        const highlightCode = (code, lang) => {
            if (!code) return '';
            
            const langLower = lang.toLowerCase();
            let highlightedCode = code;
            
            // Basic keyword highlighting for different languages
            const keywordPatterns = {
                javascript: /\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await|try|catch)\b/g,
                python: /\b(def|class|if|elif|else|for|while|return|import|from|try|except|with|as)\b/g,
                java: /\b(public|private|protected|class|interface|extends|implements|if|else|for|while|return|import|package)\b/g,
                html: /(<\/?[^>]+>)/g,
                css: /([.#]?[a-zA-Z-]+\s*{|[a-zA-Z-]+\s*:)/g,
                sql: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|DATABASE|INDEX)\b/gi
            };
            
            const stringPatterns = {
                javascript: /(["'`])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
                python: /(["'])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
                java: /(["'])((?:(?!\1)[^\\]|\\.)*)(\1)/g
            };
            
            const commentPatterns = {
                javascript: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
                python: /(#.*$)/gm,
                java: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
                html: /(<!--[\s\S]*?-->)/g,
                css: /(\/\*[\s\S]*?\*\/)/g,
                sql: /(--.*$|\/\*[\s\S]*?\*\/)/gm
            };
            
            // Apply syntax highlighting
            if (keywordPatterns[langLower]) {
                highlightedCode = highlightedCode.replace(
                    keywordPatterns[langLower], 
                    '<span class="code-keyword">$&</span>'
                );
            }
            
            if (stringPatterns[langLower]) {
                highlightedCode = highlightedCode.replace(
                    stringPatterns[langLower], 
                    '<span class="code-string">$&</span>'
                );
            }
            
            if (commentPatterns[langLower]) {
                highlightedCode = highlightedCode.replace(
                    commentPatterns[langLower], 
                    '<span class="code-comment">$&</span>'
                );
            }
            
            // Numbers
            highlightedCode = highlightedCode.replace(
                /\b(\d+(?:\.\d+)?)\b/g, 
                '<span class="code-number">$1</span>'
            );
            
            return highlightedCode;
        };
        
        setHighlighted(highlightCode(content, language));
    }, [content, language]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content).then(() => {
            // Could add a toast notification here
            console.log('Code copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    };
    
    return (
        <div className="code-renderer">
            <div className="code-header">
                <span className="code-language">{language || 'code'}</span>
                <button className="code-copy-btn" onClick={copyToClipboard} title="Copy code">
                    📋
                </button>
            </div>
            <pre className="code-content">
                <code 
                    className={`language-${language}`}
                    dangerouslySetInnerHTML={{ __html: highlighted || content }}
                />
            </pre>
        </div>
    );
};

export default CodeRenderer;