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
  dataUrls?: string[];
  altText: string;
  pageNum?: number;
  fileName?: string;
}

export interface ParagraphItem {
  text: string;
  isBlockQuote?: boolean;
}

export interface PaperSection {
  heading?: string;
  paragraphs: ParagraphItem[];
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

export type TextAlignmentOption = 'justify' | 'left';
export type FontFamilyOption = 'serif' | 'sans-serif' | 'inherit';
export type LineHeightOption = 'compact' | 'comfortable' | 'loose';
export type HeadingNumberingOption = 'none' | 'decimal' | 'roman';
export type HeadingTransformOption = 'none' | 'uppercase';
export type FootnoteStyleOption = 'bottom-endnotes' | 'popover';
export type AbstractStyleOption = 'standard' | 'card';
export type ContainerWidthOption = 'narrow' | 'standard' | 'wide';

export interface GalleyDisplayOptions {
  // Card 1: Header & Visibility
  showTitleInBody: boolean;
  showAuthorsInBody: boolean;
  showAbstractInBody: boolean;

  // Card 2: Typography & Alignment
  textAlign: TextAlignmentOption;
  fontFamily: FontFamilyOption;
  lineHeight: LineHeightOption;

  // Card 3: Headings & Hierarchy
  headingNumbering: HeadingNumberingOption;
  headingTransform: HeadingTransformOption;

  // Card 4: Footnote & References
  footnoteStyle: FootnoteStyleOption;

  // Card 5: Abstract Presentation
  abstractStyle: AbstractStyleOption;
  abstractCardColor?: string;

  // Card 6: Reading Container Width
  containerWidth: ContainerWidthOption;
}


