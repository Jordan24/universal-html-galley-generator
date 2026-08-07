import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Unlink,
  Indent,
  Outdent,
  Undo,
  Redo,
  RotateCcw,
} from 'lucide-react';
import {
  ToolbarState,
  executeCommand,
  formatBlock,
  setFontSize,
  promptAndCreateLink,
  removeLink,
} from '../services/editorCommands';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
  iframeDoc: Document | null;
  toolbarState: ToolbarState;
  onResetOriginal?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  iframeDoc,
  toolbarState,
  onResetOriginal,
}) => {
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    if (!iframeDoc) return;
    action();
  };

  if (!iframeDoc) return null;

  return (
    <div className={styles.editorToolbar} role="toolbar" aria-label="Rich Text Formatting Controls">
      {/* Group 1: Block Designation */}
      <div className={styles.group}>
        <select
          className={styles.select}
          value={toolbarState.blockTag}
          onChange={(e) => formatBlock(iframeDoc, e.target.value)}
          aria-label="Text Designation (Block Type)"
          title="Block Designation"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Header 1</option>
          <option value="h2">Header 2</option>
          <option value="h3">Header 3</option>
          <option value="h4">Header 4</option>
          <option value="blockquote">Blockquote</option>
          <option value="pre">Code Block</option>
        </select>

        <select
          className={styles.select}
          value={toolbarState.fontSize}
          onChange={(e) => setFontSize(iframeDoc, e.target.value)}
          aria-label="Font Size"
          title="Text Size"
        >
          <option value="2">Small</option>
          <option value="3">Normal Size</option>
          <option value="4">Large</option>
          <option value="5">Extra Large</option>
        </select>
      </div>

      <div className={styles.divider} />

      {/* Group 2: Text Styling */}
      <div className={styles.group}>
        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isBold ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'bold'))}
          aria-label="Bold Text"
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isItalic ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'italic'))}
          aria-label="Italic Text"
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isUnderline ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'underline'))}
          aria-label="Underline Text"
          title="Underline (Ctrl+U)"
        >
          <Underline size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isSuperscript ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'superscript'))}
          aria-label="Superscript"
          title="Superscript"
        >
          <Superscript size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isSubscript ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'subscript'))}
          aria-label="Subscript"
          title="Subscript"
        >
          <Subscript size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Group 3: Text Alignment / Justification */}
      <div className={styles.group}>
        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isJustifyLeft ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'justifyLeft'))}
          aria-label="Align Left"
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isJustifyCenter ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'justifyCenter'))}
          aria-label="Align Center"
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isJustifyRight ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'justifyRight'))}
          aria-label="Align Right"
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${toolbarState.isJustifyFull ? styles.activeBtn : ''}`}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'justifyFull'))}
          aria-label="Justify Full"
          title="Justify Full"
        >
          <AlignJustify size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Group 4: Links */}
      <div className={styles.group}>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => handleAction(e, () => promptAndCreateLink(iframeDoc))}
          aria-label="Insert Link"
          title="Insert Hyperlink"
        >
          <Link size={14} />
        </button>

        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => handleAction(e, () => removeLink(iframeDoc))}
          aria-label="Remove Link"
          title="Remove Link"
        >
          <Unlink size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Group 5: Indentation */}
      <div className={styles.group}>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'outdent'))}
          aria-label="Decrease Indent"
          title="Outdent"
        >
          <Outdent size={14} />
        </button>

        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'indent'))}
          aria-label="Increase Indent"
          title="Indent"
        >
          <Indent size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Group 6: History & Revert */}
      <div className={styles.group}>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'undo'))}
          aria-label="Undo Edit"
          title="Undo"
        >
          <Undo size={14} />
        </button>

        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => handleAction(e, () => executeCommand(iframeDoc, 'redo'))}
          aria-label="Redo Edit"
          title="Redo"
        >
          <Redo size={14} />
        </button>

        {onResetOriginal && (
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onResetOriginal}
            aria-label="Reset to original assembly"
            title="Reset Edits to Original"
            style={{ color: 'var(--accent-amber)' }}
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
