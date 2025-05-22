// src/hooks/useStageManager.js
import { useState, useCallback, useRef } from 'react';

const ArtifactStages = ['Documentation', 'Diagram', 'Code', 'Conversation'];
const GenerationStages = ['Creating', 'Modifying'];

class StageManager {
    constructor() {
        this.artifactStage = ArtifactStages[0];
        this.generationStage = GenerationStages[0];
    }

    advanceArtifactStage() {
        const idx = ArtifactStages.indexOf(this.artifactStage);
        if (idx < ArtifactStages.length - 1) {
            this.artifactStage = ArtifactStages[idx + 1];
        }
    }

    setGenerationStage(stage) {
        if (GenerationStages.includes(stage)) {
            this.generationStage = stage;
        }
    }

    reset() {
        this.artifactStage = ArtifactStages[0];
        this.generationStage = GenerationStages[0];
    }
}

export function useStageManager() {
    const managerRef = useRef(new StageManager());

    const [artifactStage, setArtifactStage] = useState(managerRef.current.artifactStage);
    const [generationStage, setGenerationStageState] = useState(managerRef.current.generationStage);

    const advanceArtifactStage = useCallback(() => {
        managerRef.current.advanceArtifactStage();
        setArtifactStage(managerRef.current.artifactStage);
    }, []);

    const setGenerationStage = useCallback((stage) => {
        managerRef.current.setGenerationStage(stage);
        setGenerationStageState(managerRef.current.generationStage);
    }, []);

    const reset = useCallback(() => {
        managerRef.current.reset();
        setArtifactStage(managerRef.current.artifactStage);
        setGenerationStageState(managerRef.current.generationStage);
    }, []);

    return {
        artifactStage,
        generationStage,
        advanceArtifactStage,
        setGenerationStage,
        reset,
        // si quieres exponer las listas originales:
        ArtifactStages,
        GenerationStages,
    };
}
