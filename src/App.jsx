import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
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
  // Safe OIDC auth hook usage with fallback
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.warn('OIDC context not available:', error);
    auth = null;
  }
  
  // Fallback auth object if OIDC is not available
  const safeAuth = auth || {
    isLoading: false,
    isAuthenticated: false,
    user: null,
    error: null,
    signoutRedirect: () => {}
  };

  const [localUser, setLocalUser] = useState(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  // Check for existing local authentication on app startup
  useEffect(() => {
    const checkLocalAuthStatus = () => {
      try {
        const savedUser = localStorage.getItem('infycode_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setLocalUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('infycode_user');
      } finally {
        setIsLocalLoading(false);
      }
    };

    // Simulate a brief loading time for a more realistic experience
    const timer = setTimeout(checkLocalAuthStatus, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (userData) => {
    setLocalUser(userData);
    // Save user data to localStorage for persistence
    localStorage.setItem('infycode_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setLocalUser(null);
    localStorage.removeItem('infycode_user');
    // Also sign out from OIDC if authenticated
    if (safeAuth.isAuthenticated) {
      safeAuth.signoutRedirect();
    }
  };

  // Determine current user - prioritize OIDC auth over local auth
  const currentUser = safeAuth.isAuthenticated ? safeAuth.user : localUser;
  const isAuthenticated = safeAuth.isAuthenticated || !!localUser;

  // Show loading state if either OIDC or local auth is loading
  if (safeAuth.isLoading || isLocalLoading) {
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

  // Show OIDC error if present
  if (safeAuth.error) {
    return <div>Authentication Error: {safeAuth.error.message}</div>;
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
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard user={currentUser} onLogout={handleLogout} />
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