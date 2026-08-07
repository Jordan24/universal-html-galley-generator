import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Monitor, Tablet, Smartphone, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';
import { getToolbarState, ToolbarState } from '../services/editorCommands';
import { ExportControls } from '../../export-bundle/components/ExportControls';
import styles from './PreviewSandbox.module.css';

interface PreviewSandboxProps {
  assembledHtml: string | null;
  paperTitle?: string;
  hasPaper?: boolean;
  hasTemplate?: boolean;
  onRefresh?: () => void;
  onHtmlChange?: (updatedHtml: string) => void;
  isLeftPanelCollapsed?: boolean;
  onToggleLeftPanel?: () => void;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const PreviewSandbox: React.FC<PreviewSandboxProps> = ({
  assembledHtml,
  paperTitle,
  hasPaper = false,
  hasTemplate = false,
  onRefresh,
  onHtmlChange,
  isLeftPanelCollapsed = false,
  onToggleLeftPanel,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null);

  // Maintain local srcDoc state to prevent iframe reload on internal typing
  const [iframeSrcDoc, setIframeSrcDoc] = useState<string | null>(assembledHtml);
  const currentHtmlRef = useRef<string | null>(assembledHtml);

  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isSuperscript: false,
    isSubscript: false,
    isJustifyLeft: false,
    isJustifyCenter: false,
    isJustifyRight: false,
    isJustifyFull: false,
    blockTag: 'p',
    fontSize: '3',
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollPosRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const prevPaperTitleRef = useRef<string | undefined>(paperTitle);

  useEffect(() => {
    if (!isSpinning) return;
    const timer = setTimeout(() => setIsSpinning(false), 600);
    return () => clearTimeout(timer);
  }, [isSpinning]);

  // Reset scroll position if paper changes
  useEffect(() => {
    if (paperTitle !== prevPaperTitleRef.current) {
      prevPaperTitleRef.current = paperTitle;
      scrollPosRef.current = { top: 0, left: 0 };
    }
  }, [paperTitle]);

  // Sync external assembledHtml changes (PDF load, scraper fetch, option changes)
  useEffect(() => {
    if (assembledHtml !== currentHtmlRef.current) {
      currentHtmlRef.current = assembledHtml;
      setIframeSrcDoc(assembledHtml);
    }
  }, [assembledHtml]);

  // Apply editing capability to iframe DOM document
  const setupIframeEditing = useCallback((doc: Document) => {
    const targetEl = doc.querySelector('.galley-article-body') ||
                     doc.querySelector('.galley-container') ||
                     doc.body;

    if (!targetEl) return;

    (targetEl as HTMLElement).contentEditable = 'true';

    // Inject hover/focus helper style into iframe head if not present
    if (!doc.getElementById('galley-edit-styles')) {
      const styleEl = doc.createElement('style');
      styleEl.id = 'galley-edit-styles';
      styleEl.textContent = `
        [contenteditable="true"]:focus { outline: 2px dashed rgba(59, 130, 246, 0.5); outline-offset: 4px; border-radius: 4px; }
        .galley-section:hover, .galley-heading:hover, .galley-paragraph:hover { background: rgba(59, 130, 246, 0.02); }
      `;
      doc.head.appendChild(styleEl);
    }
  }, []);

  // Handle internal typing and DOM editing inside iframe
  const handleDomEvent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    const newHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

    // Save internal edit so useEffect ignores this change for srcDoc updating
    currentHtmlRef.current = newHtml;

    if (onHtmlChange) {
      onHtmlChange(newHtml);
    }

    setToolbarState(getToolbarState(doc));
  }, [onHtmlChange]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    setIframeDoc(doc);

    setupIframeEditing(doc);

    // Restore saved scroll position after iframe reload
    const restoreScroll = () => {
      const { top, left } = scrollPosRef.current;
      if (win && (top > 0 || left > 0)) {
        win.scrollTo({ top, left, behavior: 'instant' });
      }
    };

    restoreScroll();
    requestAnimationFrame(() => {
      restoreScroll();
      requestAnimationFrame(() => restoreScroll());
    });
    setTimeout(restoreScroll, 50);
    setTimeout(restoreScroll, 150);

    const handleScroll = () => {
      if (win && doc) {
        const top = win.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        const left = win.scrollX || doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
        scrollPosRef.current = { top, left };
      }
    };

    const handleInput = () => {
      handleDomEvent();
    };

    const handleSelection = () => {
      setToolbarState(getToolbarState(doc));
    };

    doc.addEventListener('input', handleInput);
    doc.addEventListener('keyup', handleInput);
    doc.addEventListener('selectionchange', handleSelection);
    doc.addEventListener('blur', handleInput, true);

