import saveAs from 'file-saver';
import { sanitizeHtmlForExport } from './exportSanitizer';

export function downloadSingleFileHtml(htmlContent: string, fileNameTitle: string): void {
  const sanitizedTitle = fileNameTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const outputFileName = `${sanitizedTitle || 'article-galley'}-standalone.html`;

  const cleanHtml = sanitizeHtmlForExport(htmlContent);

  const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
  saveAs(blob, outputFileName);
}
