import * as pdfjsLib from 'pdfjs-dist';
import { ParsedFigure } from '../../../shared/types/galleyTypes';
import { stripTags, cleanUpHtmlTags } from './pdfParser';
import { isSectionHeading } from './headingDetector';

interface TextLine {
  y: number;
  text: string;
}

export async function extractFiguresFromPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageLinesMap: { pageNum: number; lines: TextLine[] }[]
): Promise<ParsedFigure[]> {
  const extractedFigures: ParsedFigure[] = [];
  let figureCounter = 1;
  const { captionsByPage } = extractFigureCaptionLineKeys(pageLinesMap);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();
    const pageLines = pageLinesMap.find(p => p.pageNum === pageNum)?.lines || [];
    const pageImageUrls: string[] = [];

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject ||
        fn === pdfjsLib.OPS.paintImageMaskXObject
      ) {
        const imgName = ops.argsArray[i][0];
        const dataUrl = await resolveImageDataUrl(page, imgName, pageNum, pageLines);
        if (dataUrl) {
          pageImageUrls.push(dataUrl);
        }
      }
    }

    if (pageImageUrls.length === 0) continue;

    // Check if page contains multiple explicit figure captions for each image
    const explicitCaptions = findExplicitCaptionsOnPage(pageLines);

    if (pageImageUrls.length > 1 && explicitCaptions.length <= 1) {
      // Group multiple side-by-side images on the same page under one figure
      const captionText = findCaptionForPage(pageNum, figureCounter, pageLines, captionsByPage);
      const figId = `fig-${figureCounter}`;

      extractedFigures.push({
        id: figId,
        caption: captionText,
        dataUrl: pageImageUrls[0],
        dataUrls: pageImageUrls,
        altText: captionText,
        pageNum,
        fileName: `figure-${figureCounter}.png`,
      });

      figureCounter++;
    } else {
      // Create separate figures for each image or matching caption
      for (let idx = 0; idx < pageImageUrls.length; idx++) {
        const url = pageImageUrls[idx];
        const captionText = findCaptionForPage(pageNum, figureCounter, pageLines, captionsByPage);
        const figId = `fig-${figureCounter}`;

        extractedFigures.push({
          id: figId,
          caption: captionText,
          dataUrl: url,
          dataUrls: [url],
          altText: captionText,
          pageNum,
          fileName: `figure-${figureCounter}.png`,
        });

        figureCounter++;
      }
    }
  }

  return extractedFigures;
}

