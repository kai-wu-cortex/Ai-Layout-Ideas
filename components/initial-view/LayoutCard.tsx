'use client'

import React from 'react';
import { CanvasElement } from '@/lib/canvas-context';

interface LayoutCardProps {
  layout: CanvasElement[];
  canvasSize: { width: number; height: number };
  onClick: () => void;
}

export const LayoutCard: React.FC<LayoutCardProps> = ({ layout, canvasSize, onClick }) => {
  const aspectRatio = canvasSize.width / canvasSize.height;
  
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white border border-neutral-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-300 aspect-[3/4] flex flex-col"
    >
      <div className="relative flex-1 bg-neutral-50 overflow-hidden p-2">
        <div 
          className="relative w-full h-full border border-neutral-200 bg-white shadow-sm overflow-hidden"
          style={{ 
            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
            margin: 'auto'
          }}
        >
          {layout.map((el, i) => {
            const scaleX = 100 / canvasSize.width;
            const scaleY = 100 / canvasSize.height;
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${el.x * scaleX}%`,
                  top: `${el.y * scaleY}%`,
                  width: `${el.width * scaleX}%`,
                  height: `${el.height * scaleY}%`,
                  backgroundColor: el.style?.backgroundColor || (el.type === 'text' ? 'transparent' : '#f5f5f5'),
                  border: el.style?.border || (el.type === 'placeholder' ? '1px dashed #cbd5e1' : (el.type === 'text' ? 'none' : '1px solid #e5e5e5')),
                  borderRadius: el.type === 'circle' ? '50%' : (el.style?.borderRadius || '0px'),
                  opacity: el.style?.opacity !== undefined ? el.style.opacity : 1,
                  transform: el.style?.rotation ? `rotate(${el.style.rotation}deg)` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {el.type === 'text' && (
                  <div 
                    className="leading-tight text-neutral-800 px-0.5 text-center truncate w-full h-full flex flex-col items-center justify-center"
                    style={{
                      fontSize: `${Math.max(6, (el.style?.fontSize || 24) * scaleX * 0.5)}px`, 
                      fontWeight: el.style?.fontWeight || 'bold',
                      textAlign: (el.style?.textAlign as any) || 'center',
                    }}
                  >
                    {/* Use a placeholder box if the text is too small to be readable, or just show a simplified version */}
                    <div className="w-[80%] h-1.5 bg-neutral-400 rounded-full mb-0.5" />
                    <div className="w-[60%] h-1.5 bg-neutral-300 rounded-full" />
                  </div>
                )}
                {el.type === 'placeholder' && (
                  <div className="w-1/2 h-1/2 border border-neutral-200 opacity-20" />
                )}
                {el.type === 'shape' && (
                  <div 
                    className="w-full h-full" 
                    style={{
                      clipPath: (() => {
                        const shape = el.content?.toLowerCase() || '';
                        if (shape.includes('triangle')) return 'polygon(50% 0%, 0% 100%, 100% 100%)';
                        if (shape.includes('diamond')) return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
                        if (shape.includes('pentagon')) return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
                        if (shape.includes('hexagon')) return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                        if (shape.includes('star')) return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                        return 'none';
                      })()
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-3 border-t border-neutral-100 bg-white group-hover:bg-blue-50 transition-colors">
        <div className="text-xs font-medium text-neutral-600 group-hover:text-blue-600">Layout Option</div>
      </div>
    </div>
  );
};
