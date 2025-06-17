import { useAuth } from "react-oidc-context";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home/Home";
import Dashboard from "./components/Dashboard/Dashboard";
import JiraOAuthCallback from "./routers/jirarouter";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;
  if (auth.error) return <div>Error: {auth.error.message}</div>;

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              auth.isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Home />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              auth.isAuthenticated ? (
                <Dashboard user={auth.user} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Jira OAuth callback route - accessible without authentication */}
          <Route
            path="/jira/callback"
            element={<JiraOAuthCallback />}
          />
          {/* Alternative route if you prefer to match backend default */}
          <Route
            path="/auth/jira/callback"
            element={<JiraOAuthCallback />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;