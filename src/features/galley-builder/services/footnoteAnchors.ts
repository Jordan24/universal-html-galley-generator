import { FootnoteItem } from '../../../shared/types/galleyTypes';

export function renderBidirectionalFootnoteListHtml(footnotes: FootnoteItem[]): string {
  if (footnotes.length === 0) return '';

  const listItems = footnotes.map((fn) => `
    <li id="${fn.footnoteAnchorId}" class="galley-footnote-item" tabindex="-1">
      <p class="galley-footnote-text">
        <a href="#${fn.refAnchorId}" class="footnote-backref" aria-label="Back to content" title="Jump back to paper text">${fn.label}.</a>
        ${fn.text}
      </p>
    </li>
  `).join('');

  return `
    <section class="footnotes galley-footnotes-section" role="doc-endnotes" aria-labelledby="footnote-label">
      <h2 id="footnote-label" class="footnotes-title">Notes</h2>
      <ol class="footnotes-list" style="list-style: none; padding-left: 0;">
        ${listItems}
      </ol>
    </section>
  `;
}

export function renderSuperscriptRefHtml(fn: FootnoteItem): string {
  return `<sup id="${fn.refAnchorId}" class="footnote-ref" role="doc-noteref"><a href="#${fn.footnoteAnchorId}" aria-describedby="footnote-label">${fn.label}</a></sup>`;
}
