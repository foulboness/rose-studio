# Rose Studio

> **A retro-futuristic, web-based image generator for creating halftone duotone poster art.**  

---

## Features

- Instant Duotone Engine:** Apply custom dual-tone color gradients to any uploaded image.
- Halftone & CRT FX:** Customizable halftone dot overlays, CRT scanlines, grain, and radial vignette.
- Cyberpunk Typography:** Render styled title and subtitle overlays with adjustable RGB glitch distortion.
- Fully Responsive:** Dedicated mobile navigation toggle for seamless switching between preview and control sidebars.
- Preset Swatches:** Quick-select color palettes (Rose, Velvet, Sunset, Amethyst, and Noir presets).
- PNG Export:** Download high-resolution PNGs directly from your browser canvas.

---

## Tech Stack

- **Framework:** React + Vite / Next.js
- **Styling:** Tailwind CSS + Lucide React (Icons)
- **Rendering:** HTML5 Canvas API (Custom Duotone & Halftone Algorithms)
- **Typography:** Manrope & JetBrains Mono (via Google Fonts)

---

## Quick Start

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) (v16+) installed on your system.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone [https://github.com/your-foulboness/rose-studio.git]
cd rose-studio
npm install lucide-react

```

### 3. Run Development Server

```bash
npm run dev

```

Open `http://localhost:5173` in your browser to view the app.

---

## Adding Custom Color Presets

You can add or modify color presets inside `RoseStudio.jsx` under the `PRESETS` array:

```javascript
const PRESETS = [
  { name: "Rose Glass", shadow: "#1a0b12", highlight: "#ff7eb6" },
  { name: "Lavender Dream", shadow: "#120d20", highlight: "#c084fc" },
  // Add your custom hex tones here...
];

```

---

## Mobile Layout Breakdown

| View | Mode | Description |
| --- | --- | --- |
| **Controls Tab** | Mobile | Adjust image settings, halftone size, grain, duotone swatches, and typography. |
| **Preview Tab** | Mobile | Full-screen view of the rendered canvas with framing brackets. |
| **Split View** | Desktop | Side-by-side control sidebar and live reactive canvas. |

---

## License

Distributed under the **MIT License**. Feel free to use, modify, and integrate it into your own creative projects!
