import React, { useState } from 'react';
import { Globe, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrapedTemplate } from '../../../shared/types/galleyTypes';
import { PROXY_OPTIONS, fetchHtmlViaProxy } from '../services/corsProxy';
import { parseAndSanitizeJournalDom } from '../services/domSanitizer';
import styles from './UrlScraperForm.module.css';

interface UrlScraperFormProps {
  scrapedTemplate: ScrapedTemplate | null;
  onTemplateScraped: (template: ScrapedTemplate | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const STORAGE_KEY_TARGET_URL = 'target_article_url';

export const UrlScraperForm: React.FC<UrlScraperFormProps> = ({
  scrapedTemplate,
  onTemplateScraped,
  isLoading,
  setIsLoading,
}) => {
  const [urlInput, setUrlInput] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TARGET_URL) || '';
    } catch {
      return '';
    }
  });
  const [proxyId, setProxyId] = useState('allorigins');
  const [customProxyUrl, setCustomProxyUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    try {
      localStorage.setItem(STORAGE_KEY_TARGET_URL, value);
    } catch {
      // Ignore storage exceptions (e.g. private browsing restriction)
    }
  };

  const handleFetch = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a valid target journal article URL.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const htmlText = await fetchHtmlViaProxy(urlInput, proxyId, customProxyUrl);
      const parsedTemplate = parseAndSanitizeJournalDom(htmlText, urlInput);
      onTemplateScraped(parsedTemplate);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch journal site HTML via CORS proxy.';
      console.warn('Proxy fetch error:', msg);
      setErrorMessage(`${msg} Try selecting a different CORS proxy option or providing a custom proxy endpoint.`);
      // Produce fallback template matching target URL structure
      const fallback = parseAndSanitizeJournalDom('<html><head><title>Academic Journal Page</title></head><body></body></html>', urlInput);
      onTemplateScraped(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Globe size={22} />
        <span className={styles.title}>Journal Website Template Scraper</span>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="target-journal-url" className={styles.label}>Target Article URL <span style={{ color: '#ef4444' }}>*</span></label>
        <div className={styles.urlInputRow}>
          <input
            id="target-journal-url"
            type="url"
            required
            className={styles.inputField}
            placeholder="https://journal.org/article/123"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          <button
            className={styles.fetchButton}
            onClick={handleFetch}
            disabled={isLoading || !urlInput.trim()}
            aria-label="Fetch target journal styles and template"
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
            {isLoading ? 'Scraping...' : 'Fetch'}
          </button>
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="cors-proxy-select" className={styles.label}>CORS Fetch Proxy</label>
        <select
          id="cors-proxy-select"
          className={styles.selectField}
          value={proxyId}
          onChange={(e) => setProxyId(e.target.value)}
        >
          {PROXY_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {proxyId === 'custom' && (
        <div className={styles.inputGroup}>
          <label htmlFor="custom-proxy-url" className={styles.label}>Custom Proxy URL (use {"{url}"} placeholder)</label>
          <input
            id="custom-proxy-url"
            type="text"
            className={styles.inputField}
            placeholder="https://my-proxy.com/?url="
            value={customProxyUrl}
            onChange={(e) => setCustomProxyUrl(e.target.value)}
          />
        </div>
      )}

      {errorMessage && (
        <div className={styles.statusCard} style={{ borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#ef4444', fontWeight: 600 }}>CORS Proxy Error</div>
            <div className={styles.statusDetail}>{errorMessage}</div>
          </div>
        </div>
      )}

      {scrapedTemplate && (
        <div className={styles.statusCard}>
          <CheckCircle2 size={20} className={styles.statusSuccess} />
          <div>
            <div className={styles.statusSuccess}>
              {scrapedTemplate.isFallbackHeader ? 'Fallback Journal Skin Active' : 'Journal Template Isolated'}
            </div>
            <div className={styles.statusDetail}>
              {scrapedTemplate.stylesheets.length} CSS link(s) • Scraped from {new URL(scrapedTemplate.targetUrl).hostname}
              {scrapedTemplate.isFallbackHeader && ' (Generic fallback header used)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
