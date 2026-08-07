import { ScrapedTemplate } from '../../../shared/types/galleyTypes';

export const GALLEY_BODY_PLACEHOLDER = '<!-- GALLEY_ARTICLE_BODY_PLACEHOLDER -->';

export function parseAndSanitizeJournalDom(rawHtml: string, targetUrl: string): ScrapedTemplate {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const pageTitle = doc.querySelector('title')?.textContent || 'Academic Journal Galley';
  const baseUrl = new URL(targetUrl);

  // 1. Convert all relative URLs across the entire DOM to absolute URLs
  convertRelativeUrlsToAbsolute(doc, baseUrl);

  // 2. Extract stylesheet links and inline styles
  const stylesheets: string[] = [];
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href) stylesheets.push(href);
  });

  const inlineStyles: string[] = [];
  doc.querySelectorAll('style').forEach((style) => {
    if (style.textContent) inlineStyles.push(style.textContent);
  });

  // 3. Remove script elements to prevent XSS / unwanted runtime redirects
  doc.querySelectorAll('script').forEach((script) => script.remove());

  // 4. Extract Header & Footer elements for fallback
  const headerSelectors = [
    'header',
    '.header',
    '.main-header',
    '#header',
    '#site-header',
    '.site-header',
    'nav',
    '.navbar',
    '.journal-header',
    '.pkp_structure_head',
    '.pkp_site_name',
    '#branding',
    '.site-branding',
    '.masthead',
    '#masthead',
    '[role="banner"]',
    '.top-header',
    '.c-header',
    '#gh-header',
    '.global-header',
    '.publication-header',
    '#header-navigation',
    '.page-header',
    '#page-header',
    '.header-wrapper'
  ];

  let headerElem: Element | null = null;
  for (const selector of headerSelectors) {
    const found = doc.querySelector(selector);
    if (found && found.innerHTML.trim().length > 10) {
      headerElem = found;
      break;
    }
  }

  const isFallbackHeader = !headerElem;
  const headerHtml = headerElem ? headerElem.outerHTML : generateFallbackHeader(targetUrl, pageTitle);

  const footerSelectors = [
    'footer',
    '.footer',
    '.site-footer',
    '#footer',
    '#site-footer',
    '.journal-footer',
    '.pkp_structure_footer',
    '[role="contentinfo"]',
    '#page-footer',
    '.c-footer'
  ];

  let footerElem: Element | null = null;
  for (const selector of footerSelectors) {
    const found = doc.querySelector(selector);
    if (found && found.innerHTML.trim().length > 10) {
      footerElem = found;
      break;
    }
  }

  const isFallbackFooter = !footerElem;
  const footerHtml = footerElem ? footerElem.outerHTML : generateFallbackFooter(targetUrl);

  // 5. Locate main content container and inject GALLEY_BODY_PLACEHOLDER
  const mainContainerSelectors = [
    '#articleMain',
    '#articleMainWrapper',
    '.article-details-main',
    '.article-body-content',
    '.entry-content',
    '.article-content',
    '.post-content',
    'main',
    '[role="main"]',
    '#main-content',
    '.pkp_structure_main',
    '.page-article',
    '.article-details',
    '.article-view',
    '#content',
    '.main-content',
    '#main',
    '.content',
    '#article',
    '.article',
    '.fulltext-view',
    '#html-full-text',
    '.c-article-main-column',
    '#article-body',
    '.paper-body'
  ];

  let mainContainer: Element | null = null;
  for (const selector of mainContainerSelectors) {
    const found = doc.querySelector(selector);
    if (found && found.innerHTML.trim().length > 50) {
      mainContainer = found;
      break;
    }
  }

  let fullPageWrapperHtml = '';
  if (mainContainer) {
    mainContainer.innerHTML = GALLEY_BODY_PLACEHOLDER;
    fullPageWrapperHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  } else if (doc.body) {
    const wrapperDiv = doc.createElement('div');
    wrapperDiv.id = 'galley-injected-main-content';
    wrapperDiv.innerHTML = GALLEY_BODY_PLACEHOLDER;
    
    if (headerElem && headerElem.nextElementSibling) {
      headerElem.after(wrapperDiv);
    } else {
      doc.body.appendChild(wrapperDiv);
    }
    fullPageWrapperHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }

  return {
    targetUrl,
    pageTitle,
    headerHtml,
    footerHtml,
    stylesheets,
    inlineStyles,
    fullPageWrapperHtml,
    isFallbackHeader,
    isFallbackFooter,
  };
}

