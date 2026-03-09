## ASCII Lab

ASCII Lab is a **FIGlet-style ASCII art generator** with a modern, terminal-inspired UI, live preview, and flexible export options (TXT, PNG, transparent PNG, and QR links).

### Features

- **FIGlet fonts**: Work with a curated set of popular FIGlet fonts, with keyboard navigation and search.
- **Hash-based state**: Shareable URLs with all settings encoded in the hash (text, font, width, layouts, preview size).
- **Layout controls**: Horizontal/vertical layout modes, automatic or fixed width, and adjustable preview font size.
- **Exports**:
  - Copy raw ASCII to the clipboard.
  - Download `.txt` files.
  - Export PNG or transparent PNG.
  - Generate QR codes that link to a simplified output page (`ascii.html`).
- **Mobile-friendly**: Adaptive controls and bottom action bar for smaller screens.

### Tech stack

- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS (via `@tailwindcss/vite`) with custom CSS
- **ASCII rendering**: `figlet`
- **UI utilities**: `lucide-react`, `motion`, `clsx`, `tailwind-merge`

### Getting started

#### Prerequisites

- Node.js 20+ (recommended)
- npm (comes with Node)

#### Installation

```bash
npm install
```

#### Development

```bash
npm run dev
```

This starts Vite on port `3000` (hosted on `0.0.0.0`), with the app mounted at `/`.
