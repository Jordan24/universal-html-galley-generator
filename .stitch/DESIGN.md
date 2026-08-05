# Design System — Universal HTML Galley Generator

> **Brand Identity:** Academic Precision Meets Modern Web Excellence  
> **Target Audience:** Journal Publishers, Managing Editors, Scholars, Open-Access Advocates  
> **Theme:** Adaptive Dark & Light Mode with Academic Sapphire & Glassmorphic Accents  

---

## 1. Design System Tokens (Dual Theme Support)

The application supports both **Dark Mode** (default obsidian slate) and **Light Mode** (clean academic white), respecting user preference via `localStorage` or `prefers-color-scheme`.

### Color Palette

```css
/* Dark Mode Tokens (Default) */
:root, [data-theme="dark"] {
  --bg-base: #0b0f19;
  --bg-surface: #111827;
  --bg-surface-elevated: #1f2937;
  --bg-glass: rgba(17, 24, 39, 0.75);
  --border-glass: rgba(255, 255, 255, 0.08);
  --border-subtle: #374151;
  --border-focus: #3b82f6;

  --accent-primary: #3b82f6;       /* Academic Sapphire */
  --accent-primary-hover: #2563eb;
  --accent-emerald: #10b981;       /* Success & Export Ready */
  --accent-violet: #8b5cf6;        /* Parsing Active */
  --accent-amber: #f59e0b;         /* Warning / Fallback */

  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  
  --shadow-card: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
}

/* Light Mode Tokens */
[data-theme="light"] {
  --bg-base: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #f1f5f9;
  --bg-glass: rgba(255, 255, 255, 0.85);
  --border-glass: rgba(226, 232, 240, 0.8);
  --border-subtle: #cbd5e1;
  --border-focus: #2563eb;

  --accent-primary: #2563eb;       /* Academic Sapphire Light */
  --accent-primary-hover: #1d4ed8;
  --accent-emerald: #059669;       /* Success & Export Ready */
  --accent-violet: #7c3aed;        /* Parsing Active */
  --accent-amber: #d97706;         /* Warning / Fallback */

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;

  --shadow-card: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
}
```

---

## 2. Typography Hierarchy

- **UI & System Font:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Academic Paper Content Font:** `'Merriweather', 'Lora', 'Georgia', serif`
- **Code & Monospace Font:** `'JetBrains Mono', 'Fira Code', monospace`

### Scale
- **H1 (App Header / Title):** `1.875rem (30px)` | Weight: 700 | Line-height: 1.2
- **H2 (Section Headings):** `1.375rem (22px)` | Weight: 600 | Line-height: 1.3
- **H3 (Card Titles):** `1.125rem (18px)` | Weight: 600 | Line-height: 1.4
- **Body UI:** `0.9375rem (15px)` | Weight: 400 | Line-height: 1.5
- **Small / Captions:** `0.8125rem (13px)` | Weight: 400 | Line-height: 1.4

---

## 3. UI Components & Layout Specifications

### Header & Brand Bar
- Glassmorphic top navigation bar (`backdrop-filter: blur(12px)`).
- Left: App Logo Icon (Stylized Academic Scroll + Code Brackets) + Title ("Universal HTML Galley Generator").
- Right: Apache 2.0 Badge, GitHub Link, **Interactive Dark/Light Mode Toggle Switch (Sun/Moon icons)**, CORS Proxy Status indicator pill.

### Dual-Pane Workspace Layout
```
┌───────────────────────────────────────┬──────────────────────────────────────┐
│ LEFT PANEL: CONTROL & INPUT WIZARD    │ RIGHT PANEL: SANDBOXED PREVIEW       │
│                                       │                                      │
│ 1. Drag & Drop PDF Galley Card        │ Live iFrame Preview of Scraped       │
│ 2. Target Journal Article URL Card    │ Journal Page with embedded HTML     │
│ 3. Article Metadata & Footnote Config │ Galley paper body.                   │
│ 4. Single-File / ZIP Export Actions   │ Includes Dark/Light Preview Toggle.  │
└───────────────────────────────────────┴──────────────────────────────────────┘
```

### Interactive State Specifications
- **PDF Dropzone:**
  - Default: Dashed border (`1px dashed var(--border-subtle)`), glass surface.
  - Drag Over: Glowing neon sapphire border (`2px solid var(--accent-primary)`), elevated scale (`transform: scale(1.01)`).
  - File Loaded: Emerald success checkmark, file name, size, page count, and page thumbnail stack.
- **Bidirectional Footnote Anchors:**
  - Text Reference (`<sup role="doc-noteref">`): Sapphire pill background, hover elevation, smooth scroll jump to footnote.
  - Footnote Item (`<li id="fn-1">`): Pulse animation (`:target`) when jumped to, return backlink anchor (`↩`).

---

## 4. Design System Notes for Generation

> **Use the following design block when generating UI screens:**

```markdown
**DESIGN SYSTEM SPECIFICATION (REQUIRED):**
- Dual Theme Support: Adaptive Dark Mode (#0b0f19 background, #111827 glass cards) and Light Mode (#f8fafc background, #ffffff cards) with smooth CSS transition toggle.
- Color Palette: Academic Sapphire (#3b82f6 dark / #2563eb light primary), Emerald (#10b981 dark / #059669 light success), Muted Gray (#9ca3af dark / #475569 light), Glass Surface.
- Typography: Inter for UI controls, Merriweather for article body text preview, JetBrains Mono for HTML code snippets.
- Top Header:
  1. Logo & Title ("Universal HTML Galley Generator").
  2. Apache 2.0 License Badge & GitHub link.
  3. Dark/Light Mode Toggle Switch (Sun ☀️ / Moon 🌙 icons).
- Left Control Panel:
  1. PDF Dropzone card with drag & drop file upload zone.
  2. Journal URL input field with CORS proxy selector dropdown.
  3. Footnote & Heading parsing configuration toggles.
  4. Export Action Buttons (Download Single-File HTML / Download ZIP Archive).
- Right Preview Panel:
  1. Interactive device frame (Desktop / Tablet / Mobile view toggles).
  2. Sandboxed iFrame showing the live journal header/footer template wrapping the reformatted paper body.
  3. Bidirectional footnote anchor jump demonstration.
- Aesthetics: High contrast, smooth rounded corners (border-radius: 12px), subtle hover glows, glass backdrop filters.
```
