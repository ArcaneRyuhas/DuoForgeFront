import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css'
import { assets } from '../../assets/assets';
import jiraIntegration from '../../hooks/Jira/jiraIntegration';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [jiraStatus, setJiraStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const [projects, setprojects] = useState([
    {id: 1, name: 'Unnamed project'}
  ])
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [tempProjectName, setTempProjectName] = useState('');

  const settingsMenuRef = useRef(null);
  const appearanceMenuRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect (() => {
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
              // Limpiar la URL
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
        if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)){
            setShowSettingsMenu(false);
        }
        if (appearanceMenuRef.current && !appearanceMenuRef.current.contains(event.target)){
            setShowAppearanceMenu(false);
        }
    }; 
    document.addEventListener('mousedown', handleClicksOutside);
    return() => {
        document.removeEventListener('mousedown', handleClicksOutside)
    };
  }, []);

  useEffect (() => {
    if (editingProjectId && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
    }
  }, [editingProjectId]);

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
    setShowAppearanceMenu(false); // Close appearance menu when settings menu opens
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
    if (result.success){
        setJiraStatus(null);
        alert('Disconnected from Jira successfully');
    }
    setShowSettingsMenu(false);
  };

  const startEditingProject = (projectId, currentName) => {
    setEditingProjectId(projectId);
    setTempProjectName(currentName);
  }

  const saveProjectName = (projectId) => {
    if (tempProjectName.trim()){
        setprojects(projects.map(project => 
            project.id === projectId
            ?{...project, name: tempProjectName.trim()}
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
        }
    ];

return (
        <div className={`sidebar ${extended ? 'extended' : ''}`}>
                <div className="top">
                        <img onClick={()=>setExtended(prev=>!prev)} className='menu' src={assets.menu_icon} alt='menu icon'/>
                        <div className="new-chat">
                                <img src={assets.plus_icon} alt='expand icon' style={{filter: 'hue-rotate(200deg)'}}/>
                                {extended ? <p>New Project</p> : null}
                        </div>
                        {extended ? 
                        <div className="recent">
                                <p className="recent-title">Recent</p>
                                {projects.map(project => (
                                        <div key={project.id} className="recent-entry">
                                                <img src={assets.message_icon} alt='message icon' style={{ filter: 'hue-rotate(100deg)' }}/>
                                                {editingProjectId === project.id ? (
                                                        <input
                                                                ref={editInputRef}
                                                                type="text"
                                                                value={tempProjectName}
                                                                onChange={(e) => setTempProjectName(e.target.value)}
                                                                onKeyDown={(e) => handleKeyPress(e, project.id)}
                                                                onBlur ={() => handleInputBlur(project.id)}
                                                                className = "projec-name-input"
                                                                maxLength={100}
                                                        />
                                                ): (
                                                        <p
                                                                onDoubleClick={()=> startEditingProject(project.id, project.name)}
                                                                className="project-name-editable"
                                                                title="Double click to edit the project name"
                                                        >
                                                                {project.name}
                                                        </p>
                                                )}
                                        </div>
                                ))}
                        </div>
                        :null}
                </div>
                <div className="bottom">
                        <div className="bottom-item recent-entry">
                                <img src={assets.question_icon} alt='question icon'/>
                                {extended ? <p>Help</p> : null}
                        </div>
                        <div className="bottom-item recent-entry settings-item" style={{ position: 'relative' }}>
                                <img 
                                        src={assets.setting_icon} 
                                        alt='settings icon'
                                        onClick={handleSettingsClick}
                                />
                                {extended ? <p onClick={handleSettingsClick}>Settings</p> : null }

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
                                                                        className={`settings-menu-item ${item.disabled ? 'disabled' : ''} ${item.isJiraItem ? 'jira-item' : ''}`}
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