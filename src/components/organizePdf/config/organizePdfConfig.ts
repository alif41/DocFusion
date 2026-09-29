export const ORGANIZE_PDF_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxPageThumbnailRenderConcurrency: 3, // Render 3 thumbnails at a time to prevent UI thread lock
  thumbnailScale: 0.35, // Balanced thumbnail crispness vs RAM
  zoomLevels: [75, 100, 125, 150],
  defaultZoom: 100,
  minZoom: 75,
  maxZoom: 150,
  stepProgressDurations: {
    preparing: 450,
    applying: 550,
    rebuilding: 700,
    finalizing: 400,
  },
};
