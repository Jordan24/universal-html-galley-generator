# AGENTS.md — Universal HTML Galley Generator

> **License:** Apache License 2.0  
> **Platform:** Client-side React Application (Static site hosted on GitHub Pages)  
> **Repository:** [Universal HTML Galley Generator](https://github.com/)  

---

## 1. Project Overview & Mission

**Universal HTML Galley Generator** is an open-source web application designed for academic journal publishers, editors, and scholars. It automates the creation of web-native, responsive HTML Galley files from uploaded PDF papers and embeds them dynamically into the look-and-feel of any existing journal website.

### Key Capabilities
1. **PDF Galley Ingestion:** Client-side parsing of academic PDF files to extract structured text, headings, figures, tables, superscripts, and footnotes.
2. **Website Header & Footer Scraping:** Given a target journal article URL, client-side CORS proxies fetch the live DOM to mirror the journal's CSS stylesheets, header navigation, branding, and footer content.
3. **Automated Web Reformatting:**
   - Converts linear PDF content into responsive HTML body markup.
   - Collects footnotes at the bottom of the article.
   - Generates bidirectional superscript links (jumping from body reference to footnote and back).
4. **Isolated Preview & Dual Export:**
   - Real-time live preview rendered in an isolated sandbox (`iframe` / Shadow DOM) to ensure zero style leakage between app UI and journal UI.
   - **Standalone Single-File HTML Export:** Inlines all styles, scripts, and images (Base64) into a single downloadable HTML file.
   - **ZIP Archive Export:** Bundles structured `index.html`, external CSS stylesheets, and extracted image assets.

---

## 2. Architecture & Domain Concepts

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Universal HTML Galley Generator                      │
├───────────────────────────────┬────────────────────────────────────────┤
│     INPUTS                    │        PROCESSING PIPELINE             │
│                               │                                        │
│  [ Upload PDF Galley ]───────►│  ┌──────────────────────────────────┐  │
│                               │  │ PDF Parser (pdfjs-dist)          │  │
│                               │  │  - Headings & Paragraphs       │  │
│                               │  │  - Superscripts & Footnotes    │  │
│                               │  │  - Image Extraction          │  │
│                               │  └────────────────┬─────────────────┘  │
│                               │                   │                    │
│  [ Journal Page URL ]────────►│  ┌────────────────▼─────────────────┐  │
│                               │  │ Live DOM Scraper (CORS Proxy)    │  │
│                               │  │  - Header & Footer Isolation   │  │
│                               │  │  - CSS & Font Link Mirroring   │  │
│                               │  └────────────────┬─────────────────┘  │
│                               │                   │                    │
│                               │  ┌────────────────▼─────────────────┐  │
│                               │  │ Galley HTML Assembler            │  │
│                               │  │  - Bidirectional Footnote Anchors│  │
│                               │  │  - Template Injection            │  │
│                               │  └────────────────┬─────────────────┘  │
├───────────────────────────────┴───────────────────┼────────────────────┤
│     OUTPUTS                                       │                    │
│                                                   ▼                    │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌─────────┐  │
│  │ Single-File HTML       │   │ ZIP Package            │   │ Live    │  │
│  │ (Inlined Base64 & CSS) │   │ (HTML + CSS + Assets)  │   │ Preview │  │
│  └───────────────────────┘   └────────────────────────┘   └─────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Domain Terminology
- **Galley (HTML Galley):** The final formatted view of an academic paper published on the web, preserving editorial formatting while adjusting dynamically to screen size.
- **Bidirectional Footnote Anchoring:** Linking superscript references (`#fnref-1`) in the text body directly to footnote definitions (`#fn-1`) at the article bottom, and providing a return jump anchor (`^`).
- **Template Wrapper:** The HTML structural skin (header, nav, logo, footer, page CSS) scraped from the journal website URL to frame the converted paper body.
- **CORS Proxy:** A client-side fetch proxy service used to bypass cross-origin browser restrictions when retrieving target journal page HTML and CSS assets.

---

## 3. Technology Stack & Feature-Based Architecture

### Tech Stack
- **Framework:** React 19+ with TypeScript (Strict Mode)
- **Build Tool:** Vite 8+
- **Styling:** Vanilla CSS / CSS Modules (Design tokens, CSS variables, isolated scoping)
- **PDF Engine:** `pdfjs-dist` (PDF.js for client-side text and canvas extraction)
- **ZIP Packaging:** `JSZip` / `file-saver`
- **DOM Parsing:** Native Browser `DOMParser` & `fetch` API via CORS Proxies

### Feature-Based Directory Structure
Code is organized by cohesive feature modules. Each feature encapsulates its own components, logic services, hooks, types, and styles following the Single Responsibility Principle.

```
 universal-html-galley-generator/
 ├── .github/
 │   └── workflows/
 │       └── deploy.yml              # GitHub Pages deployment workflow
 ├── public/
 │   └── favicon.ico
 ├── src/
 │   ├── assets/                     # Branding assets, static icons, fallbacks
 │   ├── features/                   # Feature-based domain modules
 │   │   ├── pdf-ingestion/          # PDF dropzone, text layer parser, figure extractor
 │   │   │   ├── components/
 │   │   │   ├── services/
 │   │   │   └── types/
 │   │   ├── journal-scraper/        # CORS proxy fetcher, DOM scraper, style isolate
 │   │   │   ├── components/
 │   │   │   ├── services/
 │   │   │   └── types/
 │   │   ├── galley-builder/         # HTML assembler, footnote anchoring engine
 │   │   │   ├── components/
 │   │   │   ├── services/
 │   │   │   └── types/
 │   │   ├── preview-sandbox/        # iFrame sandbox previewer, Shadow DOM isolator
 │   │   │   └── components/
 │   │   └── export-bundle/          # Single-file HTML builder, ZIP archive builder
 │   │       ├── components/
 │   │       └── services/
 │   ├── shared/                     # Shared cross-cutting concerns
 │   │   ├── components/             # Reusable UI primitives (Button, Modal, Input)
 │   │   ├── styles/                 # Design tokens (tokens.css) & global resets
 │   │   └── types/                  # Global domain types (Paper, Footnote, Template)
 │   ├── App.tsx
 │   └── main.tsx
 ├── AGENTS.md
 ├── LICENSE                         # Apache-2.0
 ├── package.json
 ├── tsconfig.json
 └── vite.config.ts
```

---

## 4. Development & Engineering Standards

### 1. Single Responsibility Principle (SRP) per File
- **One File, One Responsibility:** Every source file must have a single, well-defined purpose.
- **Separation of Concerns:**
  - React components are strictly presentational and handle user interaction.
  - Complex logic (PDF parsing, DOM scraping, ZIP bundling) must reside in decoupled service modules under `features/<feature-name>/services/`.
- **No Monoliths:** Keep files concise (strictly target under 300 lines of code per file). Split helper functions, TypeScript schemas, and custom hooks into individual single-purpose files.

### 2. Accessibility (a11y) Best Practices
- **W3C Digital Publishing ARIA Roles:**
  - Footnote list container: `<section class="footnotes" role="doc-endnotes">`
  - Footnote reference in text: `<sup id="fnref-1" class="footnote-ref" role="doc-noteref">`
  - Backlink anchor: `<a href="#fnref-1" class="footnote-backref" aria-label="Back to content">↩</a>`
- **Semantic Academic HTML5:** Render body content using semantic tags (`<article>`, `<section>`, `<h1>`-`<h6>`, `<figure>`, `<figcaption>`).
- **Focus & Keyboard Navigation:**
  - Provide visible focus rings for all interactive controls and footnote links.
  - When clicking footnote anchors, manage keyboard focus cleanly to land on target elements (`#fn-1` or `#fnref-1`).
- **Accessible Media & Contrast:**
  - Extracted figures must include mandatory fallback `alt` attributes.
  - Form UI elements must maintain WCAG AAA/AA color contrast ratios.

### 3. Pure Client-Side Execution
- The app must run entirely in the browser without requiring a dedicated backend server.
- All PDF parsing, image extraction, and bundle zipping must happen client-side.
- Network requests are limited to fetching the target URL via configurable CORS proxies.

### 4. Style Isolation & Preview Safety
- The live preview component **must** use an `iframe` (via `srcdoc`) or Shadow DOM to prevent CSS rules from the target journal website from bleeding into the generator UI, and vice versa.

### 5. Bidirectional Footnote Algorithm
- Footnote references in the body text must be rendered as:
  ```html
  <sup id="fnref-1" class="footnote-ref" role="doc-noteref">
    <a href="#fn-1" aria-describedby="footnote-label">1</a>
  </sup>
  ```
- Footnotes list at the bottom must be rendered as:
  ```html
  <section class="footnotes" role="doc-endnotes">
    <ol>
      <li id="fn-1">
        <p>Footnote content text here... 
          <a href="#fnref-1" class="footnote-backref" aria-label="Back to content">↩</a>
        </p>
      </li>
    </ol>
  </section>
  ```

### 6. CORS Proxy Architecture
- Support multiple configurable CORS proxy fallbacks in `features/journal-scraper/services/proxy.ts`:
  1. `https://api.allorigins.win/raw?url=`
  2. Custom user-entered proxy endpoint URL in settings.
- Implement robust error handling and fallbacks if a proxy is blocked or throttled.

### 7. Export Modes
- **Single-File HTML:**
  - Embed extracted CSS styles inside `<style>` tags in `<head>`.
  - Convert extracted images to Base64 data URIs (`data:image/png;base64,...`).
- **ZIP Bundle:**
  - Standard directory layout: `index.html`, `styles/journal.css`, `images/fig1.png`.

---

## 5. Useful Commands for Agents

### Setup & Development
```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run linter
npm run lint

# Build production distribution
npm run build

# Preview production build locally
npm run preview
```

---

## 6. GitHub Pages Deployment (CI/CD)

The application is automatically built and deployed to GitHub Pages via GitHub Actions upon push to the `main` branch.

### Workflow Specification (`.github/workflows/deploy.yml`)
- Trigger: Push to `main` branch.
- Steps:
  1. Checkout codebase.
  2. Setup Node.js (v24+ LTS).
  3. Run `npm ci`.
  4. Run `npm run build` (outputs to `dist/`).
  5. Deploy `dist/` directory to `gh-pages` branch using `actions/deploy-pages`.

---

## 7. Guidelines for AI Agents Modifying This Codebase

1. **Strict TypeScript:** Do not use `any`. Define strong interfaces for parsed PDF node trees, extracted footnotes, and scraped template schemas.
2. **Vanilla CSS & Tokens:** Maintain visual excellence using modern CSS tokens (`tokens.css`), glassmorphism cards, sleek dark/light mode toggles, and responsive layouts. Avoid introducing unneeded heavy utility libraries.
3. **Single Responsibility:** Keep each file focused on a single responsibility and strictly under 300 lines of code; split large service routines or UI components promptly.
4. **Preserve Open Source Integrity:** Ensure all generated output files include the Apache 2.0 license notice header if configured by the user.
5. **No Regressions on Footnote & Accessibility Parsing:** Always verify footnote detection and ARIA accessibility attributes when modifying PDF.js parsing heuristics.
