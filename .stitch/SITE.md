# Universal HTML Galley Generator — Site Roadmap & Sitemap

## 1. Site Vision
Universal HTML Galley Generator is an open-source web application for academic publishers and scholars. It transforms PDF papers into responsive HTML Galley files and dynamically embeds them into existing journal website templates via client-side scraping.

---

## 2. Core Features & Capabilities
- **PDF Drag & Drop Ingestion:** Client-side parsing of headings, paragraphs, superscripts, footnotes, and figures via `pdfjs-dist`.
- **Live Journal DOM Scraping:** CORS proxy DOM fetching to extract headers, footers, stylesheets, and branding from live journal article URLs.
- **Bidirectional Footnote Linking:** Automatic superscript anchor navigation between body references and footnote definitions.
- **Isolated iFrame Sandbox Preview:** Zero CSS leakage between generator application UI and journal styling.
- **Dual Export:** Standalone single-file HTML (Base64 images) and structured ZIP package exports.

---

## 3. Sitemap
- [ ] `index` — Main Split-Pane Workspace & Galley Generator Dashboard
- [ ] `preview` — Standalone Sandboxed Galley Preview & Inspection Mode
- [ ] `docs` — Open Source API Guide, CORS Proxy Setup & Usage Instructions

---

## 4. Roadmap & Task Backlog
- [x] **Task 1: Project Setup & Guidelines (`AGENTS.md`)**
- [x] **Task 2: Design System Specification (`design.md` & `.stitch/DESIGN.md`)**
- [ ] **Task 3: Main Dashboard UI Implementation (`index.html` / `App.tsx`)**
- [ ] **Task 4: PDF Ingestion Engine & Dropzone Component**
- [ ] **Task 5: CORS Proxy & DOM Template Scraping Service**
- [ ] **Task 6: Galley HTML Assembler & Footnote Linking Engine**
- [ ] **Task 7: iFrame Preview Sandbox & Dual Export Module**

---

## 5. Creative Freedom & Future Page Concepts
- Custom Journal Template Preset Gallery (Pre-configured CSS/header/footer templates for OJS, PKP, HighWire, and JSor journals).
- Batch PDF Galley Processor mode for whole issue publishing.
- Footnote & Reference Citation Inspector tool.
