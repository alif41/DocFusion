import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { HomePage } from '../pages/HomePage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { MergePDFPage } from '../pages/MergePDFPage';
import { SplitPDFPage } from '../pages/SplitPDFPage';
import { CompressPDFPage } from '../pages/CompressPDFPage';
import { EditPDFPage } from '../pages/EditPDFPage';
import { UniversalConverterPage } from '../pages/UniversalConverterPage';
import { UniversalPhotoConverterPage } from '../pages/UniversalPhotoConverterPage';
import { HtmlToPdfPage } from '../pages/HtmlToPdfPage';
import { OrganizePdfPage } from '../pages/OrganizePdfPage';
import { WatermarkPdfPage } from '../pages/WatermarkPdfPage';
import { AddPageNumbersPage } from '../pages/AddPageNumbersPage';
import { PhotoResizePage } from '../pages/PhotoResizePage';
import { PdfToMarkdownPage } from '../pages/PdfToMarkdownPage';
import { AiDocumentAssistantPage } from '../pages/AiDocumentAssistantPage';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
    <div className="w-16 h-16 rounded-2xl bg-[#141420] border border-[#262638] text-[#a78bfa] flex items-center justify-center">
      <FileQuestion className="w-8 h-8" />
    </div>
    <span className="text-xs font-mono text-[#a78bfa] uppercase tracking-wider bg-[#7c3aed]/10 px-3 py-1 rounded-full border border-[#7c3aed]/20">
      404 Error
    </span>
    <h1 className="text-3xl font-bold text-white">Route Not Found</h1>
    <p className="text-sm text-neutral-400 max-w-md">
      The requested DocFusion view does not exist in this foundation release.
    </p>
    <div className="pt-2">
      <Link to="/">
        <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Overview
        </Button>
      </Link>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="merge" element={<MergePDFPage />} />
        <Route path="split" element={<SplitPDFPage />} />
        <Route path="compress" element={<CompressPDFPage />} />
        <Route path="edit" element={<EditPDFPage />} />
        <Route path="editor" element={<Navigate to="/edit" replace />} />
        <Route path="convert" element={<UniversalConverterPage />} />
        <Route path="converter" element={<Navigate to="/convert" replace />} />
        <Route path="photo-convert" element={<UniversalPhotoConverterPage />} />
        <Route path="photos" element={<Navigate to="/photo-convert" replace />} />
        <Route path="photo-converter" element={<Navigate to="/photo-convert" replace />} />
        <Route path="resize-photo" element={<PhotoResizePage />} />
        <Route path="photo-resize" element={<Navigate to="/resize-photo" replace />} />
        <Route path="resize-image" element={<Navigate to="/resize-photo" replace />} />
        <Route path="html-to-pdf" element={<HtmlToPdfPage />} />
        <Route path="html" element={<Navigate to="/html-to-pdf" replace />} />
        <Route path="organize-pdf" element={<OrganizePdfPage />} />
        <Route path="organize" element={<Navigate to="/organize-pdf" replace />} />
        <Route path="watermark-pdf" element={<WatermarkPdfPage />} />
        <Route path="watermark" element={<Navigate to="/watermark-pdf" replace />} />
        <Route path="page-numbers" element={<AddPageNumbersPage />} />
        <Route path="add-page-numbers" element={<Navigate to="/page-numbers" replace />} />
        <Route path="page-numbering" element={<Navigate to="/page-numbers" replace />} />
        <Route path="pdf-to-markdown" element={<PdfToMarkdownPage />} />
        <Route path="markdown" element={<Navigate to="/pdf-to-markdown" replace />} />
        <Route path="pdf2md" element={<Navigate to="/pdf-to-markdown" replace />} />
        <Route path="ai-document-assistant" element={<AiDocumentAssistantPage />} />
        <Route path="ai-assistant" element={<Navigate to="/ai-document-assistant" replace />} />
        <Route path="ai" element={<Navigate to="/ai-document-assistant" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
