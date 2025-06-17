import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import jiraIntegration from '../integrations/jiraIntegration';

function JiraOAuthCallback() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      window.opener?.postMessage({ 
        type: 'JIRA_OAUTH_ERROR', 
        error: error 
      }, window.location.origin);
      window.close();
      return;
    }
    
    if (code && state) {
      jiraIntegration.handleOAuthCallback(code,ReintentarEsta respuesta se pausó porque Claude alcanzó la longitud máxima del mensaje. Presiona continuar para que Claude siga.ContinuarClaude puede cometer errores. Verifique las respuestas.