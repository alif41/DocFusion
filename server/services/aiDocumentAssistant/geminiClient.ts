import { GoogleGenAI } from '@google/genai';
import { DocumentAnalysis, ChatHistoryItem, ChatResponse, CitationReference, QuickActionType } from './types';

// Initialize the GoogleGenAI client (automatically picks up process.env.GEMINI_API_KEY)
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI(apiKey ? { apiKey } : {});
}

// Resilient model fallback list adhering to skill guidelines
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

/**
 * Executes a Gemini request with automatic multi-model fallback in case of temporary 503/429 spikes
 */
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errStr = err?.message || String(err);
      console.warn(`Gemini model "${model}" encountered error:`, errStr.slice(0, 150));

      if (
        errStr.includes('503') ||
        errStr.includes('high demand') ||
        errStr.includes('UNAVAILABLE') ||
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED')
      ) {
        // Try fallback candidate model
        continue;
      }
      throw err;
    }
  }

  const errMsg = lastError?.message || String(lastError);
  if (
    errMsg.includes('503') ||
    errMsg.includes('high demand') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('429')
  ) {
    throw new Error('Google Gemini API is temporarily experiencing high traffic. Please retry in a few moments.');
  }

  // Parse out inner error message if JSON string
  try {
    const parsed = JSON.parse(errMsg);
    if (parsed.error && parsed.error.message) {
      throw new Error(parsed.error.message);
    }
  } catch {
    // Keep clean
  }

  throw new Error(errMsg);
}

/**
 * Builds formatted text with clear page boundaries for Gemini context
 */
function buildDocumentContextText(analysis: DocumentAnalysis): string {
  const header = `=== DOCUMENT: "${analysis.filename}" (${analysis.totalPages} pages, ${analysis.totalWords} words) ===\n\n`;
  const body = analysis.pages
    .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n');
  return header + body;
}

/**
 * Extracts citation references from text (e.g. [Page 2], [Page 12])
 */
function extractCitations(text: string, analysis: DocumentAnalysis): CitationReference[] {
  const pageRegex = /\[Page\s*(\d+)\]/gi;
  const foundPages = new Set<number>();
  let match;

  while ((match = pageRegex.exec(text)) !== null) {
    const pageNum = parseInt(match[1], 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= analysis.totalPages) {
      foundPages.add(pageNum);
    }
  }

  const citations: CitationReference[] = [];
  for (const pageNum of Array.from(foundPages).sort((a, b) => a - b)) {
    const pageObj = analysis.pages.find((p) => p.pageNumber === pageNum);
    citations.push({
      pageNumber: pageNum,
      section: `Page ${pageNum}`,
      quote: pageObj ? pageObj.text.slice(0, 140) + '...' : undefined,
    });
  }

  return citations;
}

/**
 * Generates an initial executive overview, key topics, and suggested starter questions
 */
export async function generateDocumentOverview(
  filename: string,
  pages: { pageNumber: number; text: string }[]
): Promise<{
  synopsis: string;
  keyTopics: string[];
  suggestedQuestions: string[];
}> {
  try {
    const sampleText = pages
      .slice(0, 8)
      .map((p) => `--- Page ${p.pageNumber} ---\n${p.text.slice(0, 1500)}`)
      .join('\n\n');

    const prompt = `Analyze this document titled "${filename}".
Return a JSON object with:
- "synopsis": A concise 2-3 sentence overview of what this document is, its core topic, and purpose.
- "keyTopics": An array of 3 to 5 key themes/topics covered (e.g. ["Contract Terms", "Liability", "Payment Schedule"]).
- "suggestedQuestions": An array of 4 insightful, specific questions a user or executive would ask about this document.

Document excerpt:
${sampleText}`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      synopsis: parsed.synopsis || `Analysis of ${filename} containing ${pages.length} pages.`,
      keyTopics: Array.isArray(parsed.keyTopics) && parsed.keyTopics.length > 0
        ? parsed.keyTopics
        : ['Document Overview', 'Key Provisions', 'Summary'],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length > 0
        ? parsed.suggestedQuestions
        : [
            'What is the primary purpose of this document?',
            'What are the most critical takeaways or obligations?',
            'Are there any notable dates, deadlines, or monetary figures?',
            'Summarize the conclusion or final section.',
          ],
    };
  } catch (err) {
    console.error('Gemini generateDocumentOverview fallback triggered:', err);
    return {
      synopsis: `Document "${filename}" ready for interactive Q&A across ${pages.length} pages.`,
      keyTopics: ['General Overview', 'Document Content', 'Key Details'],
      suggestedQuestions: [
        'What is this document about?',
        'What are the key points mentioned?',
        'Can you summarize page 1?',
        'What deadlines or names are mentioned?',
      ],
    };
  }
}