async function resolveImageDataUrl(
  page: pdfjsLib.PDFPageProxy,
  imgName: string,
  pageNum: number,
  pageLines: TextLine[]
): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 3000);

    try {
      page.objs.get(imgName, (img: any) => {
        clearTimeout(timeout);
        if (!img || !img.width || !img.height) {
          resolve(null);
          return;
        }

        // Filter out small icons (< 50px width and height)
        if (img.width < 50 && img.height < 50) {
          resolve(null);
          return;
        }

        // Filter out header images / wide journal banners
        if (isHeaderBanner(img, pageNum, pageLines)) {
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(null);
          return;
        }

        if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        if (img.bitmap) {
          ctx.drawImage(img.bitmap, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        if (img.data) {
          const imageData = convertPdfImageData(ctx, img);
          if (imageData) {
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(null);
      });
    } catch (e) {
      clearTimeout(timeout);
      console.warn(`Error resolving image ${imgName}:`, e);
      resolve(null);
    }
  });
}

function convertPdfImageData(ctx: CanvasRenderingContext2D, img: any): ImageData | null {
  const { width, height, kind, data } = img;
  if (!width || !height || !data) return null;

  const imageData = ctx.createImageData(width, height);
  const dest = imageData.data;
  const pixelCount = width * height;

  // kind 3: RGBA_32BPP
  if (kind === 3 || data.length === pixelCount * 4) {
    dest.set(data);
    return imageData;
  }

  // kind 2: RGB_24BPP
  if (kind === 2 || data.length === pixelCount * 3) {
    for (let s = 0, d = 0; s < data.length && d < dest.length; s += 3, d += 4) {
      dest[d] = data[s];         // R
      dest[d + 1] = data[s + 1]; // G
      dest[d + 2] = data[s + 2]; // B
      dest[d + 3] = 255;          // Alpha
    }
    return imageData;
  }

  // kind 1: GRAYSCALE_1BPP or 8BPP
  if (kind === 1 || data.length === pixelCount) {
    for (let s = 0, d = 0; s < data.length && d < dest.length; s++, d += 4) {
      const val = data[s];
      dest[d] = val;
      dest[d + 1] = val;
      dest[d + 2] = val;
      dest[d + 3] = 255;
    }
    return imageData;
  }

  // Fallback if RGBA
  if (data.length >= pixelCount * 4) {
    dest.set(data.subarray(0, pixelCount * 4));
    return imageData;
  }

  return null;
}

export function extractFigureCaptionLineKeys(pageLinesMap: { pageNum: number; lines: { y: number; text: string }[] }[]): {
  figureCaptionLineKeys: Set<string>;
  captionsByPage: Map<number, Map<number, string>>;
} {
  const figureCaptionLineKeys = new Set<string>();
  const captionsByPage = new Map<number, Map<number, string>>();

  pageLinesMap.forEach(p => {
    let currentFigNum: number | null = null;
    let currentCaption = '';
    const pageCapMap = new Map<number, string>();

    p.lines.forEach((l) => {
      const txt = l.text.trim();
      const plainTxt = stripTags(l.text).trim();
      if (!plainTxt || l.y < 55 || l.y > 740) return;

      const figMatch = plainTxt.match(/^fig(ure)?\.?\s*(\d+)/i);
      if (figMatch) {
        if (currentFigNum !== null && currentCaption) {
          pageCapMap.set(currentFigNum, cleanUpHtmlTags(currentCaption));
        }
        currentFigNum = parseInt(figMatch[2], 10);
        currentCaption = txt;
        figureCaptionLineKeys.add(`${p.pageNum}_${l.y}`);
      } else if (currentFigNum !== null) {
        const plainCap = stripTags(currentCaption).trim();
        const openParenCount = (plainCap.match(/\(/g) || []).length;
        const closeParenCount = (plainCap.match(/\)/g) || []).length;
        const hasUnclosedParen = openParenCount > closeParenCount;

        const isHeading = isSectionHeading(plainTxt);

        const isContinuation =
          !isHeading &&
          (hasUnclosedParen ||
            /^\s*\(Source:|\bphoto by\b|\btaken\b/i.test(plainTxt) ||
            currentCaption.endsWith('-') ||
            !plainCap.endsWith('.') ||
            plainTxt.startsWith('(') ||
            plainTxt.startsWith('by ') ||
            /^(19|20)\d{2}/.test(plainTxt));

        if (isContinuation) {
          currentCaption += ' ' + txt;
          figureCaptionLineKeys.add(`${p.pageNum}_${l.y}`);

          const updatedPlainCap = stripTags(currentCaption).trim();
          const updatedOpen = (updatedPlainCap.match(/\(/g) || []).length;
          const updatedClose = (updatedPlainCap.match(/\)/g) || []).length;

          if (
            updatedOpen <= updatedClose &&
            (plainTxt.includes(')') || (plainTxt.endsWith('.') && !plainTxt.match(/\b(e\.g|i\.e|vol|no|pp)\.$/i)))
          ) {
            pageCapMap.set(currentFigNum, cleanUpHtmlTags(currentCaption));
            currentFigNum = null;
            currentCaption = '';
          }
        } else {
          pageCapMap.set(currentFigNum, cleanUpHtmlTags(currentCaption));
          currentFigNum = null;
          currentCaption = '';
        }
      }
    });

    if (currentFigNum !== null && currentCaption) {
      pageCapMap.set(currentFigNum, cleanUpHtmlTags(currentCaption));
    }
    if (pageCapMap.size > 0) {
      captionsByPage.set(p.pageNum, pageCapMap);
    }
  });

  return { figureCaptionLineKeys, captionsByPage };
}

function findCaptionForPage(
  pageNum: number,
  figIndex: number,
  pageLines: TextLine[],
  captionsByPage?: Map<number, Map<number, string>>
): string {
  if (captionsByPage?.has(pageNum)) {
    const pageCapMap = captionsByPage.get(pageNum)!;
    if (pageCapMap.has(figIndex)) {
      return pageCapMap.get(figIndex)!;
    }
  }

  // Look for text lines matching "Figure X" or "Fig. X"
  const figRegex = new RegExp(`^(fig(ure)?\\.?\\s*${figIndex}[:\\.\\s].*)`, 'i');

  for (const l of pageLines) {
    const plainTxt = stripTags(l.text).trim();
    if (figRegex.test(plainTxt)) {
      return cleanUpHtmlTags(l.text);
    }
  }

  // Generic fallback if no specific figure label was matched on the page
  return `Figure ${figIndex} (Extracted from Page ${pageNum})`;
}

function isHeaderBanner(img: any, pageNum: number, pageLines: TextLine[]): boolean {
  const { width, height } = img;
  const aspectRatio = width / height;

  // Filter out wide header/footer banners (e.g. 1050x210 banner with aspect 5.0)
  if (aspectRatio > 3.0 || aspectRatio < 0.25) {
    return true;
  }

  // Header or logo image on page 1 without an explicit Figure 1 caption
  if (pageNum === 1) {
    const hasFig1Caption = pageLines.some(l => /fig(ure)?\.?\s*1\b/i.test(l.text));
    if (!hasFig1Caption && (aspectRatio > 2.2 || height < 300)) {
      return true;
    }
  }

  return false;
}

function findExplicitCaptionsOnPage(pageLines: TextLine[]): string[] {
  const captions: string[] = [];
  const figRegex = /^(fig(ure)?\.?\s*\d+[:\.\s].*)/i;

  for (const l of pageLines) {
    const txt = l.text.trim();
    if (figRegex.test(txt)) {
      captions.push(txt);
    }
  }

  return captions;
}
