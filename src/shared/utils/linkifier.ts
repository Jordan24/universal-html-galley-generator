/**
 * Linkifier utility to detect, convert, and preserve URLs, www links, DOIs,
 * and email addresses as HTML <a> hyperlink elements.
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Transforms plain text URLs, www links, DOIs, and email addresses in HTML strings
 * into clickable <a> hyperlink elements while strictly preserving existing HTML tags and <a> anchors.
 */
export function linkifyHtml(html: string): string {
  if (!html) return html;

  const rules: Array<(text: string) => string> = [
    // 1. Full http/https URLs
    (str) =>
      str.replace(
        /\b(https?:\/\/[^\s<>"'()]+[^\s<>"'().,;:?!])/gi,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      ),

    // 2. www. domain names (not preceded by http:// or https://)
    (str) =>
      str.replace(
        /(^|[^/a-zA-Z0-9_])\b(www\.[^\s<>"'()]+[^\s<>"'().,;:?!])/gi,
        '$1<a href="https://$2" target="_blank" rel="noopener noreferrer">$2</a>'
      ),

    // 3. DOIs explicitly prefixed with doi: or DOI:
    (str) =>
      str.replace(
        /\b(doi:\s*)(10\.\d{4,9}\/[^\s<>"'()]+[^\s<>"'().,;:?!])/gi,
        '$1<a href="https://doi.org/$2" target="_blank" rel="noopener noreferrer">$2</a>'
      ),

    // 4. Bare DOIs starting with 10.xxxx/ (not preceded by doi.org/ or doi:)
    (str) =>
      str.replace(
        /(^|[^/a-zA-Z0-9_:>])(10\.\d{4,9}\/[^\s<>"'()]+[^\s<>"'().,;:?!])/gi,
        (match, prefix, doi) => {
          if (/doi:\s*$/i.test(prefix) || /doi\.org\/$/i.test(prefix)) {
            return match;
          }
          return `${prefix}<a href="https://doi.org/${doi}" target="_blank" rel="noopener noreferrer">${doi}</a>`;
        }
      ),

    // 5. Email addresses
    (str) =>
      str.replace(
        /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/gi,
        '<a href="mailto:$1">$1</a>'
      ),
  ];

  let currentHtml = html;

  for (const rule of rules) {
    currentHtml = transformOutsideAnchors(currentHtml, rule);
  }

  return currentHtml;
}

function transformOutsideAnchors(html: string, transformFn: (text: string) => string): string {
  const tokens = html.split(/(<[^>]+>)/g);
  let inAnchor = false;

  const result = tokens.map((token) => {
    if (token.startsWith('<')) {
      const lower = token.toLowerCase();
      if (/^<a\b/i.test(lower)) {
        inAnchor = true;
      } else if (/^<\/a>/i.test(lower)) {
        inAnchor = false;
      }
      return token;
    }

    if (inAnchor) {
      return token;
    }

    return transformFn(token);
  });

  return result.join('');
}
