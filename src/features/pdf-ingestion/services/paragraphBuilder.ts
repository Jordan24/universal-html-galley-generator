import { PaperSection } from '../../../shared/types/galleyTypes';
import { linkifyHtml } from '../../../shared/utils/linkifier';
import { isSectionHeading } from './headingDetector';
import { cleanUpHtmlTags, stripTags } from './pdfParser';

export interface TextLine {
  y: number;
  minX: number;
  text: string;
}

export interface PageLines {
  pageNum: number;
  lines: TextLine[];
}

export interface DocumentLine extends TextLine {
  pageNum: number;
  plainTxt: string;
  isHeading: boolean;
  isIndented: boolean;
  lineKey: string;
}

export function extractBodySections(
  pageLines: PageLines[],
  headerLineKeys: Set<string>,
  footnoteLineKeys: Set<string>,
  figureCaptionLineKeys: Set<string>
): PaperSection[] {
  // 1. Gather all candidate body lines and compute document standard margin
  const candidateLines: { pageNum: number; line: TextLine; plainTxt: string }[] = [];
  const allMinXs: number[] = [];

  pageLines.forEach((p) => {
    p.lines.forEach((l) => {
      const plainTxt = stripTags(l.text).trim();
      const lineKey = `${p.pageNum}_${l.y}`;
      if (
        !plainTxt ||
        l.y < 55 ||
        l.y > 740 ||
        headerLineKeys.has(lineKey) ||
        footnoteLineKeys.has(lineKey) ||
        figureCaptionLineKeys.has(lineKey)
      ) {
        return;
      }
      candidateLines.push({ pageNum: p.pageNum, line: l, plainTxt });
      if (l.minX > 30 && l.minX < 200) {
        allMinXs.push(l.minX);
      }
    });
  });

  const standardMargin = allMinXs.length > 0 ? Math.min(...allMinXs) : 72;

  // 2. Build DocumentLine list with indentation flags
  const docLines: DocumentLine[] = candidateLines.map(({ pageNum, line, plainTxt }) => ({
    ...line,
    pageNum,
    plainTxt,
    isHeading: isSectionHeading(plainTxt),
    isIndented: line.minX >= standardMargin + 14,
    lineKey: `${pageNum}_${line.y}`,
  }));

  if (docLines.length === 0) {
    return [];
  }

  // 3. Compute typical line spacing (delta Y) across adjacent lines on same page
  const deltaYs: number[] = [];
  for (let i = 0; i < docLines.length - 1; i++) {
    const cur = docLines[i];
    const nxt = docLines[i + 1];
    if (cur.pageNum === nxt.pageNum && cur.y > nxt.y) {
      const dy = cur.y - nxt.y;
      if (dy > 0 && dy < 35) {
        deltaYs.push(dy);
      }
    }
  }

  deltaYs.sort((a, b) => a - b);
  const typicalLineSpacing =
    deltaYs.length > 0 ? deltaYs[Math.floor(deltaYs.length / 2)] : 13.0;
  const spaceThreshold = Math.max(16, typicalLineSpacing * 1.45);

  // 4. Helper to determine if a line has extra space below before the next line
  const hasSpaceBelow = (i: number): boolean => {
    if (i >= docLines.length - 1) return true;
    const cur = docLines[i];
    const nxt = docLines[i + 1];

    if (cur.pageNum === nxt.pageNum) {
      return (cur.y - nxt.y) >= spaceThreshold;
    } else {
      // Across page boundary:
      // If cur is near page bottom (< 120) and nxt is not indented (or cur ends with hyphen), treat as continuation
      if (cur.y < 120 && (!nxt.isIndented || cur.text.trim().endsWith('-'))) {
        return false;
      }
      return true;
    }
  };

  // 5. Group lines into paragraphs and sections
  const sections: PaperSection[] = [];
  let currentSection: PaperSection = { heading: undefined, paragraphs: [] };
  let currentParaLines: DocumentLine[] = [];

  const pushParagraph = () => {
    if (currentParaLines.length === 0) return;

    let rawParagraphText = '';
    currentParaLines.forEach((l) => {
      const txt = l.text.trim();
      if (!rawParagraphText) {
        rawParagraphText = txt;
      } else if (rawParagraphText.endsWith('-')) {
        rawParagraphText = rawParagraphText.slice(0, -1) + txt;
      } else {
        rawParagraphText += ' ' + txt;
      }
    });

    const cleanedText = linkifyHtml(cleanUpHtmlTags(rawParagraphText));
    if (stripTags(cleanedText).trim()) {
      // Determine if block quote:
      // A paragraph is a block quote if its first line is indented AND it has NO non-indented lines.
      // If an indented first line is followed directly by a non-indented line, it is a normal paragraph.
      const firstLineIndented = currentParaLines[0].isIndented;
      const hasNonIndentedLine = currentParaLines.some((l) => !l.isIndented);
      const isBlockQuote = firstLineIndented && !hasNonIndentedLine;

      currentSection.paragraphs.push({
        text: cleanedText,
        isBlockQuote,
      });
    }

    currentParaLines = [];
  };

  docLines.forEach((line, i) => {
    if (line.isHeading) {
      pushParagraph();
      if (currentSection.paragraphs.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: linkifyHtml(cleanUpHtmlTags(line.text)),
        paragraphs: [],
      };
      return;
    }

    if (currentParaLines.length === 0) {
      currentParaLines.push(line);
    } else {
      const prevIdx = i - 1;
      const prevLine = docLines[prevIdx];
      const prevSpace = hasSpaceBelow(prevIdx);
      const isShortLineEnd =
        !prevLine.isIndented &&
        prevLine.plainTxt.length < 50 &&
        (prevLine.plainTxt.endsWith('.') ||
          prevLine.plainTxt.endsWith(':') ||
          prevLine.plainTxt.endsWith(')'));

      const isNewParagraph =
        prevSpace ||
        isShortLineEnd ||
        (line.isIndented && !prevLine.isIndented) ||
        (line.isIndented && prevLine.isIndented && prevSpace);

      if (isNewParagraph) {
        pushParagraph();
      }

      currentParaLines.push(line);
    }
  });

  pushParagraph();
  if (currentSection.paragraphs.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  return sections;
}
