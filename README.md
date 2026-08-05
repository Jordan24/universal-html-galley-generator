# Universal HTML Galley Generator

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

**Universal HTML Galley Generator** is an open-source, client-side web application designed for academic journal publishers, managing editors, and scholarly open-access advocates. It automates the creation of web-native, accessible, and responsive HTML Galley files from uploaded PDF papers and embeds them dynamically into the look-and-feel of any target journal website.

---

## 📖 Table of Contents

- [Key Capabilities](#-key-capabilities)
- [Architecture & Processing Pipeline](#-architecture--processing-pipeline)
- [Domain Concepts](#-domain-concepts)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Accessibility & Standards](#-accessibility--standards)
- [Export Formats](#-export-formats)
- [License](#-license)

---

## ✨ Key Capabilities

1. **Client-Side PDF Galley Ingestion:**
   - Text layer, heading hierarchy, figures, and inline styling extraction using PDF.js (`pdfjs-dist`).
   - Automated superscript reference and footnote recognition.

2. **Live DOM Scraper & Style Isolation:**
   - Scrapes header, navigation, branding, and footer markup from any live journal article URL via configurable client-side CORS proxies.
   - Mirrors target journal CSS stylesheets while maintaining complete UI isolation.

3. **Automated Academic Web Reformatting:**
   - Transforms unstructured PDF text blocks into clean, semantic HTML5 markup (`<article>`, `<section>`, `<figure>`, `<h1>`-`<h6>`).
   - Generates accessible, bidirectional footnote reference links jumping seamlessly between inline text superscripts (`#fnref-1`) and footnote definitions (`#fn-1`).

4. **Isolated Sandboxed Preview:**
   - Live iframe preview rendered via `srcdoc` to prevent target site CSS leakage into the generator workbench UI.
   - Interactive screen width toggles (Desktop, Tablet, Mobile views) and theme switches.

5. **Dual Export Formats:**
   - **Single-File HTML:** Self-contained file with inlined CSS and Base64-encoded image assets (`data:image/png;base64,...`).
   - **ZIP Archive:** Production-ready web package bundled with `index.html`, external CSS stylesheets, and extracted image assets.

---

## 🏗️ Architecture & Processing Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Universal HTML Galley Generator                      │
├───────────────────────────────┬────────────────────────────────────────┤
│     INPUTS                    │        PROCESSING PIPELINE             │
│                               │                                        │
│  [ Upload PDF Galley ]───────►│  ┌──────────────────────────────────┐  │
│                               │  │ PDF Parser (pdfjs-dist)          │  │
│                               │  │  - Headings & Paragraphs         │  │
│                               │  │  - Superscripts & Footnotes      │  │
│                               │  │  - Image & Figure Extraction     │  │
│                               │  └────────────────┬─────────────────┘  │
│                               │                   │                    │
│  [ Journal Page URL ]────────►│  ┌────────────────▼─────────────────┐  │
│                               │  │ Live DOM Scraper (CORS Proxy)    │  │
│                               │  │  - Header & Footer Isolation     │  │
│                               │  │  - CSS & Font Link Mirroring     │  │
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
│  │ Single-File HTML      │   │ ZIP Package            │   │ Live    │  │
│  │ (Inlined Base64 & CSS)│   │ (HTML + CSS + Assets)  │   │ Preview │  │
│  └───────────────────────┘   └────────────────────────┘   └─────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Domain Concepts

- **Galley (HTML Galley):** The final formatted web view of an academic paper published alongside PDF/EPUB downloads, enabling responsive reading on desktop and mobile browsers.
- **Bidirectional Footnote Anchoring:** Deep linking between superscript text citations (`#fnref-N`) and endnotes (`#fn-N`) at the bottom of the article, equipped with smooth scrolling and backlink return anchors (`↩`).
- **Template Wrapper:** The scraped header, navigation bar, logo, and footer structural skin fetched from the journal website URL to frame the generated paper body.
- **CORS Proxy:** A client-side fetch proxy service used to bypass cross-origin browser restrictions when retrieving external target journal page HTML and CSS stylesheets.

---

## 🛠️ Technology Stack

- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite 6
- **Styling:** Vanilla CSS with Design System CSS Variables (`tokens.css`, adaptive dark & light themes)
- **PDF Engine:** `pdfjs-dist` (Mozilla PDF.js client-side text and canvas parser)
- **Archive Generator:** `jszip` & `file-saver`
- **Iconography:** `lucide-react`
- **DOM Parsing:** Native Browser `DOMParser` & fetch API with proxy failover

---

## 📁 Directory Structure

```
universal-html-galley-generator/
 ├── .github/
 │   └── workflows/
 │       └── deploy.yml              # GitHub Pages CI/CD workflow
 ├── public/
 │   └── favicon.ico
 ├── src/
 │   ├── assets/                     # Static branding assets and icons
 │   ├── features/                   # Feature-based domain modules
 │   │   ├── pdf-ingestion/          # PDF dropzone, text layer parser & extractor
 │   │   ├── journal-scraper/        # CORS proxy fetcher & DOM template scraper
 │   │   ├── galley-builder/         # HTML assembler & footnote anchoring engine
 │   │   ├── preview-sandbox/        # iFrame sandbox preview component
 │   │   └── export-bundle/          # Single-file HTML & ZIP archive builder
 │   ├── shared/                     # Reusable UI primitives, styles & types
 │   │   ├── components/             # Button, Modal, Input, Badge components
 │   │   ├── styles/                 # Design tokens (tokens.css) & CSS resets
 │   │   └── types/                  # Shared domain TypeScript interfaces
 │   ├── App.tsx                     # Main application entry layout
 │   ├── main.tsx                    # React DOM root entry point
 │   └── App.module.css
 ├── AGENTS.md                       # Developer & AI agent specifications
 ├── LICENSE                         # Apache-2.0 License
 ├── package.json
 ├── tsconfig.json
 └── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/universal-html-galley-generator.git
   cd universal-html-galley-generator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

   Open your browser at `http://localhost:5173`.

### Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with HMR |
| `npm run build` | Compiles TypeScript and builds production distribution in `dist/` |
| `npm run typecheck` | Runs TypeScript static type analysis without emitting code |
| `npm run lint` | Performs code syntax and type checks |
| `npm run preview` | Serves the production build locally for verification |

---

## ♿ Accessibility & Standards

This generator strictly complies with W3C Digital Publishing ARIA roles and Web Content Accessibility Guidelines (WCAG 2.1 AA):

- **Footnote Section Container:** `<section class="footnotes" role="doc-endnotes">`
- **Inline Text Reference:** `<sup id="fnref-1" class="footnote-ref" role="doc-noteref">`
- **Footnote Backlink:** `<a href="#fnref-1" class="footnote-backref" aria-label="Back to content">↩</a>`
- **Semantic HTML5:** Renders body content using semantic academic tags (`<article>`, `<section>`, `<figure>`, `<figcaption>`).
- **Focus Management & Contrast:** Full keyboard navigation support and high contrast color tokens across dark and light themes.

---

## 📦 Export Formats

### 1. Single-File HTML (`.html`)

Generates a portable, standalone HTML file that contains:

- Internal `<style>` block combining scraped journal CSS and article layout styling.
- Base64 data URIs for all extracted figure images.
- Complete bidirectional footnote markup and meta tags.

### 2. ZIP Package (`.zip`)

Produces a structured archive suitable for web hosting platforms:

```
article-galley.zip
├── index.html
├── styles/
│   └── journal-template.css
└── images/
    ├── figure-1.png
    └── figure-2.jpg
```

---

## Support

If you find this tool helpful, feel free to [buy me a coffee](https://buymeacoffee.com/thejambers) ☕️.

## 📄 License

Distributed under the **Apache License 2.0**. See [`LICENSE`](./LICENSE) for more details.
