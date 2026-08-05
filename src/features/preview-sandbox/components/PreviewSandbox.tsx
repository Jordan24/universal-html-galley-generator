import React, { useState } from 'react';
import { Eye, Monitor, Tablet, Smartphone, ShieldCheck, RefreshCw } from 'lucide-react';
import styles from './PreviewSandbox.module.css';

interface PreviewSandboxProps {
  assembledHtml: string | null;
  hasPaper?: boolean;
  hasTemplate?: boolean;
  onRefresh?: () => void;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const PreviewSandbox: React.FC<PreviewSandboxProps> = ({
  assembledHtml,
  hasPaper = false,
  hasTemplate = false,
  onRefresh,
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');

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
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <Eye size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Live Isolated Preview Sandbox</span>
          <span style={{ fontSize: '0.725rem', opacity: 0.7, marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)' }} /> Zero CSS Leakage
          </span>
        </div>

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
              onClick={onRefresh}
              aria-label="Refresh live preview sandbox"
              title="Refresh preview"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.frameViewportWrapper}>
        {assembledHtml ? (
          <iframe
            key={viewport}
            className={styles.iframe}
            style={{ width: getViewportWidth() }}
            srcDoc={assembledHtml}
            title="Live Galley Isolated Preview Sandbox"
            sandbox="allow-same-origin allow-scripts allow-popups"
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
