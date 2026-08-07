/**
 * Heading Detector Service
 * Detects whether a plain text line extracted from a PDF represents an academic section heading
 * (e.g., "1. Introduction", "2.1 Methods", "I. Background", "RESULTS").
 *
 * Prevents false-positive matches on 4-digit years (e.g. "2018.", "2018.)"), date strings,
 * parenthesized references, and multi-line image caption continuations.
 */

export function isSectionHeading(plainTxt: string): boolean {
  if (!plainTxt) return false;

  const trimmed = plainTxt.trim();

  // Exclude lines starting with 4-digit years (e.g. "2018.)", "1999.") or closing parentheses
  if (/^(19|20)\d{2}\b/.test(trimmed) || trimmed.startsWith(')')) {
    return false;
  }

  // 1. Numbered section headings: "1. Introduction", "2.1 Methods", "10. Conclusion"
  // Must start with a 1-3 digit number (excluding 4-digit years), followed by dot or subsection, not followed by ')'
  const numberedHeading = /^(?!(19|20)\d{2}\b)\d{1,3}(\.\d{1,3})*\.(?!\))\s*/i.test(trimmed);

  // 2. Roman numeral headings: "I. Introduction", "IV. Results"
  const romanHeading = /^[I|V|X]+\.(?!\))\s*/i.test(trimmed);

  // 3. Known academic section title keywords
  const keywordHeading = /^(\bIntroduction\b|\bBackground\b|\bMethods\b|\bResults\b|\bDiscussion\b|\bConclusion\b|\bReferences\b|\bWorks Cited\b|\bAcknowledgements\b)/i.test(trimmed);

  // 4. Short all-caps section title lines (e.g., "METHODS AND MATERIALS", but not "2018.)")
  const allCapsHeading =
    trimmed.length < 55 &&
    trimmed === trimmed.toUpperCase() &&
    trimmed.length > 3 &&
    !/^\d{4}\b/.test(trimmed) &&
    !trimmed.includes(')');

  return numberedHeading || romanHeading || keywordHeading || allCapsHeading;
}
