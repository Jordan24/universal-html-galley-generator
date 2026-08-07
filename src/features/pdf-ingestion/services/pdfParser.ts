import * as pdfjsLib from 'pdfjs-dist';
import { FootnoteItem, ParsedPaper, PaperSection, ParsedFigure } from '../../../shared/types/galleyTypes';
import { linkifyHtml, consolidateAdjacentAnchors } from '../../../shared/utils/linkifier';
import { renderSuperscriptRefHtml } from '../../galley-builder/services/footnoteAnchors';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { extractFiguresFromPdf, extractFigureCaptionLineKeys } from './figureExtractor';
import { isSectionHeading } from './headingDetector';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface TextLine {
  y: number;
  minX: number;
  text: string;
}

export function normalizePdfText(text: string): string {
  if (!text) return '';
  return text
    // Normalize Unicode ligatures
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/\uFB05/g, 'ft')
    .replace(/\uFB06/g, 'st')
    // Fix PDF font encoding corruptions where 'ti' ligature was extracted as ';' between letters
    .replace(/([A-Z])(?:<\/?[^>]+>)*;(?:<\/?[^>]+>)*(?=[A-Z])/g, '$1TI')
    .replace(/([a-zA-Z])(?:<\/?[^>]+>)*;(?:<\/?[^>]+>)*(?=[a-zA-Z])/g, '$1ti');
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function cleanUpHtmlTags(html: string): string {
  const cleaned = normalizePdfText(html)
    .replace(/<\/b>(\s*)<b>/g, '$1')
    .replace(/<\/i>(\s*)<i>/g, '$1')
    .replace(/<\/u>(\s*)<u>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return consolidateAdjacentAnchors(cleaned);
}

interface FontStyleInfo {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

function getFontStyles(item: any, styles: Record<string, any>, page: pdfjsLib.PDFPageProxy): FontStyleInfo {
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;

  const fontName = item.fontName || '';
  let fontObjName = '';
  let fontObjLoadedName = '';

  // 1. Try to read properties from PDF.js page.commonObjs
  try {
    if (page.commonObjs && page.commonObjs.has(fontName)) {
      const fontObj = page.commonObjs.get(fontName);
      if (fontObj) {
        if (typeof fontObj.bold === 'boolean') {
          isBold = fontObj.bold;
        }
        if (typeof fontObj.italic === 'boolean') {
          isItalic = fontObj.italic;
        }
        fontObjName = fontObj.name || '';
        fontObjLoadedName = fontObj.loadedName || '';
      }
    }
  } catch (err) {
    // Ignore commonObjs reading errors
  }

  // 2. Heuristics fallback using fontName, styles dictionary, and resolved font names
  const styleObj = styles && fontName ? styles[fontName] : null;
  const fontFamily = (styleObj?.fontFamily || '').toLowerCase();
  const fontNameLower = fontName.toLowerCase();
  const combined = `${fontNameLower} ${fontFamily} ${fontObjName.toLowerCase()} ${fontObjLoadedName.toLowerCase()}`;

  if (!isBold) {
    isBold =
      /\b(bold|bd|heavy|black|semibold|demibold)\b/i.test(combined) ||
      /(-bold|-bd|-b)\b/i.test(combined) ||
      /\b(cmbx|cmb|ptm-b|ptm-bi)\d*/i.test(combined) ||
      /bold|black/i.test(combined);
  }

  if (!isItalic) {
    isItalic =
      /\b(italic|oblique|slanted|it)\b/i.test(combined) ||
      /(-italic|-it|-oblique|-slanted)\b/i.test(combined) ||
      /\b(cmti|ptm-ri|ptm-bi)\d*/i.test(combined) ||
      /italic|oblique/i.test(combined) ||
      /[a-zA-Z]I\b/.test(combined); // E.g. AdvGaramondI
  }

  isUnderline = /\b(underline|underlined)\b/i.test(combined) || /underline/i.test(combined);

  return { isBold, isItalic, isUnderline };
}

function formatTextChunk(rawStr: string, isBold: boolean, isItalic: boolean, isUnderline: boolean): string {
  if (!rawStr) return '';
  if (!isBold && !isItalic && !isUnderline) return escapeHtml(rawStr);
  if (!rawStr.trim()) return rawStr;

  const match = rawStr.match(/^(\s*)(.*?)(\s*)$/s);
  if (!match) return escapeHtml(rawStr);

  const [, leading, body, trailing] = match;
  if (!body) return rawStr;

  let formatted = escapeHtml(body);
  if (isBold) {
    formatted = `<b>${formatted}</b>`;
  }
  if (isItalic) {
    formatted = `<i>${formatted}</i>`;
  }
  if (isUnderline) {
    formatted = `<u>${formatted}</u>`;
  }

  return leading + formatted + trailing;
}

function formatLinkChunk(chunkHtml: string, url: string): string {
  const match = chunkHtml.match(/^(\s*)(.*?)(\s*)$/s);
  if (!match) return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${chunkHtml}</a>`;
  const [, leading, body, trailing] = match;
  if (!body) return chunkHtml;
  return `${leading}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${body}</a>${trailing}`;
}

export async function parsePdfGalleyFile(file: File): Promise<ParsedPaper> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageLines: { pageNum: number; lines: TextLine[] }[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      try {
        await page.getOperatorList();
      } catch (err) {
        // Ignore operator list loading errors
      }

      const textContent = await page.getTextContent();

      let linkAnnots: { url: string; rect: number[] }[] = [];
      try {
        const annotations = await page.getAnnotations();
        linkAnnots = annotations
          .filter((annot: any) => (annot.annotationType === 1 || annot.subtype === 'Link') && (annot.url || annot.unsafeUrl) && annot.rect)
          .map((annot: any) => ({
            url: (annot.url || annot.unsafeUrl) as string,
            rect: annot.rect as number[],
          }));
      } catch (err) {
        // Ignore annotation errors if unreadable
      }

      let currentGroup: TextLine | null = null;
      const lines: TextLine[] = [];

      for (const item of textContent.items) {
        if ('str' in item) {
          const y = item.transform ? item.transform[5] : 0;
          const x = item.transform ? item.transform[4] : 0;
          const { isBold, isItalic, isUnderline } = getFontStyles(item, textContent.styles, page);
          const normalizedStr = normalizePdfText(item.str);
          let chunk = formatTextChunk(normalizedStr, isBold, isItalic, isUnderline);

          if (linkAnnots.length > 0 && chunk.trim()) {
            const itemWidth = (item as any).width || 0;
            const itemLeft = x;
            const itemRight = x + itemWidth;
            const itemMidX = itemWidth > 0 ? itemLeft + itemWidth / 2 : x;

            const matched = linkAnnots.find(a => {
              const aMinX = a.rect[0];
              const aMinY = a.rect[1];
              const aMaxX = a.rect[2];
              const aMaxY = a.rect[3];

              // Vertical match: baseline Y must fall within PDF annotation box (with tight 3pt margin)
              const isYMatch = y >= aMinY - 3 && y <= aMaxY + 3;
              if (!isYMatch) return false;

              // Horizontal match: check if item midpoint or majority of item width falls within annotation X box
              if (itemWidth > 0) {
                const overlap = Math.max(0, Math.min(itemRight, aMaxX) - Math.max(itemLeft, aMinX));
                const overlapRatio = overlap / itemWidth;
                return overlapRatio >= 0.4 || (itemMidX >= aMinX - 1 && itemMidX <= aMaxX + 1);
              }
              return x >= aMinX - 1 && x <= aMaxX + 1;
            });

            if (matched) {
              chunk = formatLinkChunk(chunk, matched.url);
            }
          }

          if (!currentGroup || Math.abs(y - currentGroup.y) > 4) {
            currentGroup = { y, minX: x, text: '' };
            lines.push(currentGroup);
          } else {
            if (x < currentGroup.minX) {
              currentGroup.minX = x;
            }
          }
          currentGroup.text += chunk;
        }
      }
      // Sort lines from top to bottom (descending Y in PDF coordinates)
      lines.sort((a, b) => b.y - a.y);
      pageLines.push({ pageNum, lines });
    }

    const figures = await extractFiguresFromPdf(pdf, pageLines);

    return extractStructureFromPageLines(file.name, file.size, pdf.numPages, pageLines, figures);
  } catch (error) {
    console.warn('PDF.js binary extraction notice, utilizing text fallback heuristic:', error);
    const textFallback = await file.text();
    return fallbackPlainExtract(file.name, file.size, textFallback);
  }
}

function extractStructureFromPageLines(
  fileName: string,
  fileSize: number,
  pageCount: number,
  pageLines: { pageNum: number; lines: TextLine[] }[],
  figures: ParsedFigure[] = []
): ParsedPaper {
  let title = '';
  let authors: string[] = [];
  let abstract = '';
  const sections: PaperSection[] = [];
  const fnMap = new Map<number, FootnoteItem>();
  const footnoteLineKeys = new Set<string>();

  const { figureCaptionLineKeys } = extractFigureCaptionLineKeys(pageLines);

  // 1. Page 1 Header, Title, Author, Abstract & Keywords Extraction
  const headerLineKeys = new Set<string>();
  const page1Lines = pageLines[0]?.lines || [];
  const headerLinesBeforeAbstract: { rawText: string }[] = [];
  let abstractRaw = '';
  let keywordsRaw = '';
  let mode: 'HEADER' | 'ABSTRACT' | 'KEYWORDS' | 'BODY' = 'HEADER';
  let lastKwY = 0;

  const hasAbstractHeading = page1Lines.some(l => stripTags(l.text).trim().toLowerCase().startsWith('abstract'));

  for (const l of page1Lines) {
    const txt = l.text.trim();
    const plainTxt = stripTags(l.text).trim();
    if (!plainTxt || l.y < 55) continue; // Skip running footer

    const lineKey = `1_${l.y}`;

    // Detect Abstract heading start
    if (plainTxt.toLowerCase().startsWith('abstract')) {
      mode = 'ABSTRACT';
      headerLineKeys.add(lineKey);
      const absContent = txt.replace(/^(\s*<[^>]+>)*abstract[\s\:]*/i, '');
      if (absContent.trim()) {
        abstractRaw += absContent;
      }
      continue;
    }

    if (mode === 'HEADER') {
      // Check for top journal header info (volume, DOI, journal URLs)
      if (l.y > 720 || plainTxt.includes('doi.org') || plainTxt.toLowerCase().includes('journal') || /^https?:\/\//i.test(plainTxt)) {
        headerLineKeys.add(lineKey);
        continue;
      }
      if (hasAbstractHeading || l.y > 550) {
        headerLineKeys.add(lineKey);
        headerLinesBeforeAbstract.push({ rawText: txt });
      }
    } else if (mode === 'ABSTRACT') {
      if (plainTxt.toLowerCase().startsWith('keywords') || plainTxt.toLowerCase().startsWith('key words')) {
        mode = 'KEYWORDS';
        lastKwY = l.y;
        headerLineKeys.add(lineKey);
        const kwContent = txt.replace(/^(\s*<[^>]+>)*key\s*words[\s\:]*/i, '');
        if (kwContent.trim()) {
          keywordsRaw += kwContent;
        }
        continue;
      }
      // Stop abstract mode if encountering a clear section heading
      if (isSectionHeading(plainTxt)) {
        mode = 'BODY';
        break;
      }
      headerLineKeys.add(lineKey);
      abstractRaw += (abstractRaw ? ' ' : '') + txt;
    } else if (mode === 'KEYWORDS') {
      if ((lastKwY > 0 && lastKwY - l.y > 40) || isSectionHeading(plainTxt)) {
        mode = 'BODY';
        break;
      }
      headerLineKeys.add(lineKey);
      lastKwY = l.y;
      keywordsRaw += (keywordsRaw ? ' ' : '') + txt;
    }
  }

  // Parse Title and Authors from headerLinesBeforeAbstract
  const titleLines: string[] = [];
  const authorLines: string[] = [];
  if (headerLinesBeforeAbstract.length === 1) {
    titleLines.push(headerLinesBeforeAbstract[0].rawText);
  } else if (headerLinesBeforeAbstract.length > 1) {
    authorLines.push(headerLinesBeforeAbstract[headerLinesBeforeAbstract.length - 1].rawText);
    headerLinesBeforeAbstract.slice(0, -1).forEach(item => titleLines.push(item.rawText));
  }

  title = cleanUpHtmlTags(titleLines.join(' '));
  authors = authorLines.map(a => linkifyHtml(cleanUpHtmlTags(a)));

  let abstractClean = linkifyHtml(cleanUpHtmlTags(abstractRaw));
  if (keywordsRaw.trim()) {
    const keywordsClean = linkifyHtml(cleanUpHtmlTags(keywordsRaw));
    abstractClean += (abstractClean ? '<br><br>' : '') + `<strong>Keywords:</strong> ${keywordsClean}`;
  }
  abstract = abstractClean;

  // 2. Dynamic Footnote Extraction across all pages (Y < 220)
  pageLines.forEach(p => {
    let currentFn: FootnoteItem | null = null;
    p.lines.forEach(l => {
      const txt = l.text.trim();
      const plainTxt = stripTags(l.text).trim();
      if (!plainTxt || l.y < 55 || l.y > 720 || figureCaptionLineKeys.has(`${p.pageNum}_${l.y}`)) return; // Skip running headers/footers & caption lines

      if (l.y < 220) {
        const fnMatch = plainTxt.match(/^(\d{1,3})\s+([A-Z"“'‘\(\[\{].+)/);
        if (fnMatch) {
          const fnId = parseInt(fnMatch[1], 10);
          const fnText = linkifyHtml(cleanUpHtmlTags(txt.replace(/^(\s*<[^>]+>)*\d{1,3}\s+/, '')));
          currentFn = {
            id: fnId,
            label: `${fnId}`,
            text: fnText,
            refAnchorId: `fnref-${fnId}`,
            footnoteAnchorId: `fn-${fnId}`,
          };
          fnMap.set(fnId, currentFn);
          footnoteLineKeys.add(`${p.pageNum}_${l.y}`);
        } else if (currentFn) {
          currentFn.text = linkifyHtml(cleanUpHtmlTags(currentFn.text + ' ' + txt));
          footnoteLineKeys.add(`${p.pageNum}_${l.y}`);
        }
      }
    });
  });

  const sortedFootnotes = Array.from(fnMap.values()).sort((a, b) => a.id - b.id);

  // 2b. Calculate standard document body left-margin offset
  const allMinXs: number[] = [];
  pageLines.forEach(p => {
    p.lines.forEach(l => {
      const plainTxt = stripTags(l.text).trim();
      if (plainTxt && l.y >= 55 && l.y <= 740 && !headerLineKeys.has(`${p.pageNum}_${l.y}`) && !footnoteLineKeys.has(`${p.pageNum}_${l.y}`) && !figureCaptionLineKeys.has(`${p.pageNum}_${l.y}`)) {
        if (l.minX > 30 && l.minX < 200) {
          allMinXs.push(l.minX);
        }
      }
    });
  });

  const standardMargin = allMinXs.length > 0 ? Math.min(...allMinXs) : 72;

  // 3. Body Text & Headings Extraction (55 <= Y <= 740, excluding consumed header, footnote & caption lines)
  let currentSection: PaperSection = { heading: undefined, paragraphs: [] };
  let currentParagraph = '';
  let currentIsBlockQuote = false;

  const pushCurrentParagraph = () => {
    if (stripTags(currentParagraph).trim()) {
      currentSection.paragraphs.push({
        text: linkifyHtml(cleanUpHtmlTags(currentParagraph)),
        isBlockQuote: currentIsBlockQuote,
      });
      currentParagraph = '';
      currentIsBlockQuote = false;
    }
  };

  pageLines.forEach((p) => {
    p.lines.forEach(l => {
      const txt = l.text.trim();
      const plainTxt = stripTags(l.text).trim();
      const lineKey = `${p.pageNum}_${l.y}`;
      if (!plainTxt || l.y < 55 || l.y > 740 || headerLineKeys.has(lineKey) || footnoteLineKeys.has(lineKey) || figureCaptionLineKeys.has(lineKey)) return;

      // Heading Detection (Numbered, Roman, or short title-cased lines)
      const isHeading = isSectionHeading(plainTxt);

      if (isHeading) {
        pushCurrentParagraph();
        if (currentSection.paragraphs.length > 0 || currentSection.heading) {
          sections.push(currentSection);
        }
        currentSection = { heading: linkifyHtml(cleanUpHtmlTags(txt)), paragraphs: [] };
      } else {
        const isIndented = l.minX >= standardMargin + 18;

        if (currentParagraph && currentIsBlockQuote !== isIndented) {
          pushCurrentParagraph();
        }

        currentIsBlockQuote = isIndented;

        if (currentParagraph && !currentParagraph.endsWith('-')) {
          currentParagraph += ' ' + txt;
        } else if (currentParagraph.endsWith('-')) {
          currentParagraph = currentParagraph.slice(0, -1) + txt;
        } else {
          currentParagraph = txt;
        }

        // Paragraph break heuristic on sentence end
        if (!isIndented && plainTxt.length < 50 && (plainTxt.endsWith('.') || plainTxt.endsWith(':') || plainTxt.endsWith(')'))) {
          pushCurrentParagraph();
        }
      }
    });
  });

  pushCurrentParagraph();
  if (currentSection.paragraphs.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  // 4. Inject Footnote Superscript Anchors into Body Paragraphs
  const finalSections = injectBodyFootnoteSuperscripts(sections, sortedFootnotes);

  return {
    fileName,
    fileSizeBytes: fileSize,
    pageCount,
    title: title || fileName.replace(/\.pdf$/i, ''),
    authors: authors.length > 0 ? authors : ['Academic Author(s)'],
    abstract,
    sections: finalSections.length > 0 ? finalSections : [{ heading: 'Article Body', paragraphs: [{ text: fileName, isBlockQuote: false }] }],
    footnotes: sortedFootnotes,
    figures,
    rawText: pageLines.map(p => p.lines.map(l => l.text).join('\n')).join('\n\n'),
  };
}

function injectBodyFootnoteSuperscripts(sections: PaperSection[], footnotes: FootnoteItem[]): PaperSection[] {
  if (footnotes.length === 0) return sections;

  return sections.map(sec => ({
    heading: sec.heading,
    paragraphs: sec.paragraphs.map(p => {
      let formatted = p.text;
      footnotes.forEach(fn => {
        const regex = new RegExp(`(\\b|\\.)\\s*\\[?${fn.id}\\]?\\s+(?=[A-Z"“'‘\\(\\s]|$)`, 'g');
        formatted = formatted.replace(regex, `$1 ${renderSuperscriptRefHtml(fn)} `);
      });
      return { text: formatted, isBlockQuote: p.isBlockQuote };
    }),
  }));
}

function fallbackPlainExtract(fileName: string, fileSize: number, rawText: string): ParsedPaper {
  const normalizedText = normalizePdfText(rawText);
  return {
    fileName,
    fileSizeBytes: fileSize,
    pageCount: 1,
    title: fileName.replace(/\.pdf$/i, ''),
    authors: ['Academic Author(s)'],
    abstract: '',
    sections: [{ heading: 'Paper Body', paragraphs: [{ text: linkifyHtml(escapeHtml(normalizedText)), isBlockQuote: false }] }],
    footnotes: [],
    figures: [],
    rawText: normalizedText,
  };
}
