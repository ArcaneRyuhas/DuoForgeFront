import { getApiUrl } from '../../config/config';

const STORAGE_KEY = 'jira_oauth_status';

const jiraIntegration = {
  initiateOAuthFlow: async () => {
    try {
      const res = await fetch(getApiUrl('/jira/oauth2/start'));
      
      // Verificar si la respuesta es JSON válido
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        return { success: false, message: 'Server returned non-JSON response' };
      }
      
      const data = await res.json();
      
      if (res.ok && data.authUrl) {
        return { success: true, authUrl: data.authUrl };
      }
      
      return { success: false, message: data.detail || 'Failed to start OAuth' };
    } catch (err) {
      console.error('OAuth initiation error:', err);
      return { success: false, message: err.message };
    }
  },

  handleOAuthCallback: async (code, state) => {
    try {
      const res = await fetch(`http://localhost:8000/jira/oauth2/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        return { success: false, message: 'Server returned non-JSON response' };
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, message: data.detail || 'OAuth callback failed' };
      }
      
      const { tokens } = data;
      const { access_token, refresh_token, expires_in, cloud_id, site_url } = tokens;
      
      const now = Date.now();
      const status = {
        connected: true,
        isOAuth: true,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: now + expires_in * 1000,
        cloudId: cloud_id,
        siteUrl: site_url
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      return { success: true };
    } catch (err) {
      console.error('OAuth callback error:', err);
      return { success: false, message: err.message };
    }
  },

  isJiraConnected: () => {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return false;
    
    try {
      const st = JSON.parse(s);
      return st.connected && Date.now() < st.expiresAt;
    } catch (err) {
      console.error('Error parsing stored status:', err);
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  },

  getConnectionStatus: () => {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    
    try {
      const st = JSON.parse(s);
      return {
        isConnected: st.connected,
        isOAuth: st.isOAuth,
        expiresAt: st.expiresAt,
        cloudId: st.cloudId,
        siteUrl: st.siteUrl,
        domain: st.siteUrl // Para compatibilidad
      };
    } catch (err) {
      console.error('Error parsing stored status:', err);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  async refreshAccessToken() {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return false;
    
    try {
      const st = JSON.parse(s);
      
      const res = await fetch('http://localhost:8000/jira/oauth2/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: st.refreshToken })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Refresh failed');
      }
      
      const data = await res.json();
      const now = Date.now();
      
      st.accessToken = data.access_token;
      st.expiresAt = now + data.expires_in * 1000;
      if (data.refresh_token) {
        st.refreshToken = data.refresh_token;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      this.disconnect();
      return false;
    }
  },

  disconnect: () => {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  }
};

export default jiraIntegration;
