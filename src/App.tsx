import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Shuffle, ImageOff, Zap, Sliders, Eye } from "lucide-react";

const PRESETS = [
  // Pink / Rose
  { name: "Rose Glass", shadow: "#1a0b12", highlight: "#ff7eb6" },
  { name: "Velvet Rose", shadow: "#120812", highlight: "#e879a8" },
  { name: "Cotton Candy", shadow: "#24101d", highlight: "#ffc1d9" },
  { name: "Cherry Blossom", shadow: "#1f0c16", highlight: "#f9a8d4" },
  { name: "Berry Noir", shadow: "#160812", highlight: "#f472b6" },

  // Purple / Dreamy
  { name: "Lavender Dream", shadow: "#120d20", highlight: "#c084fc" },
  { name: "Moon Orchid", shadow: "#0f0b18", highlight: "#d8b4fe" },
  { name: "Amethyst Glow", shadow: "#180d25", highlight: "#a78bfa" },
  { name: "Purple Haze", shadow: "#10051c", highlight: "#e879f9" },

  // Warm tones
  { name: "Peach Glow", shadow: "#21100b", highlight: "#ffb4a2" },
  { name: "Sunset Bloom", shadow: "#1f0d08", highlight: "#fb7185" },
  { name: "Champagne Pink", shadow: "#1c1210", highlight: "#f9a8d4" },
  { name: "Golden Rose", shadow: "#1b1208", highlight: "#fbbf24" },

  // Cool elegant
  { name: "Frozen Pearl", shadow: "#0c1118", highlight: "#f0f9ff" },
  { name: "Ocean Mist", shadow: "#07131a", highlight: "#a5f3fc" },
  { name: "Mint Velvet", shadow: "#071612", highlight: "#ccfbf1" },
  { name: "Crystal Blue", shadow: "#081426", highlight: "#bfdbfe" },

  // Dark luxury
  { name: "Obsidian Bloom", shadow: "#050505", highlight: "#ffffff" },
  { name: "Black Cherry", shadow: "#0b0508", highlight: "#be123c" },
  { name: "Midnight Rose", shadow: "#0d0710", highlight: "#fb7185" },
  { name: "Silver Noir", shadow: "#111111", highlight: "#d4d4d8" },
];

