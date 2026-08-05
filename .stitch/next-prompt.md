---
page: index
---
Main Split-Pane Workspace & Galley Generator Dashboard for Universal HTML Galley Generator.

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

**Page Structure:**
1. Top Navigation Bar with app logo, GitHub link, Apache 2.0 badge, and Theme Toggle Switch (Sun/Moon).
2. Left Input & Control Wizard column (Upload PDF, Target URL, Metadata, Export buttons).
3. Right Live Preview column (iFrame Sandbox with Viewport Toggles and Zoom Controls).
