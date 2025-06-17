import { getApiUrl } from '../../config/config';

const STORAGE_KEY = 'jira_oauth_status';

const jiraIntegration = {
  initiateOAuthFlow: async () => {
    try {
      console.log('Initiating Jira OAuth flow...');
      const url = getApiUrl('/jira/oauth2/start');
      console.log('Making request to:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', [...res.headers.entries()]);
      
      // Verificar si la respuesta es JSON válido
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        return { success: false, message: 'Server returned non-JSON response' };
      }
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok && data.authUrl) {
        console.log('OAuth URL:', data.authUrl);
        const popup = window.open(
          data.authUrl,
          'jira-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          return { success: false, message: 'Popup blocked. Please allow popups for this site' };
        }

        return new Promise((resolve) => {
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              // Check if we have a successful connection status
              const status = jiraIntegration.getConnectionStatus();
              if (status && status.isConnected) {
                resolve({ success: true, message: 'OAuth flow completed successfully' });
              } else {
                resolve({ success: false, message: 'Authentication was cancelled or failed' });
              }
            }
          }, 1000);

          const messageListener = (event) => {
            if (event.origin !== window.location.origin) return; 
            if (event.data.type === 'JIRA_OAUTH_SUCCESS') {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              popup.close();
              resolve({ success: true, message: 'OAuth flow completed successfully' });
            } else if (event.data.type === 'JIRA_OAUTH_ERROR') {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
              popup.close();
              resolve({ success: false, message: event.data.error || 'OAuth flow failed' });
            }
          };
          
          window.addEventListener('message', messageListener);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            if (!popup.closed) {
              popup.close();
            }
            resolve({ success: false, message: 'OAuth flow timed out' });
          }, 300000); // 5 minutes instead of 30 seconds
        });
      }
      
      return { success: false, message: data.detail || 'Failed to start OAuth' };
    } catch (err) {
      console.error('OAuth initiation error:', err);
      return { success: false, message: err.message };
    }
  }, 

  handleOAuthCallback: async (code, state) => {
    try {
      console.log('Handling OAuth callback with code:', code, 'and state:', state);

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameters in OAuth callback');
      }

      const url = `${getApiUrl('/jira/oauth2/callback')}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      console.log('Making callback request to backend');

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Callback response status:', res.status);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await res.json();
      console.log('Callback response data:', data);
      
      if (!res.ok) {
        throw new Error(data.detail || 'OAuth callback failed');
      }
      
      const { tokens } = data;
      const { access_token, refresh_token, expires_in, cloud_id, site_url } = tokens;
      
      // Fixed typo: acccess_token -> access_token
      if (!access_token) {
        throw new Error('No access token received');
      }
      
      const now = Date.now();
      const status = {
        connected: true,
        isConnected: true, // Add both for compatibility
        isOAuth: true,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: now + (expires_in || 3600) * 1000,
        cloudId: cloud_id,
        siteUrl: site_url
      };
      
      // Store the status
      try {
        // Using memory storage instead of localStorage as per artifact requirements
        window.jiraOAuthStatus = status;
        console.log('OAuth connection established and saved to memory:', status);
      } catch (storageError) {
        console.warn('Could not save to storage:', storageError);
        // Continue anyway, the status is still in memory
      }
      
      if (window.opener) {
        window.opener.postMessage({ type: 'JIRA_OAUTH_SUCCESS' }, window.location.origin);
        window.close();
      }
      
      return { success: true };
    } catch (err) {
      console.error('OAuth callback error:', err);
      if (window.opener) {
        window.opener.postMessage({ type: 'JIRA_OAUTH_ERROR', error: err.message }, window.location.origin);
        window.close();
      }
      return { success: false, message: err.message, error: err };
    }
  },

  testConnection: async () => {
    try {
      const url = getApiUrl('/jira/debug/oauth-config');
      console.log('Testing Jira connection with URL:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Connection test failed:', text);
        return { success: false, message: `HTTP ${res.status}`, details: text };
      }

      const data = await res.json();
      console.log('Connection test response:', data);
      return { success: true, data };
    } catch (err) {
      console.error('Connection test error:', err);
      return { success: false, message: err.message, error: err };
    }
  },

  isJiraConnected: () => {
    // Try memory first, then localStorage as fallback
    let status;
    try {
      status = window.jiraOAuthStatus;
      if (!status) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          status = JSON.parse(stored);
          // Copy to memory for future use
          window.jiraOAuthStatus = status;
        }
      }
    } catch (err) {
      console.error('Error reading stored status:', err);
      return false;
    }
    
    if (!status) return false;
    
    const isValid = status.connected && Date.now() < status.expiresAt;
    console.log('Connection status check:', { 
      connected: status.connected, 
      expired: Date.now() >= status.expiresAt, 
      isValid 
    });
    return isValid;
  },

  getConnectionStatus: () => {
    // Try memory first, then localStorage as fallback
    let status;
    try {
      status = window.jiraOAuthStatus;
      if (!status) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          status = JSON.parse(stored);
          // Copy to memory for future use
          window.jiraOAuthStatus = status;
        }
      }
    } catch (err) {
      console.error('Error reading stored status:', err);
      return null;
    }
    
    if (!status) return null;
    
    return {
      isConnected: status.connected,
      isOAuth: status.isOAuth,
      expiresAt: status.expiresAt,
      cloudId: status.cloudId,
      siteUrl: status.siteUrl,
      domain: status.siteUrl, // Para compatibilidad
      timeUntilExpiry: status.expiresAt - Date.now()
    };
  },

  async refreshAccessToken() {
    // Try memory first, then localStorage as fallback
    let status;
    try {
      status = window.jiraOAuthStatus;
      if (!status) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          status = JSON.parse(stored);
        }
      }
    } catch (err) {
      console.error('Error reading stored status:', err);
      return false;
    }
    
    if (!status) return false;
    
    try {
      console.log('Attempting to refresh access token with stored status:', status);

      if (!status.refreshToken) {
        console.error('No refresh token available for Jira OAuth');
        this.disconnect();
        return false;
      }

      const url = getApiUrl('/jira/oauth2/refresh');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ refresh_token: status.refreshToken })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Token refresh failed:', data);
        throw new Error(data.detail || 'Refresh failed');
      }
      
      const data = await res.json();
      console.log('Token refresh response:', data);

      const now = Date.now();
      
      status.accessToken = data.access_token;
      status.expiresAt = now + (data.expires_in || 3600) * 1000; 
      if (data.refresh_token) {
        status.refreshToken = data.refresh_token;
      }
      
      // Update both memory and localStorage
      window.jiraOAuthStatus = status;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
      }
      
      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      this.disconnect();
      return false;
    }
  },

  disconnect: () => {
    // Clear both memory and localStorage
    delete window.jiraOAuthStatus;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear localStorage:', err);
    }
    console.log('Jira connection disconnected');
    return { success: true };
  },

  getAccessToken: () => {
    const status = jiraIntegration.getConnectionStatus();
    return status?.accessToken || null;
  },

  makeJiraAPICall: async (endpoint, options = {}) => {
    const status = jiraIntegration.getConnectionStatus();
    if (!status || !status.isConnected) {
      throw new Error('Jira is not connected');
    }

    if (Date.now() >= status.expiresAt) {
      const refreshed = await jiraIntegration.refreshAccessToken();
      if (!refreshed) {
        throw new Error('Failed to refresh Jira access token');
      }
    }

    const token = jiraIntegration.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    return fetch(`${status.siteUrl}/rest/api/3/${endpoint}`, {
      ...options,
      ...defaultOptions
    });
  }
};

export default jiraIntegration;