import { ArtifactStages, GenerationStages } from "../constants/artifactStages";

export function getCurrentActionDescription(artifactStage, generationStage) {
    if (artifactStage === ArtifactStages.Conversation) {
        return 'Having a conversation';
    }
    
    const actions = {
        [ArtifactStages.Documentation]: {
            [GenerationStages.Creating]: 'Generating documentation (Jira stories)',
            [GenerationStages.Modifying]: 'Modifying documentation'
        },
        [ArtifactStages.Diagram]: {
            [GenerationStages.Creating]: 'Generating diagrams',
            [GenerationStages.Modifying]: 'Modifying diagrams'
        },
        [ArtifactStages.Code]: {
            [GenerationStages.Creating]: 'Generating code',
            [GenerationStages.Modifying]: 'Modifying code'
        }
    };
    return actions[artifactStage]?.[generationStage] || 'Ready for input';
}

export function getGreetingText(artifactStage) {
    return artifactStage === ArtifactStages.Conversation 
        ? "Let's chat! What's on your mind?" 
        : "What are we developing today?";
}

export function getBottomInfoText(artifactStage, isWaitingResponse, getCurrentActionDescription) {
    if (isWaitingResponse) {
        return `Processing: ${getCurrentActionDescription()}...`;
    }
    
    return artifactStage === ArtifactStages.Conversation ?
        "Ask me anything! We're just having a conversation." :
        "Specify the requirements for your project!";
}