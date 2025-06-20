import React, {useState} from "react";
import Sidebar from "../Sidebar/Sidebar";
import Main from "../Main/Main";
import '../../index.css';

const Dashboard = ({ user }) => {
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
        <div className="dashboard">
            <Sidebar 
                onProjectChange={handleProjectChange}
                currentProjectId={currentProject?.id}
            />
            <Main 
                user={user} 
                currentProject={currentProject}
                onProjectUpdate={handleProjectUpdate}
            />
        </div>
    );
};

export default Dashboard;
