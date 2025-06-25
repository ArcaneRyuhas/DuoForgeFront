import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css'
import { assets } from '../../assets/assets';
import jiraIntegration from '../../hooks/Jira/jiraIntegration';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ onProjectChange, currentProjectId, onProjectUpdate, onLogout }) => {
  const [extended, setExtended] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [jiraStatus, setJiraStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Unnamed project',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      chatHistory: [],
      jiraStories: [],
      diagrams: []
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState(1);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [tempProjectName, setTempProjectName] = useState('');
  const [showProjectOptions, setShowProjectOptions] = useState(null);

  const settingsMenuRef = useRef(null);
  const appearanceMenuRef = useRef(null);
  const editInputRef = useRef(null);
  const projectOptionsRef = useRef(null);

  useEffect(() => {
    const isConnected = jiraIntegration.isJiraConnected();
    if (isConnected) {
      const status = jiraIntegration.getConnectionStatus();
      setJiraStatus(status);
    }

    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state && window.location.pathname === '/auth/jira/callback') {
        setIsConnecting(true);
        try {
          const result = await jiraIntegration.handleOAuthCallback(code, state);
          if (result.success) {
            const status = jiraIntegration.getConnectionStatus();
            setJiraStatus(status);
            alert('Successfully connected to Jira via OAuth!');
            window.history.replaceState({}, document.title, '/');
          } else {
            alert(`Failed to connect: ${result.message}`);
          }
        } catch (error) {
          console.error('OAuth Error:', error);
          alert(`OAuth Error: ${error.message}`);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  useEffect(() => {
    const handleClicksOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
      if (appearanceMenuRef.current && !appearanceMenuRef.current.contains(event.target)) {
        setShowAppearanceMenu(false);
      }
      if (projectOptionsRef.current && !projectOptionsRef.current.contains(event.target)) {
        setShowProjectOptions(null);
      }
    };
    document.addEventListener('mousedown', handleClicksOutside);
    return () => {
      document.removeEventListener('mousedown', handleClicksOutside)
    };
  }, []);

  useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProjectId]);

  // Notify parent component when active project changes
  useEffect(() => {
    if (onProjectChange && activeProjectId) {
      const activeProject = projects.find(p => p.id === activeProjectId);
      onProjectChange(activeProject);
    }
  }, [activeProjectId, projects, onProjectChange]);

  // Function to handle project updates from Main component
  const handleProjectUpdate = (updatedProject) => {
    setProjects(prev => prev.map(project =>
      project.id === updatedProject.id ? updatedProject : project
    ));
  };

  // Pass this function to parent so Main can call it
  useEffect(() => {
    if (onProjectUpdate) {
      onProjectUpdate(handleProjectUpdate);
    }
  }, [onProjectUpdate]);

  const createNewProject = () => {
    const newProject = {
      id: Date.now(), // Simple ID generation
      name: `Project ${projects.length + 1}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      chatHistory: [],
      jiraStories: [],
      diagrams: []
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);

    // Auto-start editing the new project name
    setTimeout(() => {
      startEditingProject(newProject.id, newProject.name);
    }, 100);
  };

  const switchToProject = (projectId) => {
    setActiveProjectId(projectId);
    // Update last modified time
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? { ...project, lastModified: new Date().toISOString() }
        : project
    ));
  };

  const duplicateProject = (projectId) => {
    const projectToDuplicate = projects.find(p => p.id === projectId);
    if (!projectToDuplicate) return;

    const duplicatedProject = {
      ...projectToDuplicate,
      id: Date.now(),
      name: `${projectToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      // Keep the chat history and other data but make them independent
      chatHistory: [...projectToDuplicate.chatHistory],
      jiraStories: [...projectToDuplicate.jiraStories],
      diagrams: [...projectToDuplicate.diagrams]
    };

    setProjects(prev => [...prev, duplicatedProject]);
    setActiveProjectId(duplicatedProject.id);
    setShowProjectOptions(null);
  };

  const deleteProject = (projectId) => {
    if (projects.length <= 1) {
      alert("You can't delete the last project. Create a new one first.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      setProjects(prev => prev.filter(p => p.id !== projectId));

      // If we're deleting the active project, switch to another one
      if (activeProjectId === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setActiveProjectId(remainingProjects[0]?.id || null);
      }
    }
    setShowProjectOptions(null);
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
    setShowAppearanceMenu(false);
  }

  const handleAppearanceClick = () => {
    setShowAppearanceMenu(!showAppearanceMenu);
  }

  const handleThemeChange = (selectedTheme) => {
    if (selectedTheme !== theme) {
      toggleTheme();
    }
    setShowAppearanceMenu(false);
    setShowSettingsMenu(false);
  }

  const handleJiraOAuthConnection = async () => {
    setIsConnecting(true);
    try {
      const result = await jiraIntegration.initiateOAuthFlow();
      if (result.success) {
        window.location.href = result.authUrl;
      } else {
        alert(`Failed to initiate OAuth: ${result.message}`);
        setIsConnecting(false);
      }
    } catch (error) {
      alert(`OAuth Error: ${error.message}`);
      setIsConnecting(false);
    }
  };

  const handleJiraDisconnect = () => {
    const result = jiraIntegration.disconnect();
    if (result.success) {
      setJiraStatus(null);
      alert('Disconnected from Jira successfully');
    }
    setShowSettingsMenu(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      if (onLogout) {
        onLogout();
      }
    }
    setShowSettingsMenu(false);
  };

  const startEditingProject = (projectId, currentName) => {
    setEditingProjectId(projectId);
    setTempProjectName(currentName);
    setShowProjectOptions(null);
  }

  const saveProjectName = (projectId) => {
    if (tempProjectName.trim()) {
      setProjects(projects.map(project =>
        project.id === projectId
          ? { ...project, name: tempProjectName.trim(), lastModified: new Date().toISOString() }
          : project
      ));
    }
    setEditingProjectId(null);
    setTempProjectName('');
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setTempProjectName('');
  };

  const handleKeyPress = (e, projectId) => {
    if (e.key === 'Enter') {
      saveProjectName(projectId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleInputBlur = (projectId) => {
    saveProjectName(projectId);
  };

  const handleProjectOptionsClick = (e, projectId) => {
    e.stopPropagation();
    setShowProjectOptions(showProjectOptions === projectId ? null : projectId);
  };

  const getJiraStatusText = () => {
    if (!jiraStatus) return 'Connect to Jira';
    if (isConnecting) return 'Connecting...';

    const authType = jiraStatus.isOAuth ? 'OAuth' : 'API Token';
    return `Disconnect Jira (${authType})`;
  };

  const getJiraStatusSubtext = () => {
    if (!jiraStatus) return null;

    const domain = jiraStatus.domain?.replace('https://', '') || 'Unknown domain';
    const email = jiraStatus.email || 'Unknown user';

    return (
      <div className="jira-status-info">
        <small>{email}</small>
        <small>{domain}</small>
        {jiraStatus.isOAuth && jiraStatus.expiresAt && (
          <small>Expires: {new Date(jiraStatus.expiresAt).toLocaleDateString()}</small>
        )}
      </div>
    );
  };

  const formatProjectDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  const settingsMenuItems = [
    {
      label: 'Account',
      action: () => console.log('Account')
    },
    {
      label: 'People',
      action: () => console.log('People')
    },
    {
      label: 'Appearance',
      action: handleAppearanceClick,
      hasSubmenu: true
    },
    { type: 'separator' },
    {
      label: getJiraStatusText(),
      action: jiraStatus ? handleJiraDisconnect : handleJiraOAuthConnection,
      disabled: isConnecting,
      subtext: getJiraStatusSubtext(),
      isJiraItem: true
    },
    { type: 'separator' },
    {
      label: 'Sign Out',
      action: handleLogout,
      isLogoutItem: true
    }
  ];

  // Sort projects by last modified (most recent first)
  const sortedProjects = [...projects].sort((a, b) =>
    new Date(b.lastModified) - new Date(a.lastModified)
  );

  return (
    <div className={`sidebar ${extended ? 'extended' : ''}`}>
      <div className="top">
        <img onClick={() => setExtended(prev => !prev)} className='menu' src={assets.menu_icon} alt='menu icon' />
        <div className="new-chat" onClick={createNewProject}>
          <img src={assets.plus_icon} alt='expand icon' style={{ filter: 'hue-rotate(200deg)' }} />
          {extended ? <p>New Project</p> : null}
        </div>
        {extended ?
          <div className="recent">
            <p className="recent-title">Projects</p>
            {sortedProjects.map(project => (
              <div
                key={project.id}
                className={`recent-entry project-entry ${activeProjectId === project.id ? 'active-project' : ''}`}
                onClick={() => switchToProject(project.id)}
              >
                <img src={assets.message_icon} alt='message icon' style={{ filter: 'hue-rotate(100deg)' }} />
                <div className="project-content">
                  {editingProjectId === project.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={tempProjectName}
                      onChange={(e) => setTempProjectName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, project.id)}
                      onBlur={() => handleInputBlur(project.id)}
                      className="project-name-input"
                      maxLength={100}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p
                        onDoubleClick={() => startEditingProject(project.id, project.name)}
                        className="project-name-editable"
                        title="Double click to edit the project name"
                      >
                        {project.name}
                      </p>
                      <span className="project-last-modified">
                        {formatProjectDate(project.lastModified)}
                      </span>
                    </>
                  )}
                </div>
                <div className="project-options-wrapper">
                  <button
                    className="project-options-btn"
                    onClick={(e) => handleProjectOptionsClick(e, project.id)}
                    title="Project options"
                  >
                    ⋮
                  </button>
                  {showProjectOptions === project.id && (
                    <div
                      ref={projectOptionsRef}
                      className="project-options-menu"
                    >
                      <div
                        className="project-option"
                        onClick={() => startEditingProject(project.id, project.name)}
                      >
                        <span>Rename</span>
                      </div>
                      <div
                        className="project-option"
                        onClick={() => duplicateProject(project.id)}
                      >
                        <span>Duplicate</span>
                      </div>
                      <div className="project-option-separator"></div>
                      <div
                        className="project-option delete-option"
                        onClick={() => deleteProject(project.id)}
                      >
                        <span>Delete</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          : null}
      </div>
      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt='question icon' />
          {extended ? <p>Help</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt='history icon' />
          {extended ? <p>Activity</p> : null}
        </div>
        <div className="bottom-item recent-entry settings-item" style={{ position: 'relative' }}>
          <img
            src={assets.setting_icon}
            alt='settings icon'
            onClick={handleSettingsClick}
          />
          {extended ? <p onClick={handleSettingsClick}>Settings</p> : null}

          {showSettingsMenu && (
            <div
              ref={settingsMenuRef}
              className="settings-dropdown"
            >
              {settingsMenuItems.map((item, index) => {
                if (item.type === 'separator') {
                  return (
                    <div
                      key={index}
                      className="settings-menu-separator"
                    />
                  );
                }

                return (
                  <div
                    key={index}
                    className={`settings-menu-item ${item.disabled ? 'disabled' : ''} ${item.isJiraItem ? 'jira-item' : ''} ${item.isLogoutItem ? 'logout-item' : ''}`}
                    onClick={() => {
                      if (!item.disabled) {
                        item.action();
                        if (!item.hasSubmenu) {
                          setShowSettingsMenu(false);
                        }
                      }
                    }}
                    style={{ position: 'relative' }}
                  >
                    <div className="settings-menu-item-content">
                      <span className="settings-menu-label">{item.label}</span>
                      {item.shortcut && (
                        <span className="settings-menu-shortcut">
                          {item.shortcut}
                        </span>
                      )}
                      {item.hasSubmenu && (
                        <span className="settings-menu-arrow">▶</span>
                      )}
                    </div>
                    {item.subtext && (
                      <div className="settings-menu-subtext">
                        {item.subtext}
                      </div>
                    )}
                    {item.hasSubmenu && showAppearanceMenu && (
                      <div
                        ref={appearanceMenuRef}
                        className="appearance-dropdown"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '100%',
                          marginLeft: '8px',
                          zIndex: 1000
                        }}
                      >
                        <div
                          className={`appearance-menu-item ${theme === 'light' ? 'active' : ''}`}
                          onClick={() => handleThemeChange('light')}
                        >
                          <span className="label">Light mode</span>
                          {theme === 'light' && <span className="checkmark">✓</span>}
                        </div>
                        <div
                          className={`appearance-menu-item ${theme === 'dark' ? 'active' : ''}`}
                          onClick={() => handleThemeChange('dark')}
                        >
                          <span className="label">Dark mode</span>
                          {theme === 'dark' && <span className="checkmark">✓</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar;