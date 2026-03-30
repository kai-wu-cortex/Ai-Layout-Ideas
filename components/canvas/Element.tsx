'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { CanvasElement, useCanvas } from '@/lib/canvas-context';
import { Loader2, Image as ImageIcon, Pen, LayoutTemplate } from 'lucide-react';

interface ElementProps {
  element: CanvasElement;
  isSelected: boolean;
}

export function Element({ element, isSelected }: ElementProps) {
  const { updateElement, selectElement, scale, snapToGrid, gridSize, elements, selectedIds } = useCanvas();
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const children = elements.filter(el => el.parentId === element.id);
  const parent = elements.find(el => el.id === element.parentId);
  const isAutoLayoutActive = parent?.type === 'group' && parent?.layout?.mode !== 'none';

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
    }
  }, [isEditing]);

  const handleDragStop = (e: any, d: any) => {
    let newX = d.x;
    let newY = d.y;
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    updateElement(element.id, { x: newX, y: newY });
  };

  const handleResizeStop = (e: any, direction: any, ref: any, delta: any, position: any) => {
    let newWidth = parseInt(ref.style.width, 10);
    let newHeight = parseInt(ref.style.height, 10);
    let newX = position.x;
    let newY = position.y;

    if (snapToGrid) {
      newWidth = Math.max(gridSize, Math.round(newWidth / gridSize) * gridSize);
      newHeight = Math.max(gridSize, Math.round(newHeight / gridSize) * gridSize);
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    updateElement(element.id, {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY,
    });
  };

  const handleDoubleClick = () => {
    if (element.type === 'text') {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const renderContent = () => {
    if (element.isGenerating) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-500 rounded-md border border-neutral-200">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <span className="text-sm font-medium">Generating AI Content...</span>
        </div>
      );
    }

    const commonStyle = {
      backgroundColor: element.style?.backgroundColor || '#e5e5e5',
      borderRadius: element.style?.borderRadius || '0px',
      border: element.style?.border || 'none',
      opacity: element.style?.opacity !== undefined ? element.style.opacity : 1,
      transform: element.style?.transform || (element.style?.rotation ? `rotate(${element.style.rotation}deg)` : undefined),
    };

    switch (element.type) {
      case 'text':
        const textStyle = {
          fontSize: element.style?.fontSize ? `${element.style.fontSize}px` : '24px',
          color: element.style?.color || '#000000',
          backgroundColor: element.style?.backgroundColor || 'transparent',
          fontFamily: element.style?.fontFamily || 'sans-serif',
          textAlign: element.style?.textAlign || 'left',
          fontWeight: element.style?.fontWeight || 'normal',
          lineHeight: element.style?.lineHeight || 1.2,
          letterSpacing: element.style?.letterSpacing ? `${element.style.letterSpacing}px` : 'normal',
          transform: commonStyle.transform,
          opacity: commonStyle.opacity,
        };
        
        return isEditing ? (
          <textarea
            ref={textRef}
            value={element.content || ''}
            onChange={(e) => updateElement(element.id, { content: e.target.value })}
            onBlur={handleBlur}
            className="w-full h-full resize-none outline-none bg-transparent p-1"
            style={textStyle}
            autoFocus
          />
        ) : (
          <div 
            className="w-full h-full break-words whitespace-pre-wrap p-1"
            style={textStyle}
          >
            {element.content || 'Double click to edit'}
          </div>
        );
      case 'image':
        return element.content ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={element.content} 
            alt="Canvas Element" 
            className="w-full h-full object-cover pointer-events-none rounded-md"
            style={{ transform: commonStyle.transform, opacity: commonStyle.opacity }}
          />
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 border-2 border-dashed border-neutral-300 rounded-md"
            style={{ transform: commonStyle.transform, opacity: commonStyle.opacity }}
          >
            <ImageIcon className="h-10 w-10 mb-2" />
            <span className="text-sm font-medium">Empty Image</span>
          </div>
        );
      case 'circle':
        return (
          <div 
            className="w-full h-full rounded-full"
            style={{
              ...commonStyle,
              borderRadius: '50%',
            }}
          />
        );
      case 'pen':
        return (
          <svg 
            className="w-full h-full pointer-events-none" 
            viewBox={`0 0 ${element.width} ${element.height}`}
            preserveAspectRatio="none"
            style={{ transform: commonStyle.transform, opacity: commonStyle.opacity }}
          >
            <path d={element.content} fill="none" stroke="black" strokeWidth="2" />
          </svg>
        );
      case 'line':
        return (
          <div 
            className="w-full h-full"
            style={{
              ...commonStyle,
              height: `${element.height}px`,
              backgroundColor: element.style?.color || '#000000',
            }}
          />
        );
      case 'placeholder':
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-300 rounded-md"
            style={{
              ...commonStyle,
              backgroundColor: element.style?.backgroundColor || '#f5f5f5',
              border: element.style?.border || '2px dashed #cbd5e1',
            }}
          >
            <LayoutTemplate className="h-10 w-10 mb-2" />
            <span className="text-sm font-medium text-center px-2">Placeholder</span>
          </div>
        );
      case 'shape':
        const getClipPath = () => {
          const shape = element.content?.toLowerCase() || '';
          if (shape.includes('triangle')) return 'polygon(50% 0%, 0% 100%, 100% 100%)';
          if (shape.includes('diamond')) return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
          if (shape.includes('pentagon')) return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
          if (shape.includes('hexagon')) return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
          if (shape.includes('star')) return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
          return 'none';
        };
        return (
          <div 
            className="w-full h-full"
            style={{
              ...commonStyle,
              clipPath: getClipPath(),
            }}
          />
        );
      case 'group':
        return (
          <div 
            className="w-full h-full relative"
            style={{
              backgroundColor: element.style?.backgroundColor || 'transparent',
              border: element.style?.border || (isSelected ? '1px solid #3b82f6' : '1px dashed #cbd5e1'),
              borderRadius: element.style?.borderRadius || '0px',
              transform: commonStyle.transform,
              opacity: commonStyle.opacity,
            }}
          >
            {children.map(child => (
              <Element 
                key={child.id} 
                element={child} 
                isSelected={selectedIds.includes(child.id)}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Rnd
      size={{ width: element.width, height: element.height }}
      position={{ x: element.x, y: element.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="parent"
      scale={scale}
      grid={snapToGrid ? [gridSize, gridSize] : [1, 1]}
      className={`${isSelected ? 'ring-2 ring-blue-500 z-50' : 'hover:ring-1 hover:ring-blue-300 z-10'}`}
      dragHandleClassName="drag-handle"
      disableDragging={isEditing}
      enableResizing={{ top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }}
    >
      <div 
        className={`w-full h-full relative ${!isEditing ? 'drag-handle cursor-move' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          selectElement(element.id, e.shiftKey || e.metaKey || e.ctrlKey);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleDoubleClick();
        }}
      >
        {renderContent()}
      </div>
    </Rnd>
  );
}
