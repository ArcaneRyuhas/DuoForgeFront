import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import Login from "./components/Auth/Login";
import JiraOAuthCallback from "./routers/jirarouter";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const [localUser, setLocalUser] = useState(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const checkLocalAuthStatus = () => {
      try {
        const savedUser = localStorage.getItem('infycode_user');
        const savedToken = localStorage.getItem('auth_token');
        
        console.log('🔍 Checking saved auth data:', {
          hasUser: !!savedUser,
          hasToken: !!savedToken
        });
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setLocalUser(parsedUser);
          
          const token = savedToken || parsedUser.token || parsedUser.access_token;
          if (token && typeof token === 'string') {
            setAuthToken(token);
            console.log('✅ Token loaded from storage', {
              exists: !!token,
              length: token?.length || 0,
              preview: token ? token.substring(0, 20) + '...' : 'null'
            });
          } else {
            console.warn('⚠️ Invalid token format found:', typeof token, token);
          }
        } else if (savedToken) {
          console.warn('Found token without user data, clearing...');
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('infycode_user');
        localStorage.removeItem('auth_token');
        setLocalUser(null);
        setAuthToken(null);
      } finally {
        setIsLocalLoading(false);
      }
    };

    const timer = setTimeout(checkLocalAuthStatus, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (userData) => {    
    let token = null;
    if (typeof userData.id_token === 'string') {
      token = userData.id_token;
    }

    if (!token || typeof token !== 'string') {
      console.error('❌ No valid token found in auth response:', userData);
      return;
    }

    // Prepare clean user data
    const cleanUserData = {
      username: userData.username || userData.user?.username,
      lastName: userData.lastName || userData.last_name || userData.user?.lastName,
      token: token,
      access_token: token,
      ...userData
    };

    setLocalUser(cleanUserData);
    setAuthToken(token);

    localStorage.setItem('infycode_user', JSON.stringify(cleanUserData));
    localStorage.setItem('auth_token', token);
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    
    // Clear state
    setLocalUser(null);
    setAuthToken(null);
    
    // Clear localStorage
    localStorage.removeItem('infycode_user');
    localStorage.removeItem('auth_token');
    
    console.log('✅ Logout completed');
  };

  // Token validation logic
  const isTokenValid = (token) => {
    if (!token || typeof token !== 'string') return false;
    
    try {
      // Basic JWT validation - check if it's expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 5 minute buffer)
      return payload.exp && payload.exp > (currentTime + 300);
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  // Check token validity on app load and periodically
  useEffect(() => {
    if (authToken && !isTokenValid(authToken)) {
      console.warn('⚠️ Token is expired or invalid, logging out...');
      handleLogout();
    }
  }, [authToken]);

  const currentUser = localUser;
  const isAuthenticated = !!localUser && !!authToken;

  // Show loading state
  if (isLocalLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f0f0'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #48dbfb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login onAuthSuccess={handleAuthSuccess} />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login onAuthSuccess={handleAuthSuccess} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard 
                  user={currentUser} 
                  token={authToken}
                  onLogout={handleLogout} 
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          {/* Jira OAuth callback routes - accessible without authentication */}
          <Route
            path="/jira/callback"
            element={<JiraOAuthCallback />}
          />
          <Route
            path="/auth/jira/callback"
            element={<JiraOAuthCallback />}
          />
          {/* Catch-all route */}
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;