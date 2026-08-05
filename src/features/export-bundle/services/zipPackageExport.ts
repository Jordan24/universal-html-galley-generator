import JSZip from 'jszip';
import saveAs from 'file-saver';

export async function downloadZipPackage(htmlContent: string, fileNameTitle: string): Promise<void> {
  const sanitizedTitle = fileNameTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  let finalHtml = htmlContent;
  let imageCounter = 1;

  // Regex to match data URL images in img src attributes
  const dataUrlRegex = /src=["'](data:image\/([a-zA-Z0-9]+);base64,([^"']+))["']/g;
  let match;

  while ((match = dataUrlRegex.exec(htmlContent)) !== null) {
    const dataUrl = match[1];
    const extension = match[2] === 'jpeg' ? 'jpg' : match[2];
    const base64Data = match[3];

    const imgFileName = `figure-${imageCounter}.${extension}`;
    const relativePath = `./images/${imgFileName}`;

    try {
      const binaryData = base64ToUint8Array(base64Data);
      imagesFolder?.file(imgFileName, binaryData);
      finalHtml = finalHtml.replace(dataUrl, relativePath);
      imageCounter++;
    } catch (e) {
      console.warn(`Failed to package image ${imgFileName} into ZIP export:`, e);
    }
  }

  // Add index.html to ZIP root
  zip.file('index.html', finalHtml);

  // Add LICENSE file
  zip.file('LICENSE', `Apache License 2.0\n\nGenerated via Universal HTML Galley Generator.`);

  // Add styles folder with custom galley CSS
  zip.folder('styles')?.file('galley-base.css', `/* Base Galley Styles */\nbody { font-family: 'Merriweather', serif; }`);

  const content = await zip.generateAsync({ type: 'blob' });
  const outputFileName = `${sanitizedTitle || 'article-galley'}-package.zip`;

  saveAs(content, outputFileName);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
