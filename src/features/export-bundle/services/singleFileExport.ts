import saveAs from 'file-saver';

export function downloadSingleFileHtml(htmlContent: string, fileNameTitle: string): void {
  const sanitizedTitle = fileNameTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const outputFileName = `${sanitizedTitle || 'article-galley'}-standalone.html`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  saveAs(blob, outputFileName);
}
