export enum ParticipantRole {
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  persona: string;
  avatar: string; 
  isCustom?: boolean;
}

export interface Message {
  id: string;
  participantId: string;
  text: string;
}

export enum DebateStatus {
  SETTINGS = 'SETTINGS',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
}

export type Turn = {
  participantId: string;
  action: 'CONTRIBUTING' | 'DECIDING';
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  LMSTUDIO = 'LMSTUDIO',
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  lmStudioPort: number;
}