/**
 * Handles conversational Q&A grounded strictly in the document content
 */
export async function chatWithDocument(
  analysis: DocumentAnalysis,
  userMessage: string,
  history: ChatHistoryItem[] = []
): Promise<ChatResponse> {
  const documentContext = buildDocumentContextText(analysis);

  const systemInstruction = `You are DocFusion AI Document Assistant, an enterprise-grade document intelligence system.
Your job is to answer the user's questions accurately, comprehensively, and strictly based on the provided document content.

CRITICAL RULES:
1. Grounding Invariant: Answer using ONLY facts, numbers, clauses, and statements directly present in the document.
2. If the document does not contain the answer, explicitly state: "The provided document does not mention or contain information regarding this topic." Never hallucinate or infer unsupported external facts.
3. Page Citations: ALWAYS cite specific page numbers whenever making factual claims using brackets like [Page 1], [Page 3], etc.
4. Structure & Typography: Format responses with clean Markdown: bold headers, bullet lists, short readable paragraphs, and markdown tables where appropriate.
5. Professional Tone: Be direct, helpful, and concise while capturing all necessary nuance.`;

  // Build conversational turns for Gemini
  const contents: any[] = [
    {
      role: 'user',
      parts: [
        {
          text: `Here is the full document content you must reference for all answers:\n\n${documentContext}\n\nPlease confirm you are ready to answer questions about "${analysis.filename}".`,
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: `I have thoroughly read and indexed "${analysis.filename}" (${analysis.totalPages} pages, ${analysis.totalWords} words). I am ready to answer any questions strictly based on its contents with page citations.`,
        },
      ],
    },
  ];

  // Append history
  for (const item of history.slice(-8)) {
    contents.push({
      role: item.role === 'assistant' ? 'model' : item.role,
      parts: [{ text: item.text }],
    });
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const response = await callGeminiWithFallback({
    contents,
    config: {
      systemInstruction,
    },
  });

  const replyText = response.text || 'I was unable to process an answer. Please try rephrasing your question.';
  const references = extractCitations(replyText, analysis);

  // Generate 2-3 smart follow-up suggestions
  const suggestedFollowUps: string[] = [];
  try {
    const followUpPrompt = `Based on this user question: "${userMessage}" and assistant answer: "${replyText.slice(0, 300)}", generate 2 short relevant follow-up questions the user might ask next about the document "${analysis.filename}". Return as JSON array of strings e.g. ["Question 1?", "Question 2?"]`;
    const followUpRes = await callGeminiWithFallback({
      contents: followUpPrompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(followUpRes.text || '[]');
    if (Array.isArray(parsed)) {
      suggestedFollowUps.push(...parsed.slice(0, 3).filter((q: any) => typeof q === 'string'));
    }
  } catch {
    // Non-critical fallback
  }

  return {
    reply: replyText,
    references,
    suggestedFollowUps,
  };
}

/**
 * Handles conversational Q&A when no specific document is attached yet
 */
export async function chatGeneral(
  userMessage: string,
  history: ChatHistoryItem[] = []
): Promise<ChatResponse> {
  const systemInstruction = `You are DocFusion AI Assistant, a smart and helpful document intelligence assistant.
You specialize in document analysis, PDF tools (converting, merging, splitting, compressing, markdown transformation, watermarking), and content drafting.
Respond in clear, concise Markdown. If the user asks about a specific file or document they haven't uploaded yet, kindly remind them that they can attach any PDF, Word (.docx), or text file using the paperclip button in the chat.`;

  const contents: any[] = [];
  for (const item of history.slice(-6)) {
    contents.push({
      role: item.role === 'assistant' ? 'model' : item.role,
      parts: [{ text: item.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const response = await callGeminiWithFallback({
    contents,
    config: { systemInstruction },
  });

  const replyText = response.text || 'How can I help with your documents today?';
  return {
    reply: replyText,
    references: [],
    suggestedFollowUps: [
      'How can I convert PDF to Markdown?',
      'Can you summarize a contract for me?',
      'What file formats do you support?',
    ],
  };
}

/**
 * Executes one of the quick action workflows: summarize, explain, extract, faqs
 */
export async function executeQuickAction(
  analysis: DocumentAnalysis,
  action: QuickActionType
): Promise<ChatResponse> {
  const documentContext = buildDocumentContextText(analysis);

  let actionPrompt = '';
  switch (action) {
    case 'summarize':
      actionPrompt = `Provide a comprehensive, high-impact Executive Summary of "${analysis.filename}".
Format your output with:
# 📋 Executive Summary
A 2-3 paragraph synthesis of the document's core thesis, scope, and target audience.

## 🔑 Key Takeaways & Strategic Highlights
- 5 to 7 detailed bullet points capturing the most crucial facts, decisions, or terms.
- Each bullet MUST include a [Page X] citation.

## 📌 Conclusions & Next Steps
Summary of next steps, deadlines, or concluding remarks with page references.`;
      break;

    case 'explain':
      actionPrompt = `Perform an "Explain Difficult Sections" breakdown for "${analysis.filename}".
Identify dense legal clauses, technical jargon, complex formulas, acronyms, or ambiguous conditions and translate them into crystal-clear plain English.
Format your output with:
# 💡 Plain-English Section Breakdown

## 1. Key Terminology & Definitions Decoded
Define any industry terms or acronyms found in the text.

## 2. Complex Clauses & Conditions Explained
For each difficult or dense section:
- **Original Section / Term**: [Page X]
- **What it actually means**: Plain explanation in simple terms.
- **Why it matters**: Practical implications for the reader.`;
      break;

    case 'extract':
      actionPrompt = `Extract all critical structured data points from "${analysis.filename}" into Markdown tables.
Provide the following sections:

# 📊 Extracted Key Data Points

### 📅 1. Key Dates, Milestones & Deadlines
| Event / Milestone | Date / Timeline | Reference | Notes |
| :--- | :--- | :--- | :--- |
(Fill with dates found in the document)

### 👥 2. Organizations, Parties & Key Names
| Name / Entity | Role / Title | Reference |
| :--- | :--- | :--- |
(Fill with people/organizations found)

### 💰 3. Financial Metrics, Quantities & Numbers
| Metric / Figure | Value / Amount | Reference | Context |
| :--- | :--- | :--- | :--- |
(Fill with monetary values, percentages, counts)

### 📋 4. Action Items & Deliverables
List explicit deliverables or obligations with [Page X] citations.`;
      break;

    case 'faqs':
      actionPrompt = `Generate the 6 to 8 most critical Frequently Asked Questions (FAQs) that a reader, client, or auditor would have about "${analysis.filename}".
Format your output with:
# ❓ Frequently Asked Questions (FAQs)

For each question:
### Q: [Specific question about the document]
**A:** Detailed, grounded answer explaining the facts directly from the document. Include exact [Page X] references.`;
      break;
  }

  const systemInstruction = `You are DocFusion AI Document Assistant.
Answer strictly based on the provided document content. Include exact page citations like [Page 1], [Page 2] for all facts.`;

  const response = await callGeminiWithFallback({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `DOCUMENT CONTENT:\n${documentContext}\n\nTASK:\n${actionPrompt}`,
          },
        ],
      },
    ],
    config: { systemInstruction },
  });

  const replyText = response.text || 'Unable to generate action response.';
  const references = extractCitations(replyText, analysis);

  return {
    reply: replyText,
    references,
    suggestedFollowUps: [
      'Can you go into more detail on this?',
      'What are the associated risks or obligations?',
      'Are there any exceptions mentioned?',
    ],
    actionType: action,
  };
}
