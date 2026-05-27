// src/components/notes/MermaidDiagram.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  onNodeClick?: (label: string) => void;
}

/** Sanitize AI-generated Mermaid — minimal fixes only, don't over-filter */
function sanitizeMermaid(code: string): string {
  if (!code) return '';

  let s = code.trim()
    .replace(/^```mermaid\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/g, '')
    .trim();

  if (!s) return '';

  // ── Fix 1: classDef/class/style lines missing newlines (AI sometimes omits them)
  // Insert a newline before each classDef / class / style keyword that isn't already on its own line
  s = s.replace(/(?<!\n)(classDef\s)/g, '\n$1');
  s = s.replace(/(?<!\n)(class\s+[A-Za-z])/g, '\n$1');
  s = s.replace(/(?<!\n)(style\s+[A-Za-z])/g, '\n$1');

  // ── Fix 2: `classDef end` — "end" is a reserved Mermaid keyword, rename it
  s = s.replace(/\bclassDef\s+end\b/g, 'classDef endNode');
  s = s.replace(/\bclass\s+([A-Za-z0-9,\s]+)\s+end\b/g, (_, nodes) => `class ${nodes.trim()} endNode`);

  // ── Fix 3: --["label"]--> => -->|"label"|
  s = s.replace(/(\w[\w\s]*?)\s*--\s*\["([^"]+)"\]\s*-->/g, '$1 -->|"$2"|');
  s = s.replace(/(\w[\w\s]*?)\s*--\s*\[([^\]]+)\]\s*-->/g, (_, a, lbl) =>
    `${a} -->|"${lbl.trim()}"|`
  );

  // ── Fix 4: edge labels containing parens
  s = s.replace(/\|"([^"]*\([^"]*\)[^"]*)"\|/g, (_, lbl) =>
    `|"${lbl.replace(/[()]/g, '')}"|`
  );

  // ── Fix 5: @ in node IDs
  s = s.replace(/\b([A-Za-z0-9_]*@[A-Za-z0-9_]*)\b/g, (_, id) =>
    id.replace(/[^A-Za-z0-9_]/g, '_')
  );

  // ── Fix 6: Wrap unquoted node labels with special chars in double quotes
  s = s.replace(
    /([A-Za-z0-9_]+)\s*\[([^\]"]*[(){}&:@#!?][^\]"]*)\]/g,
    (_, id, lbl) => `${id}["${lbl.replace(/"/g, "'")}"]`
  );

  // ── Fix 7: Ensure valid diagram type prefix
  const validPrefixes = /^(graph|flowchart|mindmap|sequenceDiagram|gantt|classDiagram|stateDiagram|erDiagram|journey|pie|requirementDiagram)/i;
  if (!validPrefixes.test(s)) {
    const match = s.match(/(flowchart|graph|mindmap|sequenceDiagram|gantt|classDiagram|stateDiagram|erDiagram|journey|pie)/i);
    if (match) {
      s = s.slice(s.indexOf(match[0]));
    } else {
      s = `graph TD\n${s}`;
    }
  }

  return s;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, onNodeClick }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: "'Inter', sans-serif",
      themeVariables: {
        primaryColor: '#8B5CF6',
        primaryTextColor: '#fff',
        primaryBorderColor: '#8B5CF6',
        lineColor: '#e2e8f0',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#fff',
      },
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (typeof window === 'undefined') return;
      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
      try {
        const cleanChart = sanitizeMermaid(chart);
        if (!cleanChart) {
          if (isMounted) setError(true);
          return;
        }
        const { svg } = await mermaid.render(id, cleanChart);
        if (isMounted) {
          setSvg(svg);
          setError(false);
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        }
      } catch (err) {
        console.error('[MermaidDiagram] render failed:', err);
        if (isMounted) setError(true);
      }
    };

    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  // Node click handler
  useEffect(() => {
    if (!containerRef.current || !onNodeClick) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const node = target.closest('.node');
      if (node) {
        const label = node.querySelector('.label') || node.querySelector('text');
        if (label) {
          const text = label.textContent?.trim();
          if (text) onNodeClick(text);
        }
      }
    };
    const container = containerRef.current;
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [svg, onNodeClick]);

  // Wheel zoom — must use native addEventListener with passive:false to call preventDefault
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(4, Math.max(0.3, s * delta)));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
  }, [translate]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTranslate({ x: translateStart.current.x + dx, y: translateStart.current.y + dy });
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    isPanning.current = false;
    (e.currentTarget as HTMLElement).style.cursor = 'grab';
  }, []);

  const resetView = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };
  const zoomIn = () => setScale(s => Math.min(4, s * 1.25));
  const zoomOut = () => setScale(s => Math.max(0.3, s / 1.25));

  if (!chart || !chart.trim()) {
    return (
      <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">🗺️</div>
        <p className="text-sm font-bold">Diagram not generated yet</p>
        <p className="text-xs opacity-60 text-center max-w-xs">
          This diagram wasn't included in the generated content. Try regenerating the note with "Full Mastery Package".
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">⚠️</div>
        <p className="text-sm font-bold italic">Diagram unavailable for this content</p>
        <p className="text-xs opacity-60 text-center max-w-xs">
          The diagram syntax could not be rendered. Check the browser console for the raw chart.
        </p>
        {chart && (
          <details className="w-full max-w-lg mt-2">
            <summary className="text-xs font-bold cursor-pointer text-primary opacity-70 hover:opacity-100">
              Show raw diagram source
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-xl text-[10px] overflow-x-auto whitespace-pre-wrap break-all opacity-70">
              {chart}
            </pre>
          </details>
        )}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="h-64 animate-pulse bg-muted/50 rounded-[2.5rem] flex items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Rendering Diagram...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mr-2">
          {Math.round(scale * 100)}% · Scroll to zoom · Drag to pan
        </span>
        <button onClick={zoomOut} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={zoomIn} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={resetView} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" title="Reset view">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Diagram container — no onWheel here, handled by native listener above */}
      <div
        ref={wrapperRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-500 mermaid-container"
        style={{ height: '420px', cursor: 'grab', userSelect: 'none' }}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning.current ? 'none' : 'transform 0.1s ease',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <style jsx global>{`
        .mermaid-container svg {
          height: auto !important;
          max-width: 100% !important;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.04));
        }
        .mermaid-container .node rect,
        .mermaid-container .node circle,
        .mermaid-container .node polygon {
          stroke-width: 2px !important;
        }
        .mermaid-container .node:hover rect,
        .mermaid-container .node:hover circle {
          filter: brightness(1.1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default MermaidDiagram;
