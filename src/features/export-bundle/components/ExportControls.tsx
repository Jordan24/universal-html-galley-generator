import React, { useState } from 'react';
import { Download, FileCode, Archive, Check } from 'lucide-react';
import { downloadSingleFileHtml } from '../services/singleFileExport';
import { downloadZipPackage } from '../services/zipPackageExport';
import styles from './ExportControls.module.css';

interface ExportControlsProps {
  assembledHtml: string | null;
  paperTitle?: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  assembledHtml,
  paperTitle = 'Article Galley',
}) => {
  const [downloadedSingle, setDownloadedSingle] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);

  const handleSingleDownload = () => {
    if (!assembledHtml) return;
    downloadSingleFileHtml(assembledHtml, paperTitle);
    setDownloadedSingle(true);
    setTimeout(() => setDownloadedSingle(false), 3000);
  };

  const handleZipDownload = async () => {
    if (!assembledHtml) return;
    await downloadZipPackage(assembledHtml, paperTitle);
    setDownloadedZip(true);
    setTimeout(() => setDownloadedZip(false), 3000);
  };

  const isDisabled = !assembledHtml;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Download size={22} />
        <span className={styles.title}>Export Galley Package</span>
      </div>

      <div className={styles.buttonGrid}>
        <button
          className={`${styles.exportBtn} ${styles.singleFileBtn}`}
          onClick={handleSingleDownload}
          disabled={isDisabled}
          aria-label="Download Standalone Single-File HTML"
        >
          {downloadedSingle ? <Check size={20} /> : <FileCode size={20} />}
          <span>{downloadedSingle ? 'Downloaded!' : 'Single-File HTML'}</span>
          <span className={styles.btnSubtext}>Inlined Base64 & CSS</span>
        </button>

        <button
          className={`${styles.exportBtn} ${styles.zipBtn}`}
          onClick={handleZipDownload}
          disabled={isDisabled}
          aria-label="Download ZIP Archive Package"
        >
          {downloadedZip ? <Check size={20} style={{ color: 'var(--accent-emerald)' }} /> : <Archive size={20} style={{ color: 'var(--accent-emerald)' }} />}
          <span>{downloadedZip ? 'Downloaded!' : 'ZIP Package'}</span>
          <span className={styles.btnSubtext}>HTML + CSS + Assets</span>
        </button>
      </div>
    </div>
  );
};
