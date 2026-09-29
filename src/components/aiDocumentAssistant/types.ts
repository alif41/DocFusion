export interface DocumentPageSummary {
  pageNumber: number;
  wordCount: number;
  charCount: number;
  preview: string;
}

export interface CitationReference {
  pageNumber?: number;
  section?: string;
  quote?: string;
}

export interface DocumentAnalysisData {
  sessionId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  totalPages: number;
  totalWords: number;
  synopsis: string;
  keyTopics: string[];
  suggestedQuestions: string[];
  pages: DocumentPageSummary[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  references?: CitationReference[];
  suggestedFollowUps?: string[];
  actionType?: 'summarize' | 'explain' | 'extract' | 'faqs';
  isError?: boolean;
}

export type QuickActionType = 'summarize' | 'explain' | 'extract' | 'faqs';
