import * as pdfjsLib from 'pdfjs-dist';
import { FootnoteItem, ParsedPaper, PaperSection, ParsedFigure } from '../../../shared/types/galleyTypes';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { extractFiguresFromPdf, extractFigureCaptionLineKeys } from './figureExtractor';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface TextLine {
  y: number;
  minX: number;
  text: string;
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
  return html
    .replace(/<\/b>(\s*)<b>/g, '$1')
    .replace(/<\/i>(\s*)<i>/g, '$1')
    .replace(/<\/u>(\s*)<u>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

interface FontStyleInfo {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

function getFontStyles(item: any, styles: Record<string, any>): FontStyleInfo {
  if (!item || typeof item !== 'object') {
    return { isBold: false, isItalic: false, isUnderline: false };
  }

  const fontName = (item.fontName || '').toLowerCase();
  const styleObj = styles && item.fontName ? styles[item.fontName] : null;
  const fontFamily = (styleObj?.fontFamily || '').toLowerCase();

  const combined = `${fontName} ${fontFamily}`;

  const isBold =
    /\b(bold|bd|heavy|black|semibold|demibold)\b/i.test(combined) ||
    /(-bold|-bd|-b)\b/i.test(combined) ||
    /\b(cmbx|cmb|ptm-b|ptm-bi)\d*/i.test(combined);

  const isItalic =
    /\b(italic|oblique|slanted|it)\b/i.test(combined) ||
    /(-italic|-it|-oblique|-slanted)\b/i.test(combined) ||
    /\b(cmti|ptm-ri|ptm-bi)\d*/i.test(combined);

  const isUnderline = /\b(underline|underlined)\b/i.test(combined) || /underline/i.test(combined);

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

export async function parsePdfGalleyFile(file: File): Promise<ParsedPaper> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageLines: { pageNum: number; lines: TextLine[] }[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      let currentGroup: TextLine | null = null;
      const lines: TextLine[] = [];

      for (const item of textContent.items) {
        if ('str' in item) {
          const y = item.transform ? item.transform[5] : 0;
          const x = item.transform ? item.transform[4] : 0;
          const { isBold, isItalic, isUnderline } = getFontStyles(item, textContent.styles);
          const chunk = formatTextChunk(item.str, isBold, isItalic, isUnderline);

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

  // 1. Page 1 Header, Title, Author & Abstract Extraction
  const page1Lines = pageLines[0]?.lines || [];
  const titleLines: string[] = [];
  let foundAbstract = false;

  for (const l of page1Lines) {
    const txt = l.text.trim();
    const plainTxt = stripTags(l.text).trim();
    if (!plainTxt || l.y < 55) continue; // Skip running footer

    if (plainTxt.toLowerCase().startsWith('abstract')) {
      foundAbstract = true;
      abstract = txt.replace(/^(\s*<[^>]+>)*abstract[\s\:]*/i, '');
      continue;
    }

    if (foundAbstract) {
      if (plainTxt.toLowerCase().startsWith('keywords') || l.y < 220) {
        break;
      }
      abstract += ' ' + txt;
    } else if (l.y > 550) {
      if (titleLines.length < 2) {
        titleLines.push(txt);
      } else if (authors.length === 0) {
        authors.push(cleanUpHtmlTags(txt));
      }
    }
  }

  title = cleanUpHtmlTags(titleLines.join(' '));
  abstract = cleanUpHtmlTags(abstract);

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
          const fnText = cleanUpHtmlTags(txt.replace(/^(\s*<[^>]+>)*\d{1,3}\s+/, ''));
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
          currentFn.text = cleanUpHtmlTags(currentFn.text + ' ' + txt);
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
      if (plainTxt && l.y >= 55 && l.y <= 740 && !footnoteLineKeys.has(`${p.pageNum}_${l.y}`) && !figureCaptionLineKeys.has(`${p.pageNum}_${l.y}`)) {
        if (l.minX > 30 && l.minX < 200) {
          allMinXs.push(l.minX);
        }
      }
    });
  });

  const standardMargin = allMinXs.length > 0 ? Math.min(...allMinXs) : 72;

  // 3. Body Text & Headings Extraction (55 <= Y <= 740, excluding consumed footnote & caption lines)
  let currentSection: PaperSection = { heading: undefined, paragraphs: [] };
  let currentParagraph = '';
  let currentIsBlockQuote = false;

  const pushCurrentParagraph = () => {
    if (stripTags(currentParagraph).trim()) {
      currentSection.paragraphs.push({
        text: cleanUpHtmlTags(currentParagraph),
        isBlockQuote: currentIsBlockQuote,
      });
      currentParagraph = '';
      currentIsBlockQuote = false;
    }
  };

  pageLines.forEach((p, pIdx) => {
    p.lines.forEach(l => {
      const txt = l.text.trim();
      const plainTxt = stripTags(l.text).trim();
      if (!plainTxt || l.y < 55 || l.y > 740 || footnoteLineKeys.has(`${p.pageNum}_${l.y}`) || figureCaptionLineKeys.has(`${p.pageNum}_${l.y}`)) return;

      // Skip Page 1 title/author/abstract lines
      if (pIdx === 0 && (l.y > 550 || plainTxt.toLowerCase().startsWith('abstract') || foundAbstract)) {
        if (plainTxt.toLowerCase().startsWith('abstract')) return;
        if (l.y > 400 && abstract.includes(plainTxt)) return;
      }

      // Heading Detection (Numbered, Roman, or short title-cased lines)
      const isHeading = plainTxt.match(/^(\d+\.|\b[I|V|X]+\.|\bIntroduction\b|\bBackground\b|\bMethods\b|\bResults\b|\bDiscussion\b|\bConclusion\b|\bReferences\b|\bWorks Cited\b|\bAcknowledgements\b)/i) ||
                        (plainTxt.length < 55 && plainTxt === plainTxt.toUpperCase() && plainTxt.length > 3);

      if (isHeading) {
        pushCurrentParagraph();
        if (currentSection.paragraphs.length > 0 || currentSection.heading) {
          sections.push(currentSection);
        }
        currentSection = { heading: cleanUpHtmlTags(txt), paragraphs: [] };
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
        formatted = formatted.replace(regex, `$1 <sup id="${fn.refAnchorId}" class="footnote-ref" role="doc-noteref"><a href="#${fn.footnoteAnchorId}">${fn.label}</a></sup> `);
      });
      return { text: formatted, isBlockQuote: p.isBlockQuote };
    }),
  }));
}

function fallbackPlainExtract(fileName: string, fileSize: number, rawText: string): ParsedPaper {
  return {
    fileName,
    fileSizeBytes: fileSize,
    pageCount: 1,
    title: fileName.replace(/\.pdf$/i, ''),
    authors: ['Academic Author(s)'],
    abstract: '',
    sections: [{ heading: 'Paper Body', paragraphs: [{ text: rawText, isBlockQuote: false }] }],
    footnotes: [],
    figures: [],
    rawText,
  };
}
