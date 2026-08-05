import React, { useState, useEffect } from 'react';
import { Header } from './shared/components/Header';
import { ParsedPaper, ScrapedTemplate, ThemeMode } from './shared/types/galleyTypes';
import { FileDropzone } from './features/pdf-ingestion/components/FileDropzone';
import { UrlScraperForm } from './features/journal-scraper/components/UrlScraperForm';
import { assembleGalleyHtml } from './features/galley-builder/services/galleyAssembler';
import { PreviewSandbox } from './features/preview-sandbox/components/PreviewSandbox';
import { ExportControls } from './features/export-bundle/components/ExportControls';
import styles from './App.module.css';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [parsedPaper, setParsedPaper] = useState<ParsedPaper | null>(null);
  const [scrapedTemplate, setScrapedTemplate] = useState<ScrapedTemplate | null>(null);
  const [assembledHtml, setAssembledHtml] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isScraperLoading, setIsScraperLoading] = useState(false);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Re-assemble Galley HTML whenever paper and template update
  useEffect(() => {
    if (parsedPaper) {
      const html = assembleGalleyHtml(parsedPaper, scrapedTemplate);
      setAssembledHtml(html);
    } else {
      setAssembledHtml(null);
    }
  }, [parsedPaper, scrapedTemplate]);

  return (
    <>
      <Header theme={theme} onToggleTheme={handleToggleTheme} />

      <main className={styles.mainLayout}>
        {/* Left Column: Input Wizard & Export Controls */}
        <section className={styles.leftControlColumn} aria-label="Galley Generation Wizard Controls">
          <FileDropzone
            parsedPaper={parsedPaper}
            onPaperParsed={setParsedPaper}
            isLoading={isPdfLoading}
            setIsLoading={setIsPdfLoading}
          />

          <UrlScraperForm
            scrapedTemplate={scrapedTemplate}
            onTemplateScraped={setScrapedTemplate}
            isLoading={isScraperLoading}
            setIsLoading={setIsScraperLoading}
          />

          <ExportControls
            assembledHtml={assembledHtml}
            paperTitle={parsedPaper?.title}
          />
        </section>

        {/* Right Column: Live Isolated Preview Sandbox */}
        <section className={styles.rightPreviewColumn} aria-label="Live Galley Preview Sandbox">
          <PreviewSandbox
            assembledHtml={assembledHtml}
            hasPaper={Boolean(parsedPaper)}
            hasTemplate={Boolean(scrapedTemplate)}
            onRefresh={() => {
              if (parsedPaper) {
                setAssembledHtml(assembleGalleyHtml(parsedPaper, scrapedTemplate));
              }
            }}
          />
        </section>
      </main>
    </>
  );
};

export default App;
