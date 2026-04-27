// src/components/notes/GallerySection.tsx
'use client';

import React from 'react';

interface GallerySectionProps {
  content: string;
}

const GallerySection: React.FC<GallerySectionProps> = ({ content }) => {
  // Extract images from markdown
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  const images: { alt: string, src: string }[] = [];
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    images.push({ alt: match[1], src: match[2] });
  }

  if (images.length === 0) {
    return (
      <div className="p-20 text-center opacity-50 italic">
        No visual summary available for this note.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {images.map((img, i) => (
        <div key={i} className="group relative">
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl aspect-[16/10] bg-muted border border-border/50">
            <img 
              src={img.src} 
              alt={img.alt} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
              <p className="text-white font-black text-xl leading-tight">
                {img.alt}
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
            Visual Concept {i + 1}
          </p>
        </div>
      ))}
    </div>
  );
};

export default GallerySection;
