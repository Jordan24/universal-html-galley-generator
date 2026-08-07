import { ParsedPaper, ScrapedTemplate, GalleyDisplayOptions } from '../../../shared/types/galleyTypes';
import { renderBidirectionalFootnoteListHtml } from './footnoteAnchors';
import { GALLEY_BODY_PLACEHOLDER } from '../../journal-scraper/services/domSanitizer';
import { stripTags } from '../../pdf-ingestion/services/pdfParser';

export function assembleGalleyHtml(
  paper: ParsedPaper,
  template: ScrapedTemplate | null,
  options?: GalleyDisplayOptions
): string {
  const paperTitle = paper.title || 'Academic Galley Article';
  const showTitle = options?.showTitleInBody ?? true;
  const showAuthors = options?.showAuthorsInBody ?? true;
  const showAbstract = options?.showAbstractInBody ?? true;

  const textAlignStyle = options?.textAlign === 'left' ? 'text-align: left;' : 'text-align: justify;';
  
  const lineSpacing = options?.lineHeight === 'compact' ? '1.5' : options?.lineHeight === 'loose' ? '2.0' : '1.75';
  
  const fontCss = options?.fontFamily === 'sans-serif'
    ? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : options?.fontFamily === 'inherit'
    ? 'inherit'
    : "'Merriweather', 'Lora', Georgia, serif";

  const containerMaxWidth = options?.containerWidth === 'narrow' ? '700px' : options?.containerWidth === 'wide' ? '1000px' : '860px';

  const headingTransformCss = options?.headingTransform === 'uppercase' ? 'text-transform: uppercase; letter-spacing: 0.05em;' : '';

  const titleHtml = showTitle && paper.title
    ? `<h1 class="galley-article-title" style="font-size: 2rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.75rem; ${headingTransformCss}">${paper.title}</h1>`
    : '';

  const authorsHtml = showAuthors && paper.authors && paper.authors.length > 0
    ? `<div class="galley-article-authors" style="font-size: 1.05rem; opacity: 0.85; margin-bottom: 1.75rem; font-weight: 500;">
        ${paper.authors.map(escapeHtml).join(', ')}
      </div>`
    : '';

  const cardColor = options?.abstractCardColor || '#3b82f6';
  const abstractCardStyle = options?.abstractStyle === 'card'
    ? `background: ${hexToRgba(cardColor, 0.06)}; border-left: 4px solid ${cardColor}; padding: 1.25rem 1.5rem; border-radius: 8px; margin-bottom: 2rem;`
    : 'margin-bottom: 2rem;';

  const abstractHtml = showAbstract && paper.abstract
    ? `<div class="galley-article-abstract" style="${abstractCardStyle}">
        <h2 class="galley-heading" style="font-size: 1.3rem; font-weight: 700; margin-top: 0; margin-bottom: 0.75rem; ${headingTransformCss}">Abstract</h2>
        <p class="galley-paragraph" style="font-size: 1.05rem; line-height: ${lineSpacing}; margin-bottom: 0; ${textAlignStyle}">${paper.abstract}</p>
      </div>`
    : '';

  const hasHeaderContent = Boolean(titleHtml || authorsHtml || abstractHtml);
  const articleHeaderMarkup = hasHeaderContent
    ? `<header class="galley-article-header" style="margin-bottom: 2rem;">
        ${titleHtml}
        ${authorsHtml}
        ${abstractHtml}
      </header>`
    : '';

  // 1. Build Article Body HTML
  let articleBodyHtml = `
    <article class="galley-article-body" style="font-family: ${fontCss}; color: inherit;">
      ${articleHeaderMarkup}
  `;

  // Track placed figures
  const placedFigureIds = new Set<string>();

  const renderFigureHtml = (fig: any) => {
    const urls: string[] = fig.dataUrls && fig.dataUrls.length > 0 ? fig.dataUrls : [fig.dataUrl];
    const isMultiImage = urls.length > 1;

    const imagesHtml = urls.map((url, idx) => `
      <img src="${url}" alt="${escapeHtml((fig.altText || fig.caption) + (isMultiImage ? ` (Part ${idx + 1})` : ''))}" class="galley-figure-img" style="${
        isMultiImage
          ? 'max-width: 48%; min-width: 240px; height: auto; border-radius: 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); flex: 1;'
          : 'max-width: 100%; height: auto; border-radius: 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);'
      }" />
    `).join('\n');

    return `
      <figure id="${fig.id}" class="galley-figure" style="margin: 2rem 0; text-align: center;">
        <div class="galley-figure-group" style="display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap;">
          ${imagesHtml}
        </div>
        <figcaption class="galley-figure-caption" style="margin-top: 0.75rem; font-size: 0.9rem; color: #475569;">
          ${fig.caption}
        </figcaption>
      </figure>
    `;
  };

  paper.sections.forEach((sec, idx) => {
    articleBodyHtml += `<section class="galley-section" style="margin-bottom: 1.75rem;">`;
    if (sec.heading) {
      let formattedHeading = sec.heading;
      const numPrefix = options?.headingNumbering === 'decimal'
        ? `${idx + 1}. `
        : options?.headingNumbering === 'roman'
        ? `${toRomanNumeral(idx + 1)}. `
        : '';

      // Check if heading already starts with a number
      if (numPrefix && !/^\d+\.|\b[I|V|X]+\./i.test(sec.heading)) {
        formattedHeading = `${numPrefix}${sec.heading}`;
      }

      articleBodyHtml += `<h2 class="galley-heading" style="font-size: 1.4rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.85rem; ${headingTransformCss}">${formattedHeading}</h2>`;
    }
    sec.paragraphs.forEach((p) => {
      const pText = typeof p === 'string' ? p : p.text;
      const isBlockQuote = typeof p === 'string' ? false : Boolean(p.isBlockQuote);
      const innerHtml = pText;

      if (isBlockQuote) {
        articleBodyHtml += `
          <blockquote class="galley-blockquote" style="margin: 1.75rem 2.5rem; padding: 0; border: none; color: inherit;">
            <p class="galley-paragraph" style="font-size: 1.025rem; line-height: ${lineSpacing}; margin: 0; ${textAlignStyle}">${innerHtml}</p>
          </blockquote>
        `;
      } else {
        articleBodyHtml += `<p class="galley-paragraph" style="font-size: 1.05rem; line-height: ${lineSpacing}; margin-bottom: 1.25rem; ${textAlignStyle}">${innerHtml}</p>`;
      }

      // Check if any unplaced figure is referenced in this paragraph
      paper.figures.forEach((fig) => {
        if (!placedFigureIds.has(fig.id)) {
          const figNum = fig.id.replace('fig-', '');
          const figRegex = new RegExp(`\\bfig(ure)?\\.?\\s*${figNum}\\b`, 'i');
          if (figRegex.test(pText)) {
            articleBodyHtml += renderFigureHtml(fig);
            placedFigureIds.add(fig.id);
          }
        }
      });
    });
    articleBodyHtml += `</section>`;
  });

  // Append remaining unplaced figures
  const unplacedFigures = paper.figures.filter(f => !placedFigureIds.has(f.id));
  if (unplacedFigures.length > 0) {
    articleBodyHtml += `<section class="galley-figures-gallery" style="margin-top: 2.5rem; margin-bottom: 2rem;">`;
    unplacedFigures.forEach((fig) => {
      articleBodyHtml += renderFigureHtml(fig);
    });
    articleBodyHtml += `</section>`;
  }

  // Attach Footnotes (Endnotes or Popovers)
  articleBodyHtml += renderBidirectionalFootnoteListHtml(paper.footnotes);
  articleBodyHtml += `</article>`;

  // Enrich any footnote superscript links with data-popover and title attributes if missing
  if (paper.footnotes && paper.footnotes.length > 0) {
    paper.footnotes.forEach((fn) => {
      const plainText = stripTags(fn.text || '').trim();
      const popoverText = escapeHtml(plainText || `Footnote ${fn.label}`);
      const targetRegex = new RegExp(`<sup\\s+id="${fn.refAnchorId}"(?![^>]*data-popover)`, 'g');
      articleBodyHtml = articleBodyHtml.replace(
        targetRegex,
        `<sup id="${fn.refAnchorId}" data-popover="${popoverText}" title="${popoverText}"`
      );
    });
  }

  const galleyStyleBlock = `
    <style id="galley-popover-styles">
      .footnote-ref { position: relative; display: inline-block; cursor: pointer; }
      .footnote-ref a { color: #2563eb; text-decoration: none; font-weight: 700; padding: 0 3px; }
      ${options?.footnoteStyle === 'popover' ? `
      .footnote-ref[data-popover]:hover::after {
        content: attr(data-popover);
        position: absolute;
        bottom: 135%;
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        color: #ffffff;
        padding: 0.6rem 0.85rem;
        border-radius: 6px;
        font-size: 0.825rem;
        line-height: 1.45;
        font-weight: 400;
        width: 260px;
        max-width: 80vw;
        word-wrap: break-word;
        white-space: normal;
        text-align: left;
        z-index: 1000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        pointer-events: none;
      }
      .footnote-ref[data-popover]:hover::before {
        content: '';
        position: absolute;
        bottom: 115%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px 6px 0 6px;
        border-style: solid;
        border-color: #0f172a transparent transparent transparent;
        z-index: 1001;
        pointer-events: none;
      }
      .footnotes { display: none; }
      ` : ''}
      .footnotes { margin-top: 3.5rem; padding-top: 1.5rem; border-top: 2px solid #e2e8f0; font-family: system-ui, -apple-system, sans-serif; }
      .footnotes-title { font-size: 1.15rem; color: #0f172a; margin-bottom: 1rem; }
      .footnotes-list { list-style: none; padding-left: 0; margin: 0; }
      .galley-footnote-item { margin-bottom: 0.75rem; font-size: 0.925rem; color: #334155; }
      .galley-footnote-item:target { background: #eff6ff; padding: 0.25rem 0.5rem; border-radius: 4px; outline: 2px solid #3b82f6; }
      .footnote-backref { color: #2563eb; text-decoration: none; margin-right: 0.35rem; font-weight: 700; }
    </style>
  `;

  // 2. If full scraped page template is available, inject paper body into original website DOM
  if (template?.fullPageWrapperHtml && template.fullPageWrapperHtml.includes(GALLEY_BODY_PLACEHOLDER)) {
    let fullHtml = template.fullPageWrapperHtml.replace(GALLEY_BODY_PLACEHOLDER, articleBodyHtml);
    if (fullHtml.includes('</head>')) {
      fullHtml = fullHtml.replace('</head>', `${galleyStyleBlock}\n</head>`);
    } else {
      fullHtml = `${galleyStyleBlock}\n${fullHtml}`;
    }
    return fullHtml;
  }

  // 3. Fallback: Wrap paper body in clean header/footer template skin
  const headerMarkup = template?.headerHtml || generateDefaultHeader(template?.targetUrl);
  const footerMarkup = template?.footerHtml || generateDefaultFooter(template?.targetUrl);

  const cssLinkTags = template?.stylesheets && template.stylesheets.length > 0
    ? template.stylesheets.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n    ')
    : '';

  const inlineStyleTags = template?.inlineStyles && template.inlineStyles.length > 0
    ? template.inlineStyles.map((css) => `<style>${css}</style>`).join('\n    ')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(paperTitle)}</title>
    ${cssLinkTags}
    ${inlineStyleTags}
    <style>
      body { margin: 0; padding: 0; font-family: ${fontCss}; line-height: ${lineSpacing}; color: #1e293b; background: #ffffff; }
      .galley-container { max-width: ${containerMaxWidth}; margin: 0 auto; padding: 3rem 1.5rem; }
      .galley-article-body a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; word-break: break-word; transition: color 0.15s ease; }
      .galley-article-body a:hover { color: #1d4ed8; text-decoration-color: #1d4ed8; }
      .galley-blockquote { margin: 1.75rem 2.5rem; padding: 0; border: none; color: inherit; }
      .galley-figure { margin: 2rem 0; text-align: center; }
      .galley-figure-group { display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap; }
      .galley-figure-img { max-width: 100%; height: auto; border-radius: 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); display: inline-block; }
      .galley-figure-caption { margin-top: 0.75rem; font-size: 0.9rem; color: #475569; }
    </style>
    ${galleyStyleBlock}
</head>
<body>
${headerMarkup}
<main class="galley-container">
  ${articleBodyHtml}
</main>
${footerMarkup}
</body>
</html>`;
}


function toRomanNumeral(num: number): string {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [val, roman] of map) {
    while (num >= val) {
      result += roman;
      num -= val;
    }
  }
  return result;
}

function generateDefaultHeader(targetUrl?: string): string {
  const domain = targetUrl ? new URL(targetUrl).hostname : 'Academic Journal';
  const jaLogoSvg = `<svg viewBox="0 0 143.02 164.9" style="width: 16px; height: 16px; fill: #ffffff; vertical-align: middle;" aria-hidden="true"><path d="M87.38,68.45l-5.62-12.23-32.83,16.11,22.58-43.23,23.76,45.22,21.64,37.82,2.16,3.78s7.5,14.07,9.33,14.07l14.62-.04-34.99-60.68c-4.1-7.58-31.81-60.3-36.54-69.26l-37.5,71.11c-2.93,5.55-7.36,9.99-12.15,13.79C15.36,89.57,7.99,92.24,0,92.22v13.54c7.13.03,14.1-1.36,20.62-4.33l44.38-21.92.08-.04c-.02,6.14.87,14.72.86,16.48l-.09,30.35c-.02,8.04-4.3,15.05-10.45,19.74-16.69,12.92-41.46.39-41.57-20.55H0c.45,35.77,44.9,53.1,69.2,26.46,6.42-7.06,10.39-15.93,10.42-25.58l-1.21-52.83"/></svg>`;
  return `
    <header class="galley-default-header" style="background: #0f172a; color: #ffffff; padding: 1.5rem 2rem; border-bottom: 3px solid #3b82f6; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 860px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 1.15rem; font-weight: 700; color: #f8fafc;">${escapeHtml(domain)}</span>
        <span style="font-size: 0.8rem; background: #3b82f6; color: #fff; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.4rem;">
          ${jaLogoSvg} HTML Galley
        </span>
      </div>
    </header>
  `;
}

function generateDefaultFooter(targetUrl?: string): string {
  const domain = targetUrl ? new URL(targetUrl).hostname : 'Academic Journal';
  const year = new Date().getFullYear();
  return `
    <footer class="galley-default-footer" style="background: #0b0f19; color: #94a3b8; padding: 2.5rem 1.5rem; text-align: center; border-top: 1px solid #1e293b; font-size: 0.875rem; font-family: system-ui, -apple-system, sans-serif;">
      <p style="margin: 0;">&copy; ${year} ${escapeHtml(domain)}. All rights reserved.</p>
      <p style="margin-top: 0.5rem; font-size: 0.775rem; color: #64748b;">Rendered via Universal HTML Galley Generator • Open Source (Apache 2.0)</p>
    </footer>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) {
    return `rgba(59, 130, 246, ${alpha})`;
  }
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

