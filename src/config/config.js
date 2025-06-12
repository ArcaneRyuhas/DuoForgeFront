const config = {
    // En desarrollo, usar la URL completa del backend
    // En producción, usar rutas relativas si están en el mismo dominio
    API_BASE_URL: import.meta.env.DEV 
      ? 'http://localhost:8000' 
      : '',
      
    // URLs específicas
    JIRA_OAUTH_START: '/jira/oauth2/start',
    JIRA_OAUTH_CALLBACK: '/jira/oauth2/callback',
    JIRA_OAUTH_REFRESH: '/jira/oauth2/refresh',
  };
  
  export const getApiUrl = (endpoint) => {
    return `${config.API_BASE_URL}${endpoint}`;
  };
  
  export default config;