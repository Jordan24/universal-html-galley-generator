export interface FootnoteItem {
  id: number;
  label: string;
  text: string;
  refAnchorId: string;
  footnoteAnchorId: string;
}

export interface ParsedFigure {
  id: string;
  caption: string;
  dataUrl: string;
  altText: string;
  pageNum?: number;
  fileName?: string;
}

export interface PaperSection {
  heading?: string;
  paragraphs: string[];
}

export interface ParsedPaper {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  title: string;
  authors: string[];
  abstract: string;
  sections: PaperSection[];
  footnotes: FootnoteItem[];
  figures: ParsedFigure[];
  rawText: string;
}

export interface ScrapedTemplate {
  targetUrl: string;
  pageTitle: string;
  headerHtml: string;
  footerHtml: string;
  stylesheets: string[];
  inlineStyles: string[];
  fullPageWrapperHtml?: string;
  isFallbackHeader?: boolean;
  isFallbackFooter?: boolean;
}

export interface CORSProxyOption {
  id: string;
  name: string;
  urlTemplate: string;
  description: string;
}

export type ThemeMode = 'dark' | 'light';
