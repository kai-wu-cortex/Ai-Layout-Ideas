'use client'

import React, { useRef, useEffect, useState } from 'react';
import { useCanvas } from '@/lib/canvas-context';
import { Element } from './Element';

export function Canvas() {
  const { elements, canvasSize, selectElement, selectElements, selectedIds, scale, setScale, removeElements, reorderElement, showGrid, gridSize, layoutGrid, containerBox, currentTool, setCurrentTool, addElement, updateElement } = useCanvas();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, width: number, height: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [drawingElementId, setDrawingElementId] = useState<string | null>(null);
  const [drawingStartPos, setDrawingStartPos] = useState<{ x: number, y: number } | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number, y: number }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if we are not editing text
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        removeElements(selectedIds);
      } else if (e.key === '[' && selectedIds.length > 0) {
        selectedIds.forEach(id => reorderElement(id, 'down'));
      } else if (e.key === ']' && selectedIds.length > 0) {
        selectedIds.forEach(id => reorderElement(id, 'up'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, removeElements, reorderElement]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomFactor = Math.exp(-e.deltaY * 0.002);
        setScale((prev) => Math.min(Math.max(0.1, prev * zoomFactor), 5));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [setScale]);

  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    if (currentTool !== 'select') {
      setIsDrawing(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (event.clientX - rect.left) / scale;
      const y = (event.clientY - rect.top) / scale;
      
      const id = addElement(currentTool === 'pen' ? 'pen' : 'line');
      setDrawingElementId(id);
      setDrawingStartPos({ x, y });
      setDrawingPoints([{ x, y }]);
      setCurrentPath(`M 0 0`);
      
      updateElement(id, { 
        x, 
        y, 
        width: 1, 
        height: 1, 
        content: `M 0 0` 
      });
      return;
    }

    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }

    if (event.target === canvasRef.current || event.target === containerRef.current || (event.target as HTMLElement).closest('.canvas-wrapper') === event.target) {
      selectElement(null);
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setIsSelecting(true);
      setSelectionBox({
        startX: event.clientX - rect.left + containerRef.current!.scrollLeft,
        startY: event.clientY - rect.top + containerRef.current!.scrollTop,
        width: 0,
        height: 0
      });
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (isDrawing && drawingElementId && drawingStartPos) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const currentX = (event.clientX - rect.left) / scale;
      const currentY = (event.clientY - rect.top) / scale;
      
      let newPoints = [...drawingPoints];
      if (currentTool === 'pen') {
        newPoints.push({ x: currentX, y: currentY });
      } else if (currentTool === 'line') {
        newPoints = [drawingStartPos, { x: currentX, y: currentY }];
      }
      setDrawingPoints(newPoints);

      // Calculate bounding box
      const minX = Math.min(...newPoints.map(p => p.x));
      const minY = Math.min(...newPoints.map(p => p.y));
      const maxX = Math.max(...newPoints.map(p => p.x));
      const maxY = Math.max(...newPoints.map(p => p.y));
      
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);

      // Generate path relative to minX, minY
      let newPath = '';
      if (currentTool === 'line') {
        newPath = `M ${drawingStartPos.x - minX} ${drawingStartPos.y - minY} L ${currentX - minX} ${currentY - minY}`;
      } else {
        // Smoothing for pen tool using quadratic Bezier curves
        if (newPoints.length < 3) {
          newPath = newPoints.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`
          ).join(' ');
        } else {
          newPath = `M ${newPoints[0].x - minX} ${newPoints[0].y - minY}`;
          for (let i = 1; i < newPoints.length - 2; i++) {
            const xc = (newPoints[i].x + newPoints[i + 1].x) / 2;
            const yc = (newPoints[i].y + newPoints[i + 1].y) / 2;
            newPath += ` Q ${newPoints[i].x - minX} ${newPoints[i].y - minY} ${xc - minX} ${yc - minY}`;
          }
          // For the last 2 points
          const lastIndex = newPoints.length - 1;
          newPath += ` Q ${newPoints[lastIndex - 1].x - minX} ${newPoints[lastIndex - 1].y - minY} ${newPoints[lastIndex].x - minX} ${newPoints[lastIndex].y - minY}`;
        }
      }

      setCurrentPath(newPath);
      updateElement(drawingElementId, { 
        x: minX,
        y: minY,
        width,
        height,
        content: newPath 
      });
      return;
    }

    if (isPanning && panStart && containerRef.current) {
      const dx = event.clientX - panStart.x;
      const dy = event.clientY - panStart.y;
      containerRef.current.scrollLeft -= dx;
      containerRef.current.scrollTop -= dy;
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }

    if (!isSelecting || !selectionBox) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left + containerRef.current!.scrollLeft;
    const currentY = event.clientY - rect.top + containerRef.current!.scrollTop;

    setSelectionBox({
      ...selectionBox,
      width: currentX - selectionBox.startX,
      height: currentY - selectionBox.startY
    });
  };

  const handleCanvasMouseUp = (event: React.MouseEvent) => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawingElementId(null);
      setDrawingStartPos(null);
      setDrawingPoints([]);
      setCurrentPath('');
      setCurrentTool('select');
      return;
    }

    if (event.button === 1) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (isSelecting && selectionBox && canvasRef.current && containerRef.current) {
      // Calculate intersection
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const boxLeft = Math.min(selectionBox.startX, selectionBox.startX + selectionBox.width) - (canvasRect.left - containerRect.left + containerRef.current.scrollLeft);
      const boxTop = Math.min(selectionBox.startY, selectionBox.startY + selectionBox.height) - (canvasRect.top - containerRect.top + containerRef.current.scrollTop);
      const boxRight = boxLeft + Math.abs(selectionBox.width);
      const boxBottom = boxTop + Math.abs(selectionBox.height);

      const selected = elements.filter(el => !el.parentId).filter(el => {
        const elLeft = el.x * scale;
        const elTop = el.y * scale;
        const elRight = (el.x + el.width) * scale;
        const elBottom = (el.y + el.height) * scale;

        return !(elRight < boxLeft || elLeft > boxRight || elBottom < boxTop || elTop > boxBottom);
      });

      if (selected.length > 0) {
        selectElements(selected.map(el => el.id));
      }
    }
    
    setIsSelecting(false);
    setSelectionBox(null);
  };

  const handleCanvasMouseLeave = (event: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }
    handleCanvasMouseUp(event);
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 overflow-auto bg-neutral-100 relative select-none ${isPanning ? 'cursor-grabbing' : ''}`} 
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseLeave}
    >
      {isSelecting && selectionBox && (
        <div 
          className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.startX + selectionBox.width),
            top: Math.min(selectionBox.startY, selectionBox.startY + selectionBox.height),
            width: Math.abs(selectionBox.width),
            height: Math.abs(selectionBox.height)
          }}
        />
      )}
      <div className="w-full h-full flex items-center justify-center canvas-wrapper" style={{ padding: `32px`, minWidth: `${canvasSize.width + 64}px`, minHeight: `${canvasSize.height + 64}px` }}>
        <div 
          id="main-canvas"
          ref={canvasRef}
          className="relative bg-white shadow-xl transition-shadow duration-300"
          style={{ 
            width: canvasSize.width, 
            height: canvasSize.height,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            backgroundImage: showGrid ? `linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)` : 'none',
            backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto'
          }}
        >
          {containerBox.enabled && (
            <div 
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-x-2 border-dashed border-red-400/50 pointer-events-none z-30"
              style={{ width: `${containerBox.width}px` }}
            />
          )}
          {layoutGrid.enabled && (
            <div className="absolute inset-0 pointer-events-none z-40 flex" style={{ padding: `0 ${layoutGrid.margin}px`, gap: `${layoutGrid.gutter}px` }}>
              {Array.from({ length: layoutGrid.columns }).map((_, i) => (
                <div key={i} className="flex-1 h-full" style={{ backgroundColor: layoutGrid.color }} />
              ))}
            </div>
          )}
          {elements.filter(el => !el.parentId).map(el => (
            <Element key={el.id} element={el} isSelected={selectedIds.includes(el.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