const FORMATS = [
  { id: "original", label: "Source" },
  { id: "portrait", label: "Portrait 2:3" },
  { id: "square", label: "Square 1:1" },
  { id: "landscape", label: "Wide 3:2" },
];

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawImageCover(ctx, img, cw, ch) {
  const ir = img.width / img.height;
  const cr = cw / ch;
  let sx, sy, sw, sh;
  if (ir > cr) {
    sh = img.height;
    sw = sh * cr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / cr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

export default function PixelBloomStudio() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [img, setImg] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("controls"); // Mobile view toggle: 'controls' | 'preview'

  const [format, setFormat] = useState("portrait");
  const [shadowColor, setShadowColor] = useState("#120812");
  const [highlightColor, setHighlightColor] = useState("#e879a8");

  const [halftoneOn, setHalftoneOn] = useState(true);
  const [dotSize, setDotSize] = useState(7);
  const [halftoneOpacity, setHalftoneOpacity] = useState(45);

  const [grain, setGrain] = useState(20);
  const [scanlines, setScanlines] = useState(true);
  const [vignette, setVignette] = useState(true);

  const [titleText, setTitleText] = useState("ROSE NOIR");
  const [subText, setSubText] = useState("LIMITED EDITION · STUDIO ARCHIVE");
  const [textSize, setTextSize] = useState(64);
  const [glitchAmt, setGlitchAmt] = useState(10);

  const [seed, setSeed] = useState(7);
  const [ready, setReady] = useState(false);

  const handleFiles = useCallback((files) => {
    const file = files && files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        setReady(true);
      };
      image.src = e.target.result as string
    };
    setFileName(file.name);
    reader.readAsDataURL(file);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");

    const MAX = 1000;
    let cw, ch;
    if (format === "original") {
      const ratio = img.width / img.height;
      if (ratio >= 1) {
        cw = MAX;
        ch = Math.round(MAX / ratio);
      } else {
        ch = MAX;
        cw = Math.round(MAX * ratio);
      }
    } else if (format === "portrait") {
      cw = 800;
      ch = 1200;
    } else if (format === "square") {
      cw = 950;
      ch = 950;
    } else {
      cw = 1200;
      ch = 800;
    }
    canvas.width = cw;
    canvas.height = ch;

    const rand = mulberry32(seed * 9301 + 49297);

    // 1. draw source image
    drawImageCover(ctx, img, cw, ch);

    // 2. duotone mapping
    const shadow = hexToRgb(shadowColor);
    const highlight = hexToRgb(highlightColor);
    const imageData = ctx.getImageData(0, 0, cw, ch);
    const data = imageData.data;
    const lumBuffer = new Uint8ClampedArray(cw * ch);
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const t = lum / 255;
      data[i] = shadow.r + (highlight.r - shadow.r) * t;
      data[i + 1] = shadow.g + (highlight.g - shadow.g) * t;
      data[i + 2] = shadow.b + (highlight.b - shadow.b) * t;
      lumBuffer[i / 4] = lum;
    }
    ctx.putImageData(imageData, 0, 0);

    // 3. halftone dot overlay
    if (halftoneOn) {
      const step = Math.max(3, dotSize);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = halftoneOpacity / 100;
      ctx.fillStyle = highlightColor;
      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          const idx = Math.min(cw - 1, x) + Math.min(ch - 1, y) * cw;
          const lum = lumBuffer[idx] || 0;
          const darkness = 1 - lum / 255;
          const r = (step / 2) * darkness * 1.15;
          if (r < 0.4) continue;
          ctx.beginPath();
          ctx.arc(x + step / 2, y + step / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 4. grain
    if (grain > 0) {
      const gd = ctx.getImageData(0, 0, cw, ch);
      const gArr = gd.data;
      const amt = grain * 1.4;
      for (let i = 0; i < gArr.length; i += 4) {
        const n = (rand() - 0.5) * amt;
        gArr[i] += n;
        gArr[i + 1] += n * (0.6 + rand() * 0.6);
        gArr[i + 2] += n * (0.6 + rand() * 0.6);
      }
      ctx.putImageData(gd, 0, 0);
    }

    // 5. glitch slices
    if (glitchAmt > 0) {
      const sliceCount = Math.round(glitchAmt / 8);
      for (let s = 0; s < sliceCount; s++) {
        const y = Math.floor(rand() * ch);
        const h = 4 + Math.floor(rand() * 18);
        const shift = Math.round((rand() - 0.5) * (glitchAmt * 1.2));
        ctx.drawImage(canvas, 0, y, cw, h, shift, y, cw, h);
      }
    }

    // 6. title text
    if (titleText.trim()) {
      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      const cx = cw / 2;
      const ty = ch * 0.86;

      ctx.font = `700 ${textSize}px "Manrope", sans-serif`;

      const offset = Math.max(1, glitchAmt / 14);

      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,126,182,0.75)";
      ctx.fillText(titleText.toUpperCase(), cx - offset, ty);

      ctx.fillStyle = "rgba(232,121,249,0.65)";
      ctx.fillText(titleText.toUpperCase(), cx + offset, ty);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(255,245,250,0.95)";
      ctx.fillText(titleText.toUpperCase(), cx, ty);

      if (subText.trim()) {
        ctx.font = `400 ${Math.round(textSize * 0.28)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = highlightColor;
        ctx.globalAlpha = 0.9;

        ctx.fillText(subText.toUpperCase(), cx, ty + textSize * 0.5);

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    // 7. vignette
    if (vignette) {
      const grad = ctx.createRadialGradient(
        cw / 2,
        ch / 2,
        Math.min(cw, ch) * 0.25,
        cw / 2,
        ch / 2,
        Math.max(cw, ch) * 0.72,
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 8. scanlines
    if (scanlines) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#3b1026";

      for (let y = 0; y < ch; y += 5) {
        ctx.fillRect(0, y, cw, 1);
      }

      ctx.restore();
    }
  }, [
    img,
    format,
    shadowColor,
    highlightColor,
    halftoneOn,
    dotSize,
    halftoneOpacity,
    grain,
    scanlines,
    vignette,
    titleText,
    subText,
    textSize,
    glitchAmt,
    seed,
  ]);

  useEffect(() => {
    render();
  }, [render]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(fileName || "neon-poster").replace(/\.[^.]+$/, "")}-cyberpunk.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
   <div className="min-h-screen w-full bg-[#12090f] text-[#fff1f7] font-mono relative overflow-x-hidden flex flex-col">
      
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

.font-display {
  font-family: 'Manrope', sans-serif;
  letter-spacing: 0.04em;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

input[type="range"] {
  -webkit-appearance: none;
  height: 6px;
  background: rgba(255, 182, 193, 0.2);
  border-radius: 999px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--thumb, #ff7eb6);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(255, 126, 182, 0.45);
  transition: all 0.25s ease;
}

input[type="color"] {
  -webkit-appearance: none;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: 2px solid rgba(255, 126, 182, 0.35);
  border-radius: 10px;
}

@keyframes flicker {
  0%, 92%, 100% { opacity: 1; }
  93% { opacity: 0.8; }
  96% { opacity: 0.9; }
}

.flicker { animation: flicker 8s infinite; }

.bracket {
  position: absolute;
  width: 18px;
  height: 18px;
  border-color: #ff7eb6;
  opacity: 0.8;
}
`}</style>

      {/* Header */}
      <div className="border-b border-pink-200/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between relative z-10 bg-[#1a0b12]">
        <div className="flex items-center gap-2 sm:gap-3">
          <Zap size={18} className="text-pink-400 shrink-0" strokeWidth={2.5} />
          <h1 className="font-display text-base sm:text-lg tracking-[0.12em] text-white flicker truncate">
            Rosé Studio
          </h1>
        </div>

        <div className="text-[9px] sm:text-[11px] tracking-[0.2em] text-pink-200/70 shrink-0">
          VISUAL ARCHIVE // V1.0
        </div>
      </div>

      {/* Mobile Toggle Bar */}
      <div className="lg:hidden flex border-b border-pink-200/20 bg-[#1a0b12] sticky top-0 z-20">
        <button
          onClick={() => setActiveTab("controls")}
          className={`flex-1 py-3 text-xs tracking-wider font-display flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "controls"
              ? "border-pink-400 text-pink-300 bg-pink-400/10"
              : "border-transparent text-pink-200/50"
          }`}
        >
          <Sliders size={14} /> CONTROLS
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-3 text-xs tracking-wider font-display flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === "preview"
              ? "border-pink-400 text-pink-300 bg-pink-400/10"
              : "border-transparent text-pink-200/50"
          }`}
        >
          <Eye size={14} /> PREVIEW
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 relative z-10">
        
        {/* Sidebar Console */}
        <div
          className={`w-full lg:w-[340px] border-r border-pink-200/20 p-4 sm:p-5 space-y-6 lg:h-[calc(100vh-57px)] lg:overflow-y-auto ${
            activeTab === "controls" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Upload */}
          <div>
            <SectionLabel>01 • SOURCE IMAGE</SectionLabel>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 cursor-pointer border ${
                isDragging
                  ? "border-pink-400 bg-pink-400/10"
                  : "border-pink-200/20 hover:border-pink-300/50"
              } rounded-xl px-4 py-5 text-center transition-all duration-300 active:scale-[0.98]`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <Upload size={20} className="mx-auto mb-2 text-pink-400" />

              <p className="text-xs sm:text-sm text-pink-100 truncate">
                {fileName ? fileName : "Tap to browse or drop an image"}
              </p>

              <p className="mt-1 text-[10px] text-pink-200/60">
                PNG, JPG, JPEG, WEBP
              </p>
            </div>
          </div>

          {/* Format */}
          <div>
            <SectionLabel>02 • FRAME FORMAT</SectionLabel>

            <div className="mt-2 grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`text-[11px] tracking-wide py-2.5 rounded-lg border transition-all active:scale-95 ${
                    format === f.id
                      ? "border-pink-400 text-pink-300 bg-pink-400/10 shadow-[0_0_12px_rgba(244,114,182,0.25)]"
                      : "border-pink-200/20 text-pink-100/70 hover:border-pink-300/50 hover:bg-pink-400/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duotone */}
          <div>
            <SectionLabel>03 • DUOTONE</SectionLabel>

            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  title={p.name}
                  onClick={() => {
                    setShadowColor(p.shadow);
                    setHighlightColor(p.highlight);
                  }}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-pink-200/20 hover:border-pink-300 transition-all active:scale-90"
                  style={{
                    background: `linear-gradient(135deg, ${p.shadow} 50%, ${p.highlight} 50%)`,
                  }}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-around sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-md cursor-pointer"
                />
                <span className="text-xs text-pink-100/70 tracking-wide">
                  SHADOW
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-md cursor-pointer"
                />
                <span className="text-xs text-pink-100/70 tracking-wide">
                  HIGHLIGHT
                </span>
              </div>
            </div>
          </div>

          {/* Halftone */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>04 • HALFTONE</SectionLabel>
              <Toggle checked={halftoneOn} onChange={setHalftoneOn} />
            </div>

            {halftoneOn && (
              <div className="mt-3 space-y-4 rounded-xl border border-pink-200/20 bg-pink-400/5 p-4">
                <Slider
                  label="DOT SIZE"
                  value={dotSize}
                  min={3}
                  max={16}
                  onChange={setDotSize}
                />

                <Slider
                  label="INTENSITY"
                  value={halftoneOpacity}
                  min={0}
                  max={100}
                  onChange={setHalftoneOpacity}
                  suffix="%"
                />
              </div>
            )}
          </div>

          {/* Grain + FX */}
          <div>
            <SectionLabel>05 • GRAIN & FX</SectionLabel>

            <div className="mt-3 space-y-4">
              <Slider
                label="GRAIN"
                value={grain}
                min={0}
                max={60}
                onChange={setGrain}
              />

              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs text-pink-100/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scanlines}
                    onChange={(e) => setScanlines(e.target.checked)}
                    className="accent-pink-400 w-4 h-4"
                  />
                  SCANLINES
                </label>

                <label className="flex items-center gap-2 text-xs text-pink-100/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vignette}
                    onChange={(e) => setVignette(e.target.checked)}
                    className="accent-pink-400 w-4 h-4"
                  />
                  VIGNETTE
                </label>
              </div>
            </div>
          </div>

          {/* Text Effects */}
          <div>
            <SectionLabel>06 • TEXT EFFECTS</SectionLabel>

            <div className="mt-3 space-y-3">
              <input
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                placeholder="TITLE"
                className="w-full bg-pink-400/5 border border-pink-200/20 rounded-lg px-3 py-2.5 text-sm tracking-wide text-white placeholder:text-pink-100/40 outline-none focus:border-pink-400"
              />

              <input
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                placeholder="SUBTITLE"
                className="w-full bg-pink-400/5 border border-pink-200/20 rounded-lg px-3 py-2.5 text-xs tracking-wide text-white placeholder:text-pink-100/40 outline-none focus:border-pink-400"
              />

              <Slider
                label="TEXT SIZE"
                value={textSize}
                min={28}
                max={110}
                onChange={setTextSize}
              />

              <Slider
                label="DISTORTION"
                value={glitchAmt}
                min={0}
                max={100}
                onChange={setGlitchAmt}
                suffix="%"
              />

              <button
                onClick={() => setSeed((s) => s + 1)}
                className="w-full flex items-center justify-center gap-2 text-xs tracking-wide py-2.5 rounded-lg border border-pink-200/20 text-pink-100/70 active:bg-pink-400/10"
              >
                <Shuffle size={14} />
                RANDOMIZE EFFECT
              </button>
            </div>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg border font-display tracking-[0.15em] text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border-pink-400 text-pink-300 bg-pink-400/10 active:scale-[0.98]"
          >
            <Download size={16} />
            EXPORT PNG
          </button>
        </div>

        {/* Canvas / Preview Container */}
        <div
          className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative min-h-[50vh] lg:min-h-[70vh] ${
            activeTab === "preview" ? "block" : "hidden lg:flex"
          }`}
        >
          <div className="relative max-w-full my-auto flex justify-center">
            <div className="bracket border-t-2 border-l-2 -top-2 -left-2 sm:-top-3 sm:-left-3" />
            <div className="bracket border-t-2 border-r-2 -top-2 -right-2 sm:-top-3 sm:-right-3" />
            <div className="bracket border-b-2 border-l-2 -bottom-2 -left-2 sm:-bottom-3 sm:-left-3" />
            <div className="bracket border-b-2 border-r-2 -bottom-2 -right-2 sm:-bottom-3 sm:-right-3" />

            {!img && (
              <div className="w-[280px] h-[380px] sm:w-[380px] sm:h-[520px] rounded-xl border border-dashed border-pink-200/20 flex flex-col items-center justify-center gap-3 text-pink-100/60 bg-pink-400/5 flicker">
                <ImageOff size={32} className="text-pink-300" />
                <p className="text-xs tracking-wide text-pink-100/70 text-center px-4">
                  UPLOAD AN IMAGE TO BEGIN
                </p>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[60vh] lg:max-h-[75vh] w-auto h-auto rounded-xl object-contain ${
                img ? "block" : "hidden"
              }`}
              style={{
                boxShadow: "0 0 30px rgba(244,114,182,0.15)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="font-display text-[11px] tracking-[0.15em] text-[#ff5fb1]">
      {children}
    </p>
  );
}

function Slider({ label, value, min, max, onChange, suffix = "" }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-pink-100/60 mb-1.5">
        <span>{label}</span>
        <span className="text-pink-50">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer py-1"
      />
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full border flex items-center transition-all duration-300 ${
        checked
          ? "border-pink-400 bg-pink-400/10"
          : "border-pink-200/20 bg-white/5"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full transition-transform duration-300 ${
          checked
            ? "translate-x-5 bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.6)]"
            : "translate-x-1 bg-pink-100/40"
        }`}
      />
    </button>
  );
}