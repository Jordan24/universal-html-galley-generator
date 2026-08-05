import JSZip from 'jszip';
import saveAs from 'file-saver';

export async function downloadZipPackage(htmlContent: string, fileNameTitle: string): Promise<void> {
  const sanitizedTitle = fileNameTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const zip = new JSZip();

  // Add index.html to ZIP root
  zip.file('index.html', htmlContent);

  // Add LICENSE file
  zip.file('LICENSE', `Apache License 2.0\n\nGenerated via Universal HTML Galley Generator.`);

  // Add styles folder with custom galley CSS
  zip.folder('styles')?.file('galley-base.css', `/* Base Galley Styles */\nbody { font-family: 'Merriweather', serif; }`);

  const content = await zip.generateAsync({ type: 'blob' });
  const outputFileName = `${sanitizedTitle || 'article-galley'}-package.zip`;

  saveAs(content, outputFileName);
}
