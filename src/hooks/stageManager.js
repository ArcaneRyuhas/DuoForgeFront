// src/hooks/useStageManager.js
import { useState, useCallback, useRef } from 'react';
import { ArtifactStagesArray, GenerationStagesArray} from '../constants/artifactStages';

class StageManager {
    constructor() {
        this.artifactStage = ArtifactStagesArray[0];
        this.generationStage = GenerationStagesArray[0];
    }

    advanceArtifactStage() {
        const idx = ArtifactStagesArray.indexOf(this.artifactStage);
        if (idx < ArtifactStagesArray.length - 1) {
            this.artifactStage = ArtifactStagesArray[idx + 1];
        }
    }

    setGenerationStage(stage) {
        if (GenerationStagesArray.includes(stage)) {
            this.generationStage = stage;
        }
    }

    reset() {
        this.artifactStage = ArtifactStagesArray[0];
        this.generationStage = GenerationStagesArray[0];
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
    };
}
