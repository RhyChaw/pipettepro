// Data models for simulation scenarios generated from notes

export enum SimulatorActionType {
  SELECT_PIPETTE = 'select_pipette',
  ATTACH_TIP = 'attach_tip',
  SET_VOLUME = 'set_volume',
  MOVE_TO_SOURCE = 'move_to_source',
  ASPIRATE = 'aspirate',
  MOVE_TO_TARGET = 'move_to_target',
  DISPENSE = 'dispense',
  EJECT_TIP = 'eject_tip',
  WAIT = 'wait',
  CHECK = 'check',
}

export interface SimulatorStep {
  id: string;
  type: SimulatorActionType;
  order: number;
  instruction: string;
  targetVolume?: number;
  pipetteId?: string; // 'p2', 'p10', 'p200', 'p1000'
  sourceContainer?: string;
  targetContainer?: string;
  waitTime?: number; // in seconds
  checkCondition?: string;
  validationCriteria?: {
    volume?: number;
    pipette?: string;
    container?: string;
  };
}

export interface SimulationScenario {
  id: string;
  noteId?: string; // Optional - only present if generated from notes
  userId?: string; // User who created this scenario
  title: string;
  description: string;
  experimentType: string;
  equipment: string[];
  reagents: {
    name: string;
    volume?: number;
    container?: string;
  }[];
  steps: SimulatorStep[];
  createdAt: string;
  updatedAt?: string;
  estimatedDuration?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  missingInfo?: string[]; // Info that was missing and needs clarification
}

export interface ScenarioPreview {
  scenario: SimulationScenario;
  canStart: boolean;
  warnings: string[];
}