    doc.addEventListener('scroll', handleScroll, { passive: true });
    if (win) {
      win.addEventListener('scroll', handleScroll, { passive: true });
    }
  }, [handleDomEvent, setupIframeEditing]);

  // Ensure iframe editing remains active when iframe document is ready
  useEffect(() => {
    if (iframeDoc) {
      setupIframeEditing(iframeDoc);
    }
  }, [iframeDoc, setupIframeEditing]);

  const handleRefresh = () => {
    scrollPosRef.current = { top: 0, left: 0 };
    setRefreshKey(prev => prev + 1);
    setIsSpinning(true);
    if (onRefresh) {
      onRefresh();
    }
  };

  const getViewportWidth = (): string => {
    switch (viewport) {
      case 'mobile':
        return '390px';
      case 'tablet':
        return '768px';
      case 'desktop':
      default:
        return '100%';
    }
  };

  const getPlaceholderText = (): string => {
    if (!hasPaper && !hasTemplate) {
      return 'Upload a PDF Galley paper and enter a Target Article URL to generate a live preview.';
    }
    if (hasPaper && !hasTemplate) {
      return 'Target Article URL is required to render the live preview. Please enter a URL and click Fetch.';
    }
    if (!hasPaper && hasTemplate) {
      return 'PDF Galley paper is required to render the live preview. Please upload a PDF file.';
    }
    return 'Upload a PDF Galley paper and fetch a target journal URL to generate a live preview.';
  };

  return (
    <div className={styles.sandboxContainer}>
      {/* Upper Control Bar */}
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          {onToggleLeftPanel && (
            <button
              type="button"
              className={`${styles.toggleSidebarBtn} ${isLeftPanelCollapsed ? styles.toggleSidebarBtnHighlight : ''}`}
              onClick={onToggleLeftPanel}
              aria-label={isLeftPanelCollapsed ? 'Expand left toolbar section' : 'Collapse left toolbar section'}
              title={isLeftPanelCollapsed ? 'Expand left toolbar section (⌘[ / Ctrl+[)' : 'Collapse left toolbar section (⌘[ / Ctrl+[)'}
            >
              {isLeftPanelCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {isLeftPanelCollapsed && <span className={styles.toggleBtnLabel}>Show Controls</span>}
            </button>
          )}
          <Eye size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Live Isolated Preview Sandbox</span>
        </div>

        <div className={styles.rightControls}>
          <div className={styles.deviceControls}>
            <button
              className={`${styles.deviceBtn} ${viewport === 'desktop' ? styles.deviceBtnActive : ''}`}
              onClick={() => setViewport('desktop')}
              aria-label="Desktop Viewport Mode"
            >
              <Monitor size={15} /> Desktop
            </button>
            <button
              className={`${styles.deviceBtn} ${viewport === 'tablet' ? styles.deviceBtnActive : ''}`}
              onClick={() => setViewport('tablet')}
              aria-label="Tablet Viewport Mode"
            >
              <Tablet size={15} /> Tablet
            </button>
            <button
              className={`${styles.deviceBtn} ${viewport === 'mobile' ? styles.deviceBtnActive : ''}`}
              onClick={() => setViewport('mobile')}
              aria-label="Mobile Viewport Mode"
            >
              <Smartphone size={15} /> Mobile
            </button>
            {onRefresh && (
              <button
                className={styles.deviceBtn}
                onClick={handleRefresh}
                aria-label="Refresh live preview sandbox"
                title="Refresh preview"
              >
                <RefreshCw size={14} className={isSpinning ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          <ExportControls
            assembledHtml={assembledHtml}
            paperTitle={paperTitle}
          />
        </div>
      </div>

      {/* Rich Text Formatting Toolbar */}
      {assembledHtml && (
        <EditorToolbar
          iframeDoc={iframeDoc}
          toolbarState={toolbarState}
          onResetOriginal={onRefresh}
        />
      )}

      {/* Live Preview Viewport */}
      <div className={styles.frameViewportWrapper}>
        {assembledHtml ? (
          <iframe
            ref={iframeRef}
            key={`${viewport}-${refreshKey}`}
            className={styles.iframe}
            style={{ width: getViewportWidth() }}
            srcDoc={iframeSrcDoc ?? undefined}
            onLoad={handleIframeLoad}
            title="Live Galley Isolated Preview Sandbox"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className={styles.placeholderBox}>
            <Eye size={48} style={{ opacity: 0.3 }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No Galley Rendered Yet
              </div>
              <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {getPlaceholderText()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
