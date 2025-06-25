import React, { useState } from "react";
import { ThemeProvider } from '../../contexts/ThemeContext';
import Sidebar from "../Sidebar/Sidebar";
import Main from "../Main/Main";
import '../../index.css';

const Dashboard = ({ user, onLogout }) => {
    const [currentProject, setCurrentProject] = useState(null);

    const handleProjectChange = (project) => {
        console.log('Project changed:', project);
        setCurrentProject(project);
    };

    const handleProjectUpdate = (updatedProject) => {
        console.log('Project updated:', updatedProject);
        setCurrentProject(updatedProject);
    };

    return (
        <ThemeProvider>
            <div className="dashboard">
                <Sidebar
                    onProjectChange={handleProjectChange}
                    currentProjectId={currentProject?.id}
                    onLogout={onLogout}
                />
                <Main
                    user={user}
                    currentProject={currentProject}
                    onProjectUpdate={handleProjectUpdate}
                />
            </div>
        </ThemeProvider>
    );
};

export default Dashboard;