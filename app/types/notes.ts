// Data models for the Notes and Lab Manual Pipeline

export enum NoteSectionType {
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  PROCEDURE_STEPS = 'procedure_steps',
  SAFETY_NOTES = 'safety_notes',
  CALCULATIONS = 'calculations',
  CONCEPTUAL_THEORY = 'conceptual_theory',
  TROUBLESHOOTING = 'troubleshooting',
  OTHER = 'other',
}

export interface NoteSection {
  type: NoteSectionType;
  title: string;
  content: string;
  order: number;
}

export interface ExtractedNote {
  id: string;
  userId: string;
  title: string;
  originalFileName: string;
  originalFileUrl?: string;
  rawText: string;
  cleanedText: string;
  sections: NoteSection[];
  tags: string[];
  course?: string;
  experiment?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  summary?: string;
}

export interface FileUploadMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ProcessingResult {
  rawText: string;
  cleanedText: string;
  sections: NoteSection[];
  metadata: FileUploadMetadata;
}

