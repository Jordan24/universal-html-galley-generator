import React, { useState, useEffect } from 'react';
import { Header } from './shared/components/Header';
import { ParsedPaper, ScrapedTemplate, ThemeMode, GalleyDisplayOptions } from './shared/types/galleyTypes';
import { FileDropzone } from './features/pdf-ingestion/components/FileDropzone';
import { UrlScraperForm } from './features/journal-scraper/components/UrlScraperForm';
import { assembleGalleyHtml } from './features/galley-builder/services/galleyAssembler';
import { GalleyOptionsControls } from './features/galley-builder/components/GalleyOptionsControls';
import { PreviewSandbox } from './features/preview-sandbox/components/PreviewSandbox';
import styles from './App.module.css';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });
  const [parsedPaper, setParsedPaper] = useState<ParsedPaper | null>(null);
  const [scrapedTemplate, setScrapedTemplate] = useState<ScrapedTemplate | null>(null);
  const [assembledHtml, setAssembledHtml] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isScraperLoading, setIsScraperLoading] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('galley_left_panel_collapsed') === 'true';
  });
  const [galleyOptions, setGalleyOptions] = useState<GalleyDisplayOptions>({
    showTitleInBody: true,
    showAuthorsInBody: true,
    showAbstractInBody: true,
    textAlign: 'justify',
    fontFamily: 'serif',
    lineHeight: 'comfortable',
    headingNumbering: 'none',
    headingTransform: 'none',
    footnoteStyle: 'bottom-endnotes',
    abstractStyle: 'standard',
    abstractCardColor: '#3b82f6',
    containerWidth: 'standard',
  });

  const handleToggleLeftPanel = () => {
    setIsLeftPanelCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('galley_left_panel_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut listener (Cmd+[ or Ctrl+[) to toggle left toolbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        handleToggleLeftPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keep DOM attribute in sync with theme state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen to system color scheme changes if the user hasn't explicitly set a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Toggle Theme and save preference
  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Re-assemble Galley HTML whenever paper, template, or options update
  useEffect(() => {
    if (parsedPaper) {
      const html = assembleGalleyHtml(parsedPaper, scrapedTemplate, galleyOptions);
      setAssembledHtml(html);
      setHasEdits(false); // Reset edits when base parameters change
    } else {
      setAssembledHtml(null);
      setHasEdits(false);
    }
  }, [parsedPaper, scrapedTemplate, galleyOptions]);

  return (
    <>
      <Header theme={theme} onToggleTheme={handleToggleTheme} />

      <main className={`${styles.mainLayout} ${isLeftPanelCollapsed ? styles.mainLayoutCollapsed : ''}`}>
        {/* Left Column: Input Wizard Controls */}
        <section
          className={`${styles.leftControlColumn} ${isLeftPanelCollapsed ? styles.leftControlColumnCollapsed : ''}`}
          aria-label="Galley Generation Wizard Controls"
          aria-hidden={isLeftPanelCollapsed}
        >
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
            hasEdits={hasEdits}
          />

          <GalleyOptionsControls
            options={galleyOptions}
            onOptionsChange={setGalleyOptions}
          />
        </section>

        {/* Right Column: Live Isolated Preview Sandbox */}
        <section className={styles.rightPreviewColumn} aria-label="Live Galley Preview Sandbox">
          <PreviewSandbox
            assembledHtml={assembledHtml}
            paperTitle={parsedPaper?.title}
            hasPaper={Boolean(parsedPaper)}
            hasTemplate={Boolean(scrapedTemplate)}
            onHtmlChange={(updatedHtml) => {
              setAssembledHtml(updatedHtml);
              setHasEdits(true);
            }}
            onRefresh={() => {
              if (parsedPaper) {
                setAssembledHtml(assembleGalleyHtml(parsedPaper, scrapedTemplate, galleyOptions));
                setHasEdits(false);
              }
            }}
            isLeftPanelCollapsed={isLeftPanelCollapsed}
            onToggleLeftPanel={handleToggleLeftPanel}
          />
        </section>
      </main>
    </>
  );
};

export default App;
