// src/components/notes/MermaidDiagram.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Bot } from 'lucide-react';
import type { PromptSource } from '@/lib/chatPrompts';

interface MermaidDiagramProps {
  chart: string;
  onNodeClick?: (label: string, source: PromptSource) => void;
  diagramSource?: PromptSource;
  onFixDiagram?: (chart: string) => void;
}

function sanitizeMermaid(code: string): string {
  if (!code) return '';

  let s = code.trim()
    .replace(/^```mermaid\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/g, '')
    .trim();

  if (!s) return '';

  s = s.replace(/(?<!\n)(classDef\s)/g, '\n$1');
  s = s.replace(/(?<!\n)(class\s+[A-Za-z])/g, '\n$1');
  s = s.replace(/(?<!\n)(style\s+[A-Za-z])/g, '\n$1');
  s = s.replace(/\bclassDef\s+end\b/g, 'classDef endNode');
  s = s.replace(/\bclass\s+([A-Za-z0-9,\s]+)\s+end\b/g, (_, nodes) => `class ${nodes.trim()} endNode`);
  s = s.replace(/(\w[\w\s]*?)\s*--\s*\["([^"]+)"\]\s*-->/g, '$1 -->|"$2"|');
  s = s.replace(/(\w[\w\s]*?)\s*--\s*\[([^\]]+)\]\s*-->/g, (_, a, lbl) =>
    `${a} -->|"${lbl.trim()}"|`
  );
  s = s.replace(/\|"([^"]*\([^"]*\)[^"]*)"\|/g, (_, lbl) =>
    `|"${lbl.replace(/[()]/g, '')}"|`
  );
  s = s.replace(/\b([A-Za-z0-9_]*@[A-Za-z0-9_]*)\b/g, (_, id) =>
    id.replace(/[^A-Za-z0-9_]/g, '_')
  );
  s = s.replace(
    /([A-Za-z0-9_]+)\s*\[([^\]"]*[(){}&:@#!?][^\]"]*)\]/g,
    (_, id, lbl) => `${id}["${lbl.replace(/"/g, "'")}"]`
  );

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

/** Walk up DOM to find a Mermaid node (flowchart + mindmap). */
function findMermaidNodeElement(target: EventTarget | null, root: Element): Element | null {
  if (!target || !(target instanceof Element)) return null;
  let el: Element | null = target;
  while (el && el !== root) {
    const cls = el.getAttribute('class') || '';
    if (
      el.classList.contains('node') ||
      cls.includes('mindmap-node') ||
      cls.includes('section-') ||
      cls.includes('mindmap')
    ) {
      return el;
    }
    if (el.tagName === 'g' && (el.querySelector('foreignObject') || el.querySelector('.nodeLabel'))) {
      const label = extractNodeLabel(el);
      if (label) return el;
    }
    el = el.parentElement;
  }
  return null;
}

function extractNodeLabel(node: Element): string | null {
  const fo = node.querySelector('foreignObject');
  if (fo?.textContent?.trim()) {
    return fo.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  const nodeLabel = node.querySelector('.nodeLabel');
  if (nodeLabel?.textContent?.trim()) {
    return nodeLabel.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  const texts = Array.from(node.querySelectorAll('text, tspan'))
    .map((t) => t.textContent?.trim())
    .filter((t): t is string => Boolean(t && t.length > 0));
  if (texts.length === 1) return texts[0].slice(0, 120);
  if (texts.length > 1 && texts.length <= 4) {
    return texts.join(' ').slice(0, 120);
  }
  return null;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  onNodeClick,
  diagramSource = 'diagram',
  onFixDiagram,
}) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const didPan = useRef(false);

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
        const { svg: rendered } = await mermaid.render(id, cleanChart);
        if (isMounted) {
          setSvg(rendered);
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onNodeClick) return;

    const handleClick = (e: MouseEvent) => {
      if (didPan.current) {
        didPan.current = false;
        return;
      }
      const node = findMermaidNodeElement(e.target, container);
      if (!node) return;
      const text = extractNodeLabel(node);
      if (!text) return;
      e.stopPropagation();
      e.preventDefault();
      onNodeClick(text, diagramSource);
    };

    container.addEventListener('click', handleClick, true);
    return () => {
      container.removeEventListener('click', handleClick, true);
    };
  }, [svg, onNodeClick, diagramSource]);

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

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (findMermaidNodeElement(target, containerRef.current!)) return;
    isPanning.current = true;
    didPan.current = false;
    setPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
  }, [translate]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didPan.current = true;
    setTranslate({ x: translateStart.current.x + dx, y: translateStart.current.y + dy });
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    isPanning.current = false;
    setPanning(false);
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
          Use &quot;Full Mastery Package&quot; or &quot;Exam Tomorrow&quot; on upload to include roadmap &amp; mind maps.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">⚠️</div>
        <p className="text-sm font-bold italic">Diagram unavailable for this content</p>
        {onFixDiagram && (
          <button
            type="button"
            onClick={() => onFixDiagram(chart)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Bot className="w-4 h-4" />
            Ask AI to fix diagram
          </button>
        )}
        <details className="w-full max-w-lg mt-2">
          <summary className="text-xs font-bold cursor-pointer text-primary opacity-70 hover:opacity-100">
            Show raw diagram source
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-xl text-[10px] overflow-x-auto whitespace-pre-wrap break-all opacity-70">
            {chart}
          </pre>
        </details>
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
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mr-2">
          {Math.round(scale * 100)}% · Scroll to zoom · Drag background to pan
        </span>
        <button type="button" onClick={zoomOut} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={zoomIn} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={resetView} className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors" title="Reset view">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

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
            transition: panning ? 'none' : 'transform 0.1s ease',
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
        }
        .mermaid-container .node rect,
        .mermaid-container .node circle,
        .mermaid-container .node polygon,
        .mermaid-container g[class*='mindmap'] rect,
        .mermaid-container g[class*='section'] rect {
          cursor: pointer !important;
        }
        .mermaid-container .node:hover rect,
        .mermaid-container .node:hover circle,
        .mermaid-container g[class*='mindmap']:hover rect {
          filter: brightness(1.08);
        }
        .mermaid-container foreignObject {
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};

export default MermaidDiagram;
