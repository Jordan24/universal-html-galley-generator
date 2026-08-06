/**
 * Sanitizes assembled HTML prior to exporting, ensuring that all editor-specific
 * attributes (such as contenteditable, spellcheck, and editing CSS) are completely removed
 * so that the exported file is clean, static, and non-editable.
 */
export function sanitizeHtmlForExport(htmlContent: string): string {
  if (!htmlContent) return htmlContent;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Remove all contenteditable attributes
    const editableEls = doc.querySelectorAll('[contenteditable]');
    editableEls.forEach((el) => {
      el.removeAttribute('contenteditable');
    });

    // 2. Remove injected editor helper styles
    const editStyleEl = doc.getElementById('galley-edit-styles');
    if (editStyleEl) {
      editStyleEl.remove();
    }

    // 3. Remove spellcheck attribute if attached during editing
    const spellcheckEls = doc.querySelectorAll('[spellcheck]');
    spellcheckEls.forEach((el) => {
      el.removeAttribute('spellcheck');
    });

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  } catch (err) {
    // Fallback string manipulation if DOMParser is unavailable
    return htmlContent
      .replace(/\s*contenteditable=["']?(true|false)?["']?/gi, '')
      .replace(/<style id="galley-edit-styles">[\s\S]*?<\/style>/gi, '');
  }
}
