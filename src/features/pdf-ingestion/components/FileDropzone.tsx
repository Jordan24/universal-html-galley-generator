import React, { useState, useRef } from 'react';
import { Upload, FileCheck, FileText, RefreshCw } from 'lucide-react';
import { ParsedPaper } from '../../../shared/types/galleyTypes';
import { parsePdfGalleyFile } from '../services/pdfParser';
import styles from './FileDropzone.module.css';

interface FileDropzoneProps {
  parsedPaper: ParsedPaper | null;
  onPaperParsed: (paper: ParsedPaper | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  parsedPaper,
  onPaperParsed,
  isLoading,
  setIsLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid PDF paper Galley file.');
      return;
    }

    setIsLoading(true);
    try {
      const parsed = await parsePdfGalleyFile(file);
      onPaperParsed(parsed);
    } catch (err) {
      console.error('Failed to parse PDF file:', err);
      alert('Could not parse the PDF file. Please ensure it is a valid document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (parsedPaper) {
    const formattedSize = (parsedPaper.fileSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (
      <div
        className={`${styles.dropzoneContainer} ${styles.fileUploadedContainer} ${isDragOver ? styles.dropzoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className={styles.fileInput}
          onChange={handleInputChange}
        />
        <div className={styles.dropzoneContent}>
          <div className={styles.successIconWrapper}>
            <FileCheck size={24} />
          </div>
          <div className={styles.fileInfoGroup}>
            <div className={styles.fileName} title={parsedPaper.fileName}>
              {parsedPaper.fileName}
            </div>
            <div className={styles.fileMeta}>
              <span>{formattedSize}</span>
              <span className={styles.metaDot}>•</span>
              <span>{parsedPaper.pageCount} Page(s)</span>
              <span className={styles.metaDot}>•</span>
              <span>{parsedPaper.footnotes.length} Footnote(s)</span>
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.replaceButton}
              onClick={() => fileInputRef.current?.click()}
              title="Select a different PDF file"
            >
              <RefreshCw size={13} />
              <span>Replace PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropzoneContainer} ${isDragOver ? styles.dropzoneActive : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload academic PDF Galley file"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          fileInputRef.current?.click();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className={styles.fileInput}
        onChange={handleInputChange}
      />
      <div className={styles.dropzoneContent}>
        <div className={styles.iconWrapper}>
          {isLoading ? <FileText size={24} className="animate-spin" /> : <Upload size={24} />}
        </div>
        <div className={styles.title}>
          {isLoading ? 'Parsing PDF Galley Structure...' : 'Upload or Drag & Drop PDF Galley'}
        </div>
        <div className={styles.subtitle}>
          Extracts structured text, headings, superscripts, and footnotes client-side
        </div>
      </div>
    </div>
  );
};

