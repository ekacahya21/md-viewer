import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Copy, Download, Check, Network } from 'lucide-react';
import { copyText } from '../utils/exportUtils';
import { translations } from '../i18n/translations';
import type { Language } from '../types';

interface MermaidModalProps {
  svgContent: string;
  onClose: () => void;
  language?: Language;
}

export const MermaidModal: React.FC<MermaidModalProps> = ({
  svgContent,
  onClose,
  language = 'en',
}) => {
  const t = translations[language] || translations.en;
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragDistanceRef = useRef(0);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    initialDistance?: number;
    initialScale?: number;
  }>({ x: 0, y: 0 });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Pan dragging - Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    dragDistanceRef.current = 0;
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    dragDistanceRef.current += Math.hypot(e.movementX, e.movementY);
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Pan & Pinch-to-zoom - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    dragDistanceRef.current = 0;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - position.x,
        y: (t1.clientY + t2.clientY) / 2 - position.y,
        initialDistance: distance,
        initialScale: scale,
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length === 1 && touchStartRef.current.initialDistance === undefined) {
      const touch = e.touches[0];
      const newX = touch.clientX - touchStartRef.current.x;
      const newY = touch.clientY - touchStartRef.current.y;
      dragDistanceRef.current += 5;
      setPosition({ x: newX, y: newY });
    } else if (e.touches.length === 2 && touchStartRef.current.initialDistance) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = currentDistance / touchStartRef.current.initialDistance;
      const newScale = Math.min(Math.max((touchStartRef.current.initialScale || 1) * ratio, 0.2), 6);
      dragDistanceRef.current += 10;
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchStartRef.current.initialDistance = undefined;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    }
  };

  // Backdrop click dismiss (if not dragged)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current && dragDistanceRef.current < 6) {
      onClose();
    }
  };

  // Zoom on wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.2), 6));
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.25, 6));
  const handleZoomOut = () => setScale((prev) => Math.max(prev * 0.8, 0.2));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCopySvg = async () => {
    await copyText(svgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200 touch-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Modal Top Control Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] text-[var(--text-primary)] z-10 shadow-md min-w-0">
        {/* Left: Icon, Title & Scale */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] flex items-center justify-center flex-shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                {t.mermaidModal.title}
              </span>
              <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full flex-shrink-0">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Zoom Controls */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] active:scale-95 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title={t.mermaidModal.zoomIn}
            aria-label={t.mermaidModal.zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] active:scale-95 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title={t.mermaidModal.zoomOut}
            aria-label={t.mermaidModal.zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] active:scale-95 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title={t.mermaidModal.reset}
            aria-label={t.mermaidModal.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Action Buttons & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Copy SVG */}
          <button
            onClick={handleCopySvg}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] active:scale-95 transition-all flex items-center gap-1.5"
            title={t.mermaidModal.copySvg}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            )}
            <span className="hidden sm:inline">
              {copied ? t.common.copied : t.mermaidModal.copySvg}
            </span>
          </button>

          {/* Download SVG */}
          <button
            onClick={handleDownloadSvg}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-amber)] text-white hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            title={t.mermaidModal.downloadSvg}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.mermaidModal.downloadSvg}</span>
          </button>

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5 sm:mx-1" />

          {/* Close Button - Guaranteed Visible, High Priority, Never Clipped */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/15 active:scale-95 transition-all shadow-sm"
            title={`${t.mermaidModal.close} (Esc)`}
            aria-label={t.mermaidModal.close}
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onClick={handleBackdropClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center p-4 sm:p-8 touch-none relative ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="select-none pointer-events-auto p-4 sm:p-8 rounded-2xl bg-white shadow-2xl max-w-none transition-shadow"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* Desktop Usage Hint */}
      <div className="hidden sm:block absolute bottom-16 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/80 pointer-events-none shadow-lg">
        {t.mermaidModal.panHint}
      </div>

      {/* Floating Bottom Control Dock (Thumb-friendly on mobile, handy on desktop) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1.5 rounded-full bg-[var(--bg-canvas)]/95 border border-[var(--border-subtle)] shadow-2xl backdrop-blur-md text-[var(--text-primary)]">
        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-subtle)] active:scale-95 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={t.mermaidModal.zoomOut}
          aria-label={t.mermaidModal.zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Scale Reset / Display */}
        <button
          onClick={handleReset}
          className="px-2.5 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-subtle)] active:scale-95 transition-colors text-xs font-mono font-medium text-[var(--text-primary)]"
          title={t.mermaidModal.reset}
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-subtle)] active:scale-95 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={t.mermaidModal.zoomIn}
          aria-label={t.mermaidModal.zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Reset Position & Zoom */}
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--bg-subtle)] active:scale-95 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={t.mermaidModal.reset}
          aria-label={t.mermaidModal.reset}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5" />

        {/* Explicit Mobile Close Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-colors font-medium text-xs shadow-sm"
          title={`${t.mermaidModal.close} (Esc)`}
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.mermaidModal.close}</span>
        </button>
      </div>
    </div>
  );
};
