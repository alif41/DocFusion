export type PageRoute = 'home' | 'about' | 'contact' | 'login' | 'register';

export type ToolCategory = 'all' | 'organize' | 'convert' | 'optimize' | 'security' | 'edit';

export interface PlannedTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  badge: 'Planned' | 'In Development' | 'Architecture Ready' | 'Future Core' | 'Live Now';
  iconName: string;
  tags: string[];
  routePath?: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  highlight: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
