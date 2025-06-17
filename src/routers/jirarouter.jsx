import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import jiraIntegration from '../hooks/Jira/jiraIntegration';

function JiraOAuthCallback() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle OAuth error from Atlassian
    if (error) {
      console.error('OAuth error received:', error);
      if (window.opener) {
        window.opener.postMessage({
          type: 'JIRA_OAUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
      return;
    }
    
    // Handle successful OAuth callback
    if (code && state) {
      console.log('Processing OAuth callback with code and state');
      
      // Call the handleOAuthCallback method from your jiraIntegration
      jiraIntegration.handleOAuthCallback(code, state)
        .then(result => {
          console.log('OAuth callback result:', result);
          
          if (result.success) {
            // Success is already handled in handleOAuthCallback
            // It sends JIRA_OAUTH_SUCCESS message and closes window
            console.log('OAuth flow completed successfully');
          } else {
            // Handle failure case
            if (window.opener) {
              window.opener.postMessage({
                type: 'JIRA_OAUTH_ERROR',
                error: result.message || 'OAuth callback failed'
              }, window.location.origin);
            }
            window.close();
          }
        })
        .catch(err => {
          console.error('OAuth callback error:', err);
          if (window.opener) {
            window.opener.postMessage({
              type: 'JIRA_OAUTH_ERROR',
              error: err.message || 'OAuth callback failed'
            }, window.location.origin);
          }
          window.close();
        });
    } else {
      // Missing required parameters
      console.error('Missing code or state parameters in OAuth callback');
      if (window.opener) {
        window.opener.postMessage({
          type: 'JIRA_OAUTH_ERROR',
          error: 'Missing required OAuth parameters'
        }, window.location.origin);
      }
      window.close();
    }
  }, [searchParams]);

  // Show loading message while processing
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Connecting to Jira...</h2>
        <p>Please wait while we complete the authentication process.</p>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 2s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default JiraOAuthCallback;