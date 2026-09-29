import { PlannedTool, BenefitItem, FaqItem } from '../types';

export const PLANNED_TOOLS: PlannedTool[] = [
  {
    id: 'tool-merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files, documents, and sheets into a single structured master document with intuitive page ordering.',
    category: 'organize',
    badge: 'Live Now',
    iconName: 'Combine',
    tags: [],
    routePath: '/merge',
  },
  {
    id: 'tool-split',
    name: 'Split PDF',
    description: 'Extract specific page ranges, split by bookmarks, or decompose multi-page dossiers into isolated, individual PDFs.',
    category: 'organize',
    badge: 'Live Now',
    iconName: 'Scissors',
    tags: [],
    routePath: '/split',
  },
  {
    id: 'tool-compress',
    name: 'Compress PDF',
    description: 'Intelligently compress document assets, embedded vectors, and downsample bitmap imagery without degrading text readability.',
    category: 'optimize',
    badge: 'Live Now',
    iconName: 'Minimize2',
    tags: [],
    routePath: '/compress',
  },
  {
    id: 'tool-editor',
    name: 'PDF Editor',
    description: 'Upload any existing PDF or scanned paper. Automatically detects headings, paragraphs, fonts, images, and tables, converting the document into an editable canvas while preserving visual fidelity.',
    category: 'edit',
    badge: 'Live Now',
    iconName: 'Edit3',
    tags: [],
    routePath: '/edit',
  },
  {
    id: 'tool-convert',
    name: 'Universal Documents Converter',
    description: 'Transform documents between PDF, Word, PowerPoint, and Excel while preserving formatting and structure.',
    category: 'convert',
    badge: 'Live Now',
    iconName: 'FileOutput',
    tags: [],
    routePath: '/convert',
  },
  {
    id: 'tool-photo-convert',
    name: 'Universal Photo Converter',
    description: 'Convert photos and images between popular image formats, camera RAW, and PDF with full resolution preservation.',
    category: 'convert',
    badge: 'Live Now',
    iconName: 'Image',
    tags: [],
    routePath: '/photo-convert',
  },
  {
    id: 'tool-photo-resize',
    name: 'Photo Resize',
    description: 'Batch resize images by exact pixel dimensions, percentage scaling, or social and print presets with aspect ratio lock.',
    category: 'optimize',
    badge: 'Live Now',
    iconName: 'Scaling',
    tags: [],
    routePath: '/resize-photo',
  },
  {
    id: 'tool-html-to-pdf',
    name: 'HTML to PDF Converter',
    description: 'Transform web pages, documents, or ZIP packages into professional high-resolution PDF files with full vector fidelity.',
    category: 'convert',
    badge: 'Live Now',
    iconName: 'Code',
    tags: [],
    routePath: '/html-to-pdf',
  },
  {
    id: 'tool-watermark',
    name: 'Add Watermark to PDF',
    description: 'Protect your PDF with a customizable text or image watermark.',
    category: 'edit',
    badge: 'Live Now',
    iconName: 'Stamp',
    tags: [],
    routePath: '/watermark-pdf',
  },
  {
    id: 'tool-page-numbers',
    name: 'Add PDF Page Numbers',
    description: 'Insert customizable page numbers, headers, and footers with custom placement, formatting, and cover page skips.',
    category: 'edit',
    badge: 'Live Now',
    iconName: 'Hash',
    tags: [],
    routePath: '/page-numbers',
  },
  {
    id: 'tool-pdf-to-markdown',
    name: 'PDF to Markdown',
    description: 'Convert PDF documents into clean, structured Markdown with headings, tables, code blocks, and math formulas.',
    category: 'convert',
    badge: 'Live Now',
    iconName: 'FileText',
    tags: [],
    routePath: '/pdf-to-markdown',
  },
  {
    id: 'tool-organize',
    name: 'Organize PDF',
    description: 'Rearrange, reorder, and organize your PDF pages with simple drag and drop.',
    category: 'organize',
    badge: 'Live Now',
    iconName: 'Layers',
    tags: [],
    routePath: '/organize-pdf',
  },
];

export const CORE_BENEFITS: BenefitItem[] = [
  {
    id: 'simple',
    title: 'Simple',
    tagline: 'Cognitive ease by design',
    description:
      'Zero cluttered toolbars, obscure menus, or aggressive popups. Every workflow is streamlined down to minimal essential steps with instant clarity.',
    iconName: 'Sparkles',
    highlight: 'Clean Interface',
  },
  {
    id: 'fast',
    title: 'Fast',
    tagline: 'Sub-second response targets',
    description:
      'Engineered with modern web workers and memory-efficient streaming pipelines so processing bottlenecks are eliminated from day one.',
    iconName: 'Zap',
    highlight: '< 50ms UI Jitter',
  },
  {
    id: 'secure',
    title: 'Secure',
    tagline: 'Zero-knowledge privacy core',
    description:
      'Your documents are private. DocFusion is designed for localized client-side sandboxing, ensuring confidential data never leaves your environment unnecessarily.',
    iconName: 'Shield',
    highlight: 'Privacy by Default',
  },
  {
    id: 'easy-to-use',
    title: 'Easy to Use',
    tagline: 'Built for every workflow',
    description:
      'Whether you are an individual student organizing lecture notes or an enterprise team managing legal packets, everything is one click away.',
    iconName: 'CheckCircle2',
    highlight: 'Frictionless',
  },
];

export const GENERAL_FAQS: FaqItem[] = [
  {
    question: 'What is DocFusion?',
    answer:
      'DocFusion is a modern, high-performance web platform designed to unify all your document and PDF tasks into a single, cohesive, elegant interface. We are building the next-generation document ecosystem from the ground up.',
  },
  {
    question: 'When will the document and PDF tools be operational?',
    answer:
      'We are currently in Phase 1: Core Website, Brand Identity, UX System & Architecture. In Phase 2, we will roll out the foundational PDF engines (Merge, Split, Lossless Optimize, and Universal Doc Converter) with client-side sandboxing.',
  },
  {
    question: 'How is DocFusion different from legacy online PDF converters?',
    answer:
      'Legacy PDF sites are often cluttered with spam ads, misleading download buttons, and security ambiguities. DocFusion focuses on high-craft design, privacy-first sandboxing, rapid performance, and a delightful SaaS developer experience.',
  },
  {
    question: 'Is DocFusion free to use during early preview?',
    answer:
      'Yes. Our foundational release is completely free. Early adopters can explore the platform architecture, preview planned tools, and submit feature requests.',
  },
];
