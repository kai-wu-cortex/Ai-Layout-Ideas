'use client'

import React, { useState } from 'react';
import { CanvasElement, useCanvas, ElementType } from '@/lib/canvas-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Download, LayoutDashboard, Sparkles, Loader2, Plus, Minus, Grid, Magnet, Group, Ungroup, ArrowLeft, Figma } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export function TopBar() {
  const { canvasSize, setCanvasSize, elements, setElements, scale, setScale, showGrid, setShowGrid, snapToGrid, setSnapToGrid, gridSize, setGridSize, selectedIds, groupElements, ungroupElements, setIsInitialView, tldrawEditor } = useCanvas();
  const [width, setWidth] = useState(canvasSize.width.toString());
  const [height, setHeight] = useState(canvasSize.height.toString());
  const [isExporting, setIsExporting] = useState(false);

  // Sync local state with context when it changes externally (e.g. from InitialView)
  React.useEffect(() => {
    setWidth(canvasSize.width.toString());
    setHeight(canvasSize.height.toString());
  }, [canvasSize.width, canvasSize.height]);

  const isGroupSelected = selectedIds.length === 1 && elements.find(el => el.id === selectedIds[0])?.type === 'group';

  const handleResize = () => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    // Only update if values are different from context to avoid unnecessary resets
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0 && (w !== canvasSize.width || h !== canvasSize.height)) {
      setCanvasSize({ width: w, height: h });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (tldrawEditor) {
        // Use tldraw's native export if available
        // For now, we'll stick to html-to-image as it captures the whole frame easily
        const node = document.querySelector('.tl-canvas');
        if (!node) throw new Error('Canvas not found');
        
        const dataUrl = await htmlToImage.toPng(node as HTMLElement, {
          quality: 1,
          pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = 'poster-design.png';
        link.href = dataUrl;
        link.click();
      } else {
        const node = document.getElementById('main-canvas');
        if (!node) throw new Error('Canvas not found');
        
        const dataUrl = await htmlToImage.toPng(node, {
          quality: 1,
          pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = 'poster-design.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFigma = () => {
    // Generate a simple JSON that can be used with Figma plugins
    let exportElements = elements;
    
    if (tldrawEditor) {
      const shapes = tldrawEditor.getCurrentPageShapes();
      exportElements = shapes.map((s: any) => ({
        id: s.id,
        type: s.type,
        x: s.x,
        y: s.y,
        width: s.props?.w || 0,
        height: s.props?.h || 0,
        content: s.props?.text || s.props?.geo || '',
        style: s.props
      }));
    }

    const figmaData = {
      name: "Poster Design",
      canvasSize,
      elements: exportElements.map(el => ({
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        content: el.content,
        style: el.style
      }))
    };

    const blob = new Blob([JSON.stringify(figmaData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'poster-figma-export.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
          <LayoutDashboard className="w-5 h-5" />
          <span>AI Poster Studio</span>
        </div>
        
        <div className="h-6 w-px bg-neutral-200 mx-2" />
        
        <div className="flex items-center gap-2">
          <Label className="text-xs text-neutral-500">Canvas Size:</Label>
          <span className="text-xs font-medium">{canvasSize.width} x {canvasSize.height}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50"
          onClick={() => setIsInitialView(true)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Layouts
        </Button>

        <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-2">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PNG
        </Button>

        <Button size="sm" variant="outline" onClick={handleExportFigma} className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
          <Figma className="w-4 h-4" />
          Export Figma
        </Button>
      </div>
    </div>
  );
}
