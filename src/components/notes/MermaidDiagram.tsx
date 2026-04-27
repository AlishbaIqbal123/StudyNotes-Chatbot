// src/components/notes/MermaidDiagram.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false, // Changed to false for manual rendering
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: "'Inter', sans-serif",
      themeVariables: {
        primaryColor: '#E60023',
        primaryTextColor: '#fff',
        primaryBorderColor: '#E60023',
        lineColor: '#e2e8f0',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#fff',
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart || typeof window === 'undefined') return;
      
      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
      try {
        // Clean up text to avoid mermaid syntax errors
        const cleanChart = chart.trim().replace(/```mermaid/g, '').replace(/```/g, '');
        if (!cleanChart) return;

        const { svg } = await mermaid.render(id, cleanChart);
        if (isMounted) {
          setSvg(svg);
          setError(false);
        }
      } catch (err) {
        console.error('Mermaid render failed:', err);
        if (isMounted) setError(true);
      }
    };

    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (error) {
    return (
      <div className="p-12 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">⚠️</div>
        <p className="text-sm font-bold italic">Diagram unavailable for this specific content</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="h-64 animate-pulse bg-muted/50 rounded-[2.5rem] flex items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Generating Concept Map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div 
        ref={containerRef}
        className="flex justify-center overflow-x-auto p-12 bg-card rounded-[3rem] border border-border shadow-sm hover:shadow-xl transition-all duration-500 mermaid-container" 
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
      <style jsx global>{`
        .mermaid-container svg {
          height: auto !important;
          max-width: 100% !important;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.03));
        }
        .mermaid-container .node rect, 
        .mermaid-container .node circle, 
        .mermaid-container .node polygon {
          stroke-width: 2px !important;
        }
      `}</style>
    </div>
  );
};

export default MermaidDiagram;
