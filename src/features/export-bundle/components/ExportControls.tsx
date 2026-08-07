import React, { useState } from 'react';
import { FileCode, Archive, Check } from 'lucide-react';
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
    <div className={styles.exportGroup}>
      <button
        className={`${styles.exportBtn} ${styles.singleFileBtn}`}
        onClick={handleSingleDownload}
        disabled={isDisabled}
        aria-label="Download Standalone Single-File HTML"
        title="Download Single-File HTML (Inlined Base64 & CSS)"
      >
        {downloadedSingle ? <Check size={14} /> : <FileCode size={14} />}
        <span>{downloadedSingle ? 'Downloaded!' : 'Single-File HTML'}</span>
      </button>

      <button
        className={`${styles.exportBtn} ${styles.zipBtn}`}
        onClick={handleZipDownload}
        disabled={isDisabled}
        aria-label="Download ZIP Archive Package"
        title="Download ZIP Package (HTML + CSS + Assets)"
      >
        {downloadedZip ? <Check size={14} /> : <Archive size={14} />}
        <span>{downloadedZip ? 'Downloaded!' : 'ZIP Package'}</span>
      </button>
    </div>
  );
};