function convertRelativeUrlsToAbsolute(doc: Document, baseUrl: URL): void {
  // Fix <img src> and srcset
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src')?.trim();
    if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        img.setAttribute('src', new URL(src, baseUrl.href).href);
      } catch {}
    }
    const srcset = img.getAttribute('srcset')?.trim();
    if (srcset) {
      const fixedSrcset = srcset.split(',').map(part => {
        const [url, size] = part.trim().split(/\s+/);
        if (url && !url.startsWith('data:') && !url.startsWith('http://') && !url.startsWith('https://')) {
          try {
            return `${new URL(url, baseUrl.href).href} ${size || ''}`.trim();
          } catch { return part; }
        }
        return part;
      }).join(', ');
      img.setAttribute('srcset', fixedSrcset);
    }
  });

  // Fix <a href>
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href')?.trim();
    if (href && !href.startsWith('#') && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
      try {
        a.setAttribute('href', new URL(href, baseUrl.href).href);
      } catch {}
    }
  });

  // Fix <link href>
  doc.querySelectorAll('link[href]').forEach((link) => {
    const href = link.getAttribute('href')?.trim();
    if (href && !href.startsWith('data:') && !href.startsWith('http://') && !href.startsWith('https://')) {
      try {
        link.setAttribute('href', new URL(href, baseUrl.href).href);
      } catch {}
    }
  });

  // Fix <source src>
  doc.querySelectorAll('source[src]').forEach((source) => {
    const src = source.getAttribute('src')?.trim();
    if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        source.setAttribute('src', new URL(src, baseUrl.href).href);
      } catch {}
    }
  });
}

export function generateFallbackHeader(targetUrl: string, pageTitle?: string): string {
  const hostname = new URL(targetUrl).hostname;
  const jaLogoSvg = `<svg viewBox="0 0 143.02 164.9" style="width: 16px; height: 16px; fill: #ffffff; vertical-align: middle;" aria-hidden="true"><path d="M87.38,68.45l-5.62-12.23-32.83,16.11,22.58-43.23,23.76,45.22,21.64,37.82,2.16,3.78s7.5,14.07,9.33,14.07l14.62-.04-34.99-60.68c-4.1-7.58-31.81-60.3-36.54-69.26l-37.5,71.11c-2.93,5.55-7.36,9.99-12.15,13.79C15.36,89.57,7.99,92.24,0,92.22v13.54c7.13.03,14.1-1.36,20.62-4.33l44.38-21.92.08-.04c-.02,6.14.87,14.72.86,16.48l-.09,30.35c-.02,8.04-4.3,15.05-10.45,19.74-16.69,12.92-41.46.39-41.57-20.55H0c.45,35.77,44.9,53.1,69.2,26.46,6.42-7.06,10.39-15.93,10.42-25.58l-1.21-52.83"/></svg>`;
  return `
    <header class="journal-scraped-header" style="background: #0f172a; color: #ffffff; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #3b82f6; font-family: system-ui, -apple-system, sans-serif;">
      <div style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem;">
        <span style="background: #3b82f6; color: #fff; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.4rem;">
          ${jaLogoSvg} Journal
        </span>
        <span>${escapeHtml(pageTitle || hostname)}</span>
      </div>
      <div style="font-size: 0.85rem; color: #94a3b8;">
        Hosted on <strong>${escapeHtml(hostname)}</strong>
      </div>
    </header>
  `;
}

export function generateFallbackFooter(targetUrl: string): string {
  const hostname = new URL(targetUrl).hostname;
  const year = new Date().getFullYear();
  return `
    <footer class="journal-scraped-footer" style="background: #0b0f19; color: #94a3b8; padding: 2.5rem 1.5rem; text-align: center; border-top: 1px solid #1e293b; font-size: 0.875rem; font-family: system-ui, -apple-system, sans-serif;">
      <p style="margin: 0; font-weight: 500;">&copy; ${year} ${escapeHtml(hostname)}. All rights reserved. Open Access HTML Galley Edition.</p>
      <p style="margin-top: 0.5rem; font-size: 0.775rem; color: #64748b;">Rendered via Universal HTML Galley Generator • Open Source (Apache 2.0)</p>
    </footer>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
