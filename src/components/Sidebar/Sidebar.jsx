import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css'
import { assets } from '../../assets/assets';
import jiraIntegration from '../../hooks/Jira/jiraIntegration';
import JiraCredentialModal from '../JiraModal/JiraCredentialModal';


const Sidebar = () => {

  const [extended, setExtended] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraStatus, setJiraStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);


  const [projects, setprojects] = useState([
    {id: 1, name: 'Unnamed project'}
  ])
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [tempProjectName, setTempProjectName] = useState('');

  const settingsMenuRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect (() => {
    const isConnected = jiraIntegration.isJiraConnected();
    if (isConnected) {
        const status = jiraIntegration.getConnectionStatus();
        setJiraStatus(status);
    }
  }, []);

  useEffect(() => {
    const handleClicksOutside = (event) => {
        if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)){
            setShowSettingsMenu(false);
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
  }

  const handleJiraConnection = async (formData) => {
    setIsConnecting(true);
    try {
        const result = await jiraIntegration.connectToJira(
            formData.domain,
            formData.email,
            formData.api_token
        );
        if (result.success){
            const status = jiraIntegration.getConnectionStatus();
            setJiraStatus(status);
            setShowJiraModal(false);
            alert('Succesfully connected to Jira!');
        } else {
            alert (`Failed to connect: ${result.message}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        setIsConnecting(false)
    }
  };

  const handleJiraDisconnect =()=> {
    const result = jiraIntegration.disconnect();
    if (result.success){
        setJiraStatus(null);
        alert('Disconnect from Jira succesfully');
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
            action: () => console.log('Appearance')
        },
        { type: 'separator' },
        {
            label: jiraStatus ? 'Disconnect from Jira' : 'Link InfyCode to Jira Account',
            action: jiraStatus ? handleJiraDisconnect : () => setShowJiraModal(true)
        }
    ];
  return (
    <div className="sidebar">
        <div className="top">
            <img onClick={()=>setExtended(prev=>!prev)} className='menu' src={assets.menu_icon} alt='menu icon'/>
            <div className="new-chat">
                <img src={assets.plus_icon} alt='expand icon' style={{ filter: 'hue-rotate(200deg)' }}/>
                {extended ? <p>New Project</p> : null}
            </div>
            {extended ? 
            <div className="recent">
                <p className="recent-title">Recent</p>
                {projects.map(project => (
                    <div key={project.id} className="recent-entry">
                    <img src={assets.message_icon} alt='message icon'/>
                    {editingProjectId === project.id ? (
                        <input
                        ref={editInputRef}
                        type="text"
                        value={tempProjectName}
                        onChange={(e) => setTempProjectName(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, project.id)}
                        onBlur ={() => handleInputBlur(project.id)}
                        className = "projec-name-input"
                        maxLength={50}
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
            <div className="bottom-item recent-entry" style={{position: 'relative'}}>
                <img 
                src={assets.setting_icon} 
                alt='history icon'
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
                                        className="settings-menu-item"
                                        onClick={() => {
                                            item.action();
                                            if (!item.label.includes('Jira')) {
                                                setShowSettingsMenu(false);
                                            }
                                        }}
                                    >
                                        <span>{item.label}</span>
                                        {item.shortcut && (
                                            <span className="settings-menu-shortcut">
                                                {item.shortcut}
                                            </span>
                                        )}
                                        {item.hasSubmenu && (
                                            <span className="settings-menu-arrow">▶</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div> 
             <JiraCredentialModal 
                isOpen={showJiraModal}
                onClose={() => setShowJiraModal(false)}
                onSubmit={handleJiraConnection}
            />
        </div>
    )
}

export default Sidebar;