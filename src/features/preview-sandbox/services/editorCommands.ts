export interface ToolbarState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isSuperscript: boolean;
  isSubscript: boolean;
  blockTag: string;
  fontSize: string;
}

export function executeCommand(
  doc: Document,
  command: string,
  value: string | undefined = undefined
): void {
  try {
    doc.execCommand(command, false, value);
  } catch (err) {
    console.warn(`Failed to execute command "${command}":`, err);
  }
}

export function formatBlock(doc: Document, tag: string): void {
  const normalizedTag = tag.startsWith('<') ? tag : `<${tag}>`;
  executeCommand(doc, 'formatBlock', normalizedTag);
}

export function setFontSize(doc: Document, size: string): void {
  // execCommand 'fontSize' uses values 1-7
  executeCommand(doc, 'fontSize', size);
}

export function promptAndCreateLink(doc: Document): void {
  const selection = doc.getSelection();
  const defaultUrl = selection ? selection.toString().trim() : '';
  const initial = defaultUrl.startsWith('http') ? defaultUrl : 'https://';
  const url = window.prompt('Enter link URL:', initial);
  if (url && url.trim() !== '') {
    executeCommand(doc, 'createLink', url.trim());
  }
}

export function removeLink(doc: Document): void {
  executeCommand(doc, 'unlink');
}

export function getToolbarState(doc: Document): ToolbarState {
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isSuperscript = false;
  let isSubscript = false;
  let blockTag = 'p';
  let fontSize = '3';

  try {
    isBold = doc.queryCommandState('bold');
    isItalic = doc.queryCommandState('italic');
    isUnderline = doc.queryCommandState('underline');
    isSuperscript = doc.queryCommandState('superscript');
    isSubscript = doc.queryCommandState('subscript');

    const blockVal = doc.queryCommandValue('formatBlock');
    if (blockVal) {
      blockTag = blockVal.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const sizeVal = doc.queryCommandValue('fontSize');
    if (sizeVal) {
      fontSize = String(sizeVal);
    }
  } catch (err) {
    // Ignore error if document selection is inactive
  }

  return {
    isBold,
    isItalic,
    isUnderline,
    isSuperscript,
    isSubscript,
    blockTag: blockTag || 'p',
    fontSize: fontSize || '3',
  };
}
