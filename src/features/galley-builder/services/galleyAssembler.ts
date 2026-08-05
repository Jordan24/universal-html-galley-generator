import { ParsedPaper, ScrapedTemplate } from '../../../shared/types/galleyTypes';
import { renderBidirectionalFootnoteListHtml } from './footnoteAnchors';
import { GALLEY_BODY_PLACEHOLDER } from '../../journal-scraper/services/domSanitizer';

export function assembleGalleyHtml(
  paper: ParsedPaper,
  template: ScrapedTemplate | null
): string {
  const paperTitle = paper.title || 'Academic Galley Article';

  // 1. Build Article Body HTML
  let articleBodyHtml = `
    <article class="galley-article-body" style="font-family: inherit; color: inherit;">
      <header class="galley-article-header" style="margin-bottom: 2rem;">
        <h1 class="galley-article-title" style="font-size: 2rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.75rem;">${escapeHtml(paper.title)}</h1>
        <div class="galley-article-authors" style="font-size: 1.05rem; opacity: 0.85; margin-bottom: 1.75rem; font-weight: 500;">
          ${paper.authors.map(escapeHtml).join(', ')}
        </div>
        ${paper.abstract ? `
          <div class="galley-article-abstract" style="background: rgba(59, 130, 246, 0.06); border-left: 4px solid #3b82f6; padding: 1.25rem 1.5rem; border-radius: 6px; margin-bottom: 2rem;">
            <h3 style="margin-top: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #3b82f6;">Abstract</h3>
            <p style="margin: 0; font-size: 1rem; line-height: 1.7;">${escapeHtml(paper.abstract)}</p>
          </div>
        ` : ''}
      </header>
  `;

  paper.sections.forEach((sec) => {
    articleBodyHtml += `<section class="galley-section" style="margin-bottom: 1.75rem;">`;
    if (sec.heading) {
      articleBodyHtml += `<h2 class="galley-heading" style="font-size: 1.4rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.85rem;">${escapeHtml(sec.heading)}</h2>`;
    }
    sec.paragraphs.forEach((p) => {
      if (p.includes('<sup id="fnref-')) {
        articleBodyHtml += `<p class="galley-paragraph" style="font-size: 1.05rem; line-height: 1.75; margin-bottom: 1.25rem; text-align: justify;">${p}</p>`;
      } else {
        articleBodyHtml += `<p class="galley-paragraph" style="font-size: 1.05rem; line-height: 1.75; margin-bottom: 1.25rem; text-align: justify;">${escapeHtml(p)}</p>`;
      }
    });
    articleBodyHtml += `</section>`;
  });

  // Attach Bidirectional Footnotes
  articleBodyHtml += renderBidirectionalFootnoteListHtml(paper.footnotes);
  articleBodyHtml += `</article>`;

  // 2. If full scraped page template is available, inject paper body into original website DOM
  if (template?.fullPageWrapperHtml && template.fullPageWrapperHtml.includes(GALLEY_BODY_PLACEHOLDER)) {
    return template.fullPageWrapperHtml.replace(GALLEY_BODY_PLACEHOLDER, articleBodyHtml);
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
      body { margin: 0; padding: 0; font-family: 'Merriweather', Georgia, serif; line-height: 1.75; color: #1e293b; background: #ffffff; }
      .galley-container { max-width: 860px; margin: 0 auto; padding: 3rem 1.5rem; }
      .footnote-ref a { color: #2563eb; text-decoration: none; font-weight: 700; padding: 0 3px; }
      .footnotes { margin-top: 3.5rem; padding-top: 1.5rem; border-top: 2px solid #e2e8f0; font-family: system-ui, -apple-system, sans-serif; }
      .footnotes-title { font-size: 1.15rem; color: #0f172a; margin-bottom: 1rem; }
      .footnotes-list { list-style: none; padding-left: 0; margin: 0; }
      .galley-footnote-item { margin-bottom: 0.75rem; font-size: 0.925rem; color: #334155; }
      .galley-footnote-item:target { background: #eff6ff; padding: 0.25rem 0.5rem; border-radius: 4px; outline: 2px solid #3b82f6; }
      .footnote-backref { color: #2563eb; text-decoration: none; margin-right: 0.35rem; font-weight: 700; }
    </style>
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

function generateDefaultHeader(targetUrl?: string): string {
  const domain = targetUrl ? new URL(targetUrl).hostname : 'Academic Journal';
  return `
    <header class="galley-default-header" style="background: #0f172a; color: #ffffff; padding: 1.5rem 2rem; border-bottom: 3px solid #3b82f6; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 860px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 1.15rem; font-weight: 700; color: #f8fafc;">${escapeHtml(domain)}</span>
        <span style="font-size: 0.8rem; background: #3b82f6; color: #fff; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; text-transform: uppercase;">HTML Galley</span>
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
