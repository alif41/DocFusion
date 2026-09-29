export interface DocumentPage {
  pageNumber: number;
  text: string;
  charCount: number;
  wordCount: number;
}

export interface CitationReference {
  pageNumber?: number;
  section?: string;
  quote?: string;
}

export interface DocumentAnalysis {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  totalPages: number;
  totalWords: number;
  totalChars: number;
  synopsis: string;
  keyTopics: string[];
  suggestedQuestions: string[];
  pages: DocumentPage[];
  uploadedAt: number;
}

export interface ChatHistoryItem {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

export interface ChatResponse {
  reply: string;
  references: CitationReference[];
  suggestedFollowUps: string[];
  actionType?: string;
}

export type QuickActionType = 'summarize' | 'explain' | 'extract' | 'faqs';
