import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import figlet from 'figlet';
import { 
  Type, 
  Download, 
  Copy, 
  Search, 
  Settings2, 
  Terminal, 
  Maximize2, 
  Minimize2,
  Star,
  RefreshCw,
  Info,
  Image as ImageIcon,
  History,
  Dices,
  Infinity as InfinityIcon,
  QrCode,
  ChevronDown,
  Zap,
  Layers,
  Activity,
  Cpu,
  Sliders,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const DEFAULT_TEXT = "ASCII Lab";
const FONT_BASE_URL = 'https://raw.githubusercontent.com/patorjk/figlet.js/master/fonts/';

// A curated list of popular FIGlet fonts
const POPULAR_FONTS = [
  'Standard', 'Slant', 'Small', 'Big', 'Banner', 'Block', 'Digital', 'Doom', 
  'Gothic', 'Ivrit', 'Mini', 'Script', 'Shadow', 'Speed', 'Star Wars', 'Alligator',
  'Alphabet', 'Arrows', 'Avatar', 'Banner3', 'Bell', 'Binary', 'Bulhead', 'Calvin S',
  'Catwalk', 'Chunky', 'Contessa', 'Cyberlarge', 'Cybermedium', 'Cybersmall', 'Diamond',
  'Epic', 'Fender', 'Four Tops', 'Fraktur', 'Graffiti', 'Isometric1', 'Isometric2',
  'Isometric3', 'Isometric4', 'Jacky', 'Jazmine', 'Keyboard', 'Larry 3D', 'LCD',
  'Lean', 'Letters', 'Lockergnome', 'Marquee', 'Maxfour', 'Merlin1', 'Modular',
  'Nancyj-Fancy', 'Ogre', 'Puffy', 'Rectangles', 'Relief', 'Roman', 'Rot13',
  'Rounded', 'Rowan Cap', 'S Blood', 'Slant Relief', 'Soft', 'Stacey', 'Stampate',
  'Stellar', 'Stop', 'Straight', 'Tanja', 'Tengwar', 'Term', 'Thick', 'Thin',
  'Three Point', 'Toke', 'Trek', 'Twall', 'Univers', 'USA Flag', 'Wavy', 'Whimsy'
];

const LAYOUT_OPTIONS: figlet.KerningMethods[] = [
  'default',
  'full',
  'fitted',
  'controlled smushing',
  'universal smushing'
];

const parseNumberInRange = (value: string | null, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const parseLayout = (value: string | null, fallback: figlet.KerningMethods) => {
  if (value && LAYOUT_OPTIONS.includes(value as figlet.KerningMethods)) {
    return value as figlet.KerningMethods;
  }
  return fallback;
};

export default function App() {
  // --- State ---
  const [text, setText] = useState(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return params.get('t') || DEFAULT_TEXT;
  });
  const [font, setFont] = useState(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return params.get('f') || 'Standard';
  });
  const [width, setWidth] = useState(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return parseNumberInRange(params.get('w'), 80, 10, 200);
  });
  const [isAutoWidth, setIsAutoWidth] = useState(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return params.get('aw') === '1';
  });
  const [previewFontSize, setPreviewFontSize] = useState(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return parseNumberInRange(params.get('fs'), 12, 10, 20);
  });
  const [hLayout, setHLayout] = useState<figlet.KerningMethods>(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return parseLayout(params.get('hl'), 'default');
  });
  const [vLayout, setVLayout] = useState<figlet.KerningMethods>(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return parseLayout(params.get('vl'), 'default');
  });
  const [output, setOutput] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('taag-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<{t: string, f: string}[]>(() => {
    const saved = localStorage.getItem('taag-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [fontWarning, setFontWarning] = useState('');
  const [availableFonts, setAvailableFonts] = useState<string[]>(() => [...POPULAR_FONTS]);
  const [isMobileFontMenuOpen, setIsMobileFontMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const outputRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const fontAvailabilityRef = useRef<Record<string, boolean>>({ Standard: true });

  // --- Effects ---
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('t', text);
    params.set('f', font);
    params.set('w', String(width));
    params.set('aw', isAutoWidth ? '1' : '0');
    params.set('hl', hLayout);
    params.set('vl', vLayout);
    params.set('fs', String(previewFontSize));
    window.location.hash = params.toString();
  }, [text, font, width, isAutoWidth, hLayout, vLayout, previewFontSize]);

  useEffect(() => {
    localStorage.setItem('taag-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('taag-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((t: string, f: string) => {
    if (!t.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(h => h.t !== t || h.f !== f);
      return [{ t, f }, ...filtered].slice(0, 10);
    });
  }, []);

  const ensureFontAvailable = useCallback(async (fontName: string) => {
    if (fontAvailabilityRef.current[fontName] !== undefined) {
      return fontAvailabilityRef.current[fontName];
    }

    try {
      const response = await fetch(`${FONT_BASE_URL}${encodeURIComponent(fontName)}.flf`, { cache: 'force-cache' });
      fontAvailabilityRef.current[fontName] = response.ok;
      return response.ok;
    } catch {
      fontAvailabilityRef.current[fontName] = false;
      return false;
    }
  }, []);

  const removeUnavailableFont = useCallback((fontName: string) => {
    if (fontName === 'Standard') return;
    setAvailableFonts(prev => prev.filter(f => f !== fontName));
  }, []);

  const renderWithFont = useCallback((targetText: string, targetFont: string) => {
    return new Promise<string>((resolve, reject) => {
      figlet.text(targetText, {
        font: targetFont as figlet.Fonts,
        horizontalLayout: hLayout,
        verticalLayout: vLayout,
        width: isAutoWidth ? 1000 : width,
        whitespaceBreak: true
      }, (err, data) => {
        if (err || !data) {
          reject(err ?? new Error('No output generated'));
          return;
        }
        resolve(data);
      });
    });
  }, [hLayout, vLayout, width, isAutoWidth]);

  const renderASCII = useCallback(async () => {
    if (!text) {
      setOutput('(rendered ASCII will show here)');
      setFontWarning('');
      return;
    }

    setIsRendering(true);
    setFontWarning('');
    
    // Load font if not standard (figlet.js handles caching internally)
    try {
      figlet.defaults({ fontPath: FONT_BASE_URL });

      let activeFont = font;
      if (font !== 'Standard') {
        const isAvailable = await ensureFontAvailable(font);
        if (!isAvailable) {
          removeUnavailableFont(font);
          activeFont = 'Standard';
          setFontWarning(`"${font}" is unavailable right now. Showing STANDARD.`);
        }
      }

      try {
        const ascii = await renderWithFont(text, activeFont);
        setOutput(ascii);
        addToHistory(text, activeFont);
      } catch (primaryError) {
        if (activeFont !== 'Standard') {
          const fallbackAscii = await renderWithFont(text, 'Standard');
          setOutput(fallbackAscii);
          removeUnavailableFont(activeFont);
          setFontWarning(`"${font}" failed to render. Showing STANDARD.`);
          addToHistory(text, 'Standard');
        } else {
          throw primaryError;
        }
      }
    } catch (e) {
      console.error('Figlet error:', e);
      setIsRendering(false);
      setOutput('Failed to load font.');
      return;
    }
    setIsRendering(false);
  }, [text, font, addToHistory, ensureFontAvailable, renderWithFont, removeUnavailableFont]);

  useEffect(() => {
    const timer = setTimeout(renderASCII, 150);
    return () => clearTimeout(timer);
  }, [renderASCII]);

  // --- Handlers ---
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascii-art-${font.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async (transparent: boolean) => {
    if (!outputRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(outputRef.current, {
        backgroundColor: transparent ? undefined : '#0A0A0B',
        style: {
          background: transparent ? 'transparent' : '#0A0A0B',
          padding: '40px',
          borderRadius: '0px',
          margin: '0px'
        }
      });
      const fileName = `ascii-art-${font.toLowerCase()}${transparent ? '-transparent' : ''}.png`;
      const isMobile = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
      const pngBlob = await fetch(dataUrl).then((res) => res.blob());
      const pngFile = new File([pngBlob], fileName, { type: 'image/png' });

      if (isMobile && typeof navigator.share === 'function') {
        const canShareFiles = typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [pngFile] })
          : true;

        if (canShareFiles) {
          await navigator.share({
            files: [pngFile],
            title: 'ASCII Lab Export',
            text: 'PNG export from ASCII Lab'
          });
          return;
        }
      }

      const blobUrl = URL.createObjectURL(pngBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.rel = 'noopener';
      if (isMobile) {
        link.target = '_blank';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportQr = async () => {
    setIsExporting(true);
    try {
      const currentUrl = new URL(window.location.href);
      const basePath = currentUrl.pathname.endsWith('/')
        ? currentUrl.pathname
        : currentUrl.pathname.replace(/[^/]*$/, '');
      const outputOnlyUrl = new URL(`${basePath}ascii.html`, currentUrl.origin);
      outputOnlyUrl.searchParams.set('t', text || DEFAULT_TEXT);
      outputOnlyUrl.searchParams.set('f', font);
      outputOnlyUrl.searchParams.set('w', String(width));
      outputOnlyUrl.searchParams.set('aw', isAutoWidth ? '1' : '0');
      outputOnlyUrl.searchParams.set('hl', hLayout);
      outputOnlyUrl.searchParams.set('vl', vLayout);
      outputOnlyUrl.searchParams.set('fs', String(previewFontSize));
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&format=png&margin=20&data=${encodeURIComponent(outputOnlyUrl.toString())}`;
      const isMobile = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
      const qrBlob = await fetch(qrApiUrl).then((res) => {
        if (!res.ok) throw new Error('QR generation failed');
        return res.blob();
      });
      const fileName = `ascii-lab-qr-${font.toLowerCase()}.png`;
      const qrFile = new File([qrBlob], fileName, { type: 'image/png' });
      if (isMobile && typeof navigator.share === 'function') {
        const canShareFiles = typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [qrFile] })
          : true;
        if (canShareFiles) {
          await navigator.share({
            files: [qrFile],
            title: 'ASCII Lab QR',
            text: 'QR code for ASCII output image page'
          });
          return;
        }
      }
      const qrUrl = URL.createObjectURL(qrBlob);
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(qrUrl);
    } catch (err) {
      console.error('QR export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRandomFont = () => {
    const randomFont = availableFonts[Math.floor(Math.random() * availableFonts.length)];
    setFont(randomFont);
  };

  const toggleFavorite = (f: string) => {
    setFavorites(prev => 
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const filteredFonts = useMemo(() => {
    return availableFonts.filter(f => 
      f.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const aFav = favorites.includes(a);
      const bFav = favorites.includes(b);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.localeCompare(b);
    });
  }, [availableFonts, searchQuery, favorites]);

  useEffect(() => {
    if (!availableFonts.includes(font)) {
      setFont('Standard');
    }
  }, [availableFonts, font]);

  const cycleFont = useCallback((direction: 'next' | 'prev') => {
    if (filteredFonts.length === 0) return;
    const currentIndex = filteredFonts.indexOf(font);
    const targetIndex = direction === 'next'
      ? (currentIndex === -1 ? 0 : (currentIndex + 1) % filteredFonts.length)
      : (currentIndex === -1 ? filteredFonts.length - 1 : (currentIndex - 1 + filteredFonts.length) % filteredFonts.length);
    setFont(filteredFonts[targetIndex]);
  }, [filteredFonts, font]);

  useEffect(() => {
    const activeEl = document.getElementById(`font-opt-${font}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [font]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      cycleFont(e.key === 'ArrowDown' ? 'next' : 'prev');
    }
  };

  useEffect(() => {
    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || (target as HTMLElement).isContentEditable;
    };

    const handleGlobalArrow = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (isInteractive(event.target)) return;
      event.preventDefault();
      cycleFont(event.key === 'ArrowDown' ? 'next' : 'prev');
    };

    window.addEventListener('keydown', handleGlobalArrow);
    return () => window.removeEventListener('keydown', handleGlobalArrow);
  }, [cycleFont]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPreviewFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleFullscreenToggle = useCallback(async () => {
    const isMobileOrTablet = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;

    if (!isMobileOrTablet) {
      setIsFullWidth(prev => !prev);
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await (previewRef.current ?? document.documentElement).requestFullscreen();
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: OrientationLockType) => Promise<void>;
        };
        if (orientation?.lock) {
          await orientation.lock('landscape');
        }
      } else {
        await document.exitFullscreen();
        const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
        orientation?.unlock?.();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  }, []);

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#050506] text-[#E1E1E3] font-sans selection:bg-[#00FF41]/30 selection:text-[#00FF41] overflow-x-hidden lg:overflow-hidden">
      {/* Header */}
      <header className="border-b border-[#00FF41]/20 bg-[#0D0D0F]/90 backdrop-blur-md z-50 shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.05)]">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-none bg-[#00FF41]/10 border border-[#00FF41]/40 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[#00FF41]/5 animate-pulse" />
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="ASCII Lab logo" className="relative z-10 w-[18px] h-[18px]" />
            </div>
            <div className="relative">
              <h1 className="text-xs sm:text-sm font-black tracking-tighter uppercase italic glitch-text" data-text="ASCII LAB">ASCII LAB</h1>
              <p className="text-[8px] sm:text-[9px] text-[#00FF41]/75 font-mono uppercase tracking-[0.16em]">Art Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Export Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 text-[9px] font-mono text-[#00FF41]/75 uppercase tracking-[0.16em]">
                <Activity size={12} className="text-[#00FF41]" />
                EXPORT:
              </div>
              <button 
                onClick={() => handleExportPng(false)}
                disabled={isExporting}
                className="h-8 w-24 px-2 text-[9px] font-black uppercase tracking-widest bg-black/40 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/85 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ImageIcon size={12} /> PNG
              </button>
              <button 
                onClick={() => handleExportPng(true)}
                disabled={isExporting}
                className="h-8 w-24 px-2 text-[9px] font-black uppercase tracking-widest bg-black/40 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/85 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <InfinityIcon size={12} /> ALPHA
              </button>
              <button
                onClick={handleExportQr}
                disabled={isExporting}
                className="h-8 w-24 px-2 text-[9px] font-black uppercase tracking-widest bg-black/40 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/85 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <QrCode size={12} /> QR
              </button>
            </div>

            <div className="h-6 w-[1px] bg-white/5 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className={cn(
                  "hidden sm:flex h-8 px-4 rounded-none text-[10px] font-black uppercase tracking-widest transition-all items-center gap-2 border",
                  copyStatus === 'copied' 
                    ? "bg-[#00FF41] text-black border-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.5)]" 
                    : "bg-black/40 border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]"
                )}
              >
                <Copy size={14} />
                {copyStatus === 'copied' ? 'COPIED' : 'COPY'}
              </button>
              <button 
                onClick={handleDownload}
                className="hidden sm:flex h-8 w-24 px-2 rounded-none text-[9px] font-black uppercase tracking-widest bg-black/40 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/85 transition-all items-center justify-center gap-1.5"
              >
                <Download size={12} />
                TXT
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 pb-24 lg:p-6 lg:pb-6 overflow-y-auto lg:overflow-hidden min-h-0 relative">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,118,0.02))] z-10 bg-[length:100%_2px,3px_100%]" />
        
        <div className={cn(
          "grid gap-3 transition-all duration-500 h-auto lg:h-full lg:min-h-0 relative z-20",
          isFullWidth ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[380px_1fr]"
        )}>
          <section className="lg:hidden order-1 bg-[#0D0D0F] border border-[#00FF41]/10 rounded-none p-5 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0 relative">
            <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41]" />
            <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41]" />

            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FF41]/60 flex items-center gap-2">
                <Type size={12} /> SOURCE_INPUT
              </label>
              <div className="flex items-center gap-3 text-[9px] font-mono text-[#00FF41]/55">
                <span>{text.trim() ? text.trim().split(/\s+/).length : 0} WDS</span>
                <span>{text.length}/100 CHR</span>
              </div>
            </div>
            <div className="relative">
              <textarea
                id="text-mobile"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 100))}
                placeholder="ENTER_DATA_STREAM..."
                className="w-full bg-black/60 border border-[#00FF41]/20 rounded-none p-3 pr-8 text-sm font-mono leading-5 focus:outline-none focus:border-[#00FF41] focus:ring-0 transition-all min-h-[100px] resize-none text-[#00FF41] placeholder-[#00FF41]/20 caret-transparent"
              />
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden p-3 pr-8 text-sm font-mono leading-5"
                aria-hidden="true"
              >
                <span className="whitespace-pre-wrap break-words text-transparent">{text}</span>
                <span className="terminal-caret inline-block align-baseline">█</span>
              </div>
            </div>
          </section>
          
          {/* Left Sidebar: Controls */}
          {!isFullWidth && (
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-3 lg:order-1 flex flex-col gap-3 lg:h-full lg:min-h-0 overflow-y-auto custom-scrollbar pr-0 lg:pr-2 pb-6"
            >
              {/* Input Section */}
              <section className="hidden lg:block bg-[#0D0D0F] border border-[#00FF41]/10 rounded-none p-5 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0 relative">
                <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41]" />
                <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41]" />
                
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FF41]/60 flex items-center gap-2">
                    <Type size={12} /> SOURCE_INPUT
                  </label>
                  <div className="flex items-center gap-3 text-[9px] font-mono text-[#00FF41]/55">
                    <span>{text.trim() ? text.trim().split(/\s+/).length : 0} WDS</span>
                    <span>{text.length}/100 CHR</span>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 100))}
                    placeholder="ENTER_DATA_STREAM..."
                    className="w-full bg-black/60 border border-[#00FF41]/20 rounded-none p-3 pr-8 text-sm font-mono leading-5 focus:outline-none focus:border-[#00FF41] focus:ring-0 transition-all min-h-[100px] resize-none text-[#00FF41] placeholder-[#00FF41]/20 caret-transparent"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden p-3 pr-8 text-sm font-mono leading-5"
                    aria-hidden="true"
                  >
                    <span className="whitespace-pre-wrap break-words text-transparent">{text}</span>
                    <span className="terminal-caret inline-block align-baseline">█</span>
                  </div>
                </div>
              </section>

              <section className="bg-[#0D0D0F] border border-[#00FF41]/10 rounded-none p-5 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0 relative">
                <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41]" />
                <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41]" />
                <div className="space-y-4">
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FF41]/60 flex items-center gap-2">
                        <Cpu size={12} /> FONT_CORE
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRandomFont}
                          className="dice-pulse h-7 w-7 shrink-0 rounded-none border border-[#00FF41]/20 bg-black/60 text-[#00FF41]/70 hover:text-[#00FF41] hover:bg-[#00FF41]/10 transition-all flex items-center justify-center"
                          title="Random Font"
                        >
                          <Dices size={12} />
                        </button>
                        <span className="text-[9px] font-mono text-[#00FF41]/55">{availableFonts.length} SYS</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMobileFontMenuOpen(prev => !prev)}
                      className="w-full bg-black/60 border border-[#00FF41]/20 rounded-none px-3 py-2 text-[10px] font-mono text-[#00FF41] flex items-center justify-between"
                    >
                      <span className="truncate text-left">{font.toUpperCase()}</span>
                      <ChevronDown size={14} className={cn("text-[#00FF41]/40 transition-transform", isMobileFontMenuOpen && "rotate-180")} />
                    </button>

                    {isMobileFontMenuOpen && (
                      <div className="border border-[#00FF41]/20 bg-black/85">
                        <div className="p-2 border-b border-[#00FF41]/10">
                          <div className="relative">
                            <input
                              id="font"
                              type="text"
                              placeholder="SEARCH_FONTS..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="w-full bg-black/60 border border-[#00FF41]/20 rounded-none pl-8 pr-3 py-2 text-[10px] font-mono focus:outline-none focus:border-[#00FF41] text-[#00FF41] placeholder-[#00FF41]/20"
                            />
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#00FF41]/50" />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-black/10">
                          {filteredFonts.map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setFont(f);
                                if (window.matchMedia('(max-width: 1024px)').matches) {
                                  setIsMobileFontMenuOpen(false);
                                }
                              }}
                              id={`font-opt-${f}`}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-none text-[11px] font-mono transition-all group border",
                                font === f
                                  ? "bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/40 shadow-[inset_0_0_10px_rgba(0,255,65,0.1)]"
                                  : "text-white/75 hover:text-white hover:bg-white/5 border-transparent hover:border-white/20"
                              )}
                            >
                              <span className="truncate">{f.toUpperCase()}</span>
                              <div className="flex items-center gap-2">
                                {favorites.includes(f) && <Star size={10} className="fill-[#00FF41] text-[#00FF41]" />}
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(f);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-none"
                                >
                                  <Star size={12} className={cn(favorites.includes(f) ? "fill-[#00FF41] text-[#00FF41]" : "text-white/10")} />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FF41]/60 flex items-center gap-2">
                        <Sliders size={12} /> WIDTH_PARAM
                      </label>
                <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsAutoWidth(!isAutoWidth)}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border transition-all",
                            isAutoWidth
                              ? "bg-[#00FF41]/15 text-[#00FF41] border-[#00FF41]/60 shadow-[inset_0_0_10px_rgba(0,255,65,0.12)]"
                              : "bg-black/60 border-[#00FF41]/20 text-[#00FF41]/60 hover:bg-[#00FF41]/10 hover:text-[#00FF41]"
                          )}
                        >
                          AUTO
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative border border-[#00FF41]/20 p-2 space-y-2">
                        <div className="absolute top-0 left-0 w-1 h-3 bg-[#00FF41]" />
                        <div className="absolute top-0 left-0 w-3 h-1 bg-[#00FF41]" />
                        <span className="inline-flex w-full justify-center text-[8px] font-black uppercase tracking-widest text-[#00FF41]/70">
                          WIDTH {width}
                        </span>
                        <input
                          id="width"
                          type="range"
                          min="10"
                          max="200"
                          disabled={isAutoWidth}
                          value={width}
                          onChange={(e) => setWidth(parseInt(e.target.value) || 80)}
                          className={cn(
                            "range-3d w-full accent-[#00FF41] h-1 rounded-none appearance-none cursor-pointer",
                            isAutoWidth && "opacity-20 cursor-not-allowed"
                          )}
                        />
                      </div>
                      <div className="relative border border-[#00FF41]/20 p-2 space-y-2">
                        <div className="absolute top-0 left-0 w-1 h-3 bg-[#00FF41]" />
                        <div className="absolute top-0 left-0 w-3 h-1 bg-[#00FF41]" />
                        <span className="inline-flex w-full justify-center text-[8px] font-black uppercase tracking-widest text-[#00FF41]/70">
                          FONT {previewFontSize}px
                        </span>
                        <input
                          id="previewFontSize"
                          type="range"
                          min="10"
                          max="20"
                          value={previewFontSize}
                          onChange={(e) => setPreviewFontSize(parseInt(e.target.value) || 12)}
                          className="range-3d w-full accent-[#00FF41] h-1 rounded-none appearance-none cursor-pointer"
                          title="Preview Font Size"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FF41]/60 flex items-center gap-2">
                        <Zap size={12} /> H_LAYOUT
                      </label>
                      <select
                        id="hLayout"
                        value={hLayout}
                        onChange={(e) => setHLayout(e.target.value as any)}
                        className="w-full bg-black/60 border border-[#00FF41]/20 rounded-none px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-[#00FF41] appearance-none cursor-pointer text-[#00FF41]"
                      >
                        <option value="default">DEFAULT</option>
                        <option value="full">FULL</option>
                        <option value="fitted">FITTED</option>
                        <option value="controlled smushing">SMUSH_C</option>
                        <option value="universal smushing">SMUSH_U</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00FF41]/60 flex items-center gap-2">
                        <Layers size={12} /> V_LAYOUT
                      </label>
                      <select
                        id="vLayout"
                        value={vLayout}
                        onChange={(e) => setVLayout(e.target.value as any)}
                        className="w-full bg-black/60 border border-[#00FF41]/20 rounded-none px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-[#00FF41] appearance-none cursor-pointer text-[#00FF41]"
                      >
                        <option value="default">DEFAULT</option>
                        <option value="full">FULL</option>
                        <option value="fitted">FITTED</option>
                        <option value="controlled smushing">SMUSH_C</option>
                        <option value="universal smushing">SMUSH_U</option>
                      </select>
                    </div>
                  </div>

                </div>
              </section>

              {/* History Section */}
              {history.length > 0 && (
                <section className="hidden lg:block bg-[#0D0D0F] border border-white/5 rounded-none p-5 space-y-4 shadow-2xl shrink-0 relative">
                  <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41]" />
                  <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41]" />
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                      <History size={12} /> RECENT_LOGS
                    </label>
                    <button 
                      onClick={() => setHistory([])}
                      className="text-[8px] font-black uppercase tracking-widest text-white/55 hover:text-[#FF5F56]"
                    >
                      WIPE
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setText(h.t);
                          setFont(h.f);
                        }}
                        className="px-2 py-1 rounded-none bg-white/5 border border-white/20 text-[10px] font-mono text-white/80 hover:border-[#00FF41]/40 hover:text-[#00FF41] transition-all truncate max-w-[120px]"
                        title={`${h.t} (${h.f})`}
                      >
                        {h.t}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-auto bg-[#0D0D0F] border border-[#00FF41]/10 rounded-none p-4 space-y-3 shadow-[0_0_20px_rgba(0,0,0,0.45)] shrink-0 relative">
                <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41]" />
                <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41]" />
                <button
                  type="button"
                  onClick={() => setIsAboutOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between bg-black/60 border border-[#00FF41]/20 rounded-none px-3 py-2 text-[10px] font-mono text-[#00FF41] hover:bg-[#00FF41]/10 transition-all"
                >
                  <span className="flex items-center gap-2 tracking-[0.16em]">
                    <Info size={12} /> ABOUT
                  </span>
                  <ChevronDown size={14} className={cn("text-[#00FF41]/50 transition-transform", isAboutOpen && "rotate-180")} />
                </button>
                {isAboutOpen && (
                  <div className="border border-[#00FF41]/20 bg-black/40 p-3 space-y-3 text-[10px] font-mono text-white/75">
                    <p className="text-[#00FF41]/85">
                      ASCII Lab is a FIGlet-style generator for creating ASCII banners with live preview, font search, and quick export.
                    </p>
                    <div className="space-y-1 text-white/70">
                      <p>1. Type your text in `SOURCE_INPUT`.</p>
                      <p>2. Pick a font in `FONT_CORE` or use the dice button.</p>
                      <p>3. Tune width/layout settings for final shape.</p>
                      <p>4. Copy output or export PNG.</p>
                      <p>5. Use `ALPHA` for transparent-background PNG export.</p>
                    </div>
                  </div>
                )}
              </section>

            </motion.aside>
          )}

          {/* Right Area: Output */}
          <motion.section 
            layout
            ref={previewRef}
            className="order-2 lg:order-2 flex flex-col gap-3 min-h-[55vh] lg:h-full lg:min-h-0 overflow-hidden"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  id="render"
                  onClick={renderASCII}
                  className="p-2 rounded-none bg-black/40 border border-[#00FF41]/20 hover:border-[#00FF41] text-[#00FF41]/60 hover:text-[#00FF41] transition-all"
                  title="Force Re-render"
                >
                  <RefreshCw size={16} className={isRendering ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={handleFullscreenToggle}
                  className="p-2 rounded-none bg-black/40 border border-[#00FF41]/20 hover:border-[#00FF41] text-[#00FF41]/60 hover:text-[#00FF41] transition-all"
                  title={isPreviewFullscreen || isFullWidth ? "Exit Fullscreen" : "Fullscreen Preview"}
                >
                  {isPreviewFullscreen || isFullWidth ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <div className="flex items-center gap-2 text-[9px] font-mono text-[#00FF41]/75 uppercase tracking-[0.16em]">
                  <Activity size={12} className="text-[#00FF41] animate-pulse" />
                  LIVE_FEED: {font.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.14em]">
                {isRendering && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-[#00FF41]"
                  >
                    <RefreshCw size={12} className="animate-spin" />
                    PROCESSING...
                  </motion.div>
                )}
                <div className="text-white/80">
                  {output.split('\n').length} LN | {output.length} CHR
                </div>
              </div>
            </div>
            {fontWarning && (
              <div className="text-[9px] font-mono text-[#FFBD2E]/80 uppercase tracking-[0.12em] shrink-0">
                {fontWarning}
              </div>
            )}

            <div className="flex-1 min-h-0 relative group overflow-hidden">
              {/* Output Box */}
              <div className="absolute inset-0 bg-[#0D0D0F] border border-[#00FF41]/20 rounded-none shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41] z-10" />
                <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41] z-10" />
                <div className="grid grid-cols-[72px_1fr_72px] sm:grid-cols-[96px_1fr_220px] items-center px-4 py-2 border-b border-[#00FF41]/10 bg-black/40">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-none bg-[#FF5F56]/40" />
                    <div className="w-2 h-2 rounded-none bg-[#FFBD2E]/40" />
                    <div className="w-2 h-2 rounded-none bg-[#27C93F]/40" />
                  </div>
                  <div className="justify-self-center border border-[#00FF41]/20 bg-black/35 px-3 py-1 text-[9px] font-mono text-[#00FF41]/75 uppercase tracking-[0.16em]">
                    OUTPUT_BUFFER_01
                  </div>
                  <div className="justify-self-end text-[8px] font-mono text-[#00FF41]/55 whitespace-nowrap overflow-hidden text-ellipsis">
                    SECURE_CONNECTION_ESTABLISHED
                  </div>
                </div>
                
                <div className="flex-1 relative overflow-hidden">
                  <pre 
                    id="out"
                    ref={outputRef}
                    className="absolute inset-0 p-8 font-mono overflow-auto custom-scrollbar whitespace-pre leading-none bg-black/20 selection:bg-[#00FF41]/40"
                    style={{ 
                      textShadow: '0 0 8px rgba(0, 255, 65, 0.2)',
                      color: '#00FF41',
                      fontSize: `${previewFontSize}px`
                    }}
                  >
                    {output || '(rendered ASCII will show here)'}
                  </pre>
                </div>

                {/* Floating Actions */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <button 
                    onClick={handleCopy}
                    className="p-4 rounded-none bg-[#00FF41] text-black shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:scale-105 active:scale-95 transition-all font-black"
                    title="Copy to Clipboard"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {history.length > 0 && (
            <section className="order-3 lg:order-none lg:hidden bg-[#0D0D0F] border border-white/5 rounded-none p-5 space-y-4 shadow-2xl shrink-0 relative z-20">
              <div className="absolute top-0 left-0 w-1 h-4 bg-[#00FF41]" />
              <div className="absolute top-0 left-0 w-4 h-1 bg-[#00FF41]" />
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                  <History size={12} /> RECENT_LOGS
                </label>
                <button 
                  onClick={() => setHistory([])}
                  className="text-[8px] font-black uppercase tracking-widest text-white/55 hover:text-[#FF5F56]"
                >
                  WIPE
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setText(h.t);
                      setFont(h.f);
                    }}
                    className="px-2 py-1 rounded-none bg-white/5 border border-white/20 text-[10px] font-mono text-white/80 hover:border-[#00FF41]/40 hover:text-[#00FF41] transition-all truncate max-w-[120px]"
                    title={`${h.t} (${h.f})`}
                  >
                    {h.t}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#0D0D0F]/95 border-t border-[#00FF41]/20 backdrop-blur-md">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleExportQr}
              disabled={isExporting}
              className="h-10 px-3 text-[10px] font-black uppercase tracking-widest bg-black/60 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode size={14} /> QR
            </button>
            <button
              onClick={handleCopy}
              className={cn(
                "h-10 px-3 text-[10px] font-black uppercase tracking-widest bg-black/60 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/80 transition-all flex items-center justify-center gap-2",
                copyStatus === 'copied' && "bg-[#00FF41] text-black border-[#00FF41]"
              )}
            >
              <Copy size={14} /> {copyStatus === 'copied' ? 'COPIED' : 'COPY'}
            </button>
            <button 
              onClick={() => handleExportPng(false)}
              disabled={isExporting}
              className="h-10 px-3 text-[10px] font-black uppercase tracking-widest bg-black/60 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ImageIcon size={14} /> PNG
            </button>
            <button 
              onClick={() => handleExportPng(true)}
              disabled={isExporting}
              className="h-10 px-3 text-[10px] font-black uppercase tracking-widest bg-black/60 border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FF41]/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <InfinityIcon size={14} /> ALPHA
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#00FF41]/10 bg-black/30 px-4 py-3 pb-20 sm:pb-3 lg:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[9px] text-[#00FF41]/75 font-mono tracking-[0.14em]">
          <div className="flex items-center gap-2">
            <Info size={10} />
            ENCRYPTED_SESSION_ACTIVE // HASH_SYNC_ENABLED
          </div>
          <a
            href="https://ironsignalworks.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#00FF41]/90 hover:text-[#00FF41] transition-colors"
          >
            BUILT BY IRON SIGNAL WORKS
          </a>
        </div>
      </footer>

      <style>{`
        :root {
          scrollbar-color: rgba(0, 255, 65, 0.45) rgba(0, 255, 65, 0.08);
          scrollbar-width: thin;
        }

        * {
          scrollbar-color: rgba(0, 255, 65, 0.45) rgba(0, 255, 65, 0.08);
          scrollbar-width: thin;
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        *::-webkit-scrollbar-track {
          background: rgba(0, 255, 65, 0.08);
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 65, 0.45);
          border-radius: 0px;
          border: 1px solid rgba(0, 255, 65, 0.2);
        }
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 65, 0.65);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 255, 65, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 65, 0.1);
          border-radius: 0px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 65, 0.3);
        }
        
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .glitch-text:hover {
          animation: glitch 0.2s infinite;
          text-shadow: 2px 0 #ff00ff, -2px 0 #00ffff;
        }

        /* UX typography scale: readable but compact on mobile and desktop */
        .text-\\[8px\\] { font-size: 9px !important; }
        .text-\\[9px\\] { font-size: 10px !important; }
        .text-\\[10px\\] { font-size: 11px !important; }
        .text-\\[11px\\] { font-size: 12px !important; }
        .text-xs { font-size: 0.8125rem !important; }
        .text-sm { font-size: 1rem !important; }

        @keyframes dicePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 255, 65, 0); }
          50% { transform: scale(1.06); box-shadow: 0 0 10px rgba(0, 255, 65, 0.25); }
        }

        .dice-pulse {
          animation: dicePulse 2.2s ease-in-out infinite;
        }

        @keyframes caretBlink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .terminal-caret {
          color: #00FF41;
          font-family: monospace;
          font-size: 12px;
          line-height: 1;
          text-shadow: 0 0 8px rgba(0, 255, 65, 0.4);
          animation: caretBlink 1s steps(1, end) infinite;
        }

        /* Custom range slider styling */
        input[type=range].range-3d {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border: 1px solid rgba(0, 255, 65, 0.2);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.35));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(0, 255, 65, 0.12),
            0 0 0 1px rgba(0, 0, 0, 0.25);
        }

        input[type=range].range-3d::-webkit-slider-runnable-track {
          height: 6px;
          background: transparent;
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          background: #00FF41;
          cursor: pointer;
          border-radius: 0;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
          margin-top: -4px;
        }

        input[type=range].range-3d::-moz-range-track {
          height: 6px;
          border: 1px solid rgba(0, 255, 65, 0.2);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.35));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(0, 255, 65, 0.12);
        }

        input[type=range]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border: 0;
          background: #00FF41;
          border-radius: 0;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
        }
      `}</style>
    </div>
  );
}
