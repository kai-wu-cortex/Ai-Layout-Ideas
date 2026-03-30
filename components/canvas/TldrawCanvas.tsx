'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { Tldraw, Editor, createShapeId, TLShapePartial } from 'tldraw';
import 'tldraw/tldraw.css';
import { useCanvas, CanvasElement } from '@/lib/canvas-context';

export function TldrawCanvas() {
  const { elements, canvasSize, setElements, setIsInitialView, setTldrawEditor } = useCanvas();
  const [editor, setEditor] = useState<Editor | null>(null);

  const syncToEditor = useCallback((editor: Editor) => {
    if (!editor || editor.isDisposed) return;

    const mapToTldrawColor = (color: string | undefined): any => {
      if (!color || color === 'transparent') return 'black';
      const c = color.toLowerCase().trim();
      
      // Standard tldraw colors
      const tldrawColors = ['black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow', 'orange', 'green', 'light-green', 'light-red', 'red', 'white'];
      
      if (tldrawColors.includes(c)) return c;
      
      if (c === '#ffffff' || c === 'white') return 'white';
      if (c === '#000000' || c === 'black') return 'black';
      
      // Map common hex to tldraw colors
      if (c.startsWith('#')) {
        if (c.startsWith('#ff0000') || c.startsWith('#ff4')) return 'red';
        if (c.startsWith('#0000ff') || c.startsWith('#007')) return 'blue';
        if (c.startsWith('#00ff00') || c.startsWith('#22c')) return 'green';
        if (c.startsWith('#ffff00') || c.startsWith('#fde')) return 'yellow';
        if (c.startsWith('#ffa500') || c.startsWith('#f97')) return 'orange';
        if (c.startsWith('#f')) return 'white';
        if (c.startsWith('#e')) return 'white';
        if (c.startsWith('#d') || c.startsWith('#c') || c.startsWith('#b') || c.startsWith('#a') || c.startsWith('#9') || c.startsWith('#8')) return 'grey';
      }
      
      return 'black';
    };

    // Clear existing shapes
    const shapes = editor.getCurrentPageShapes();
    if (shapes.length > 0) {
      editor.deleteShapes(shapes.map(s => s.id));
    }
    
    // Set canvas size by drawing a frame
    editor.createShapes([
      {
        id: createShapeId('canvas-frame'),
        type: 'frame',
        x: 0,
        y: 0,
        props: {
          w: canvasSize.width || 800,
          h: canvasSize.height || 1200,
          name: 'Poster Canvas',
        },
      },
    ]);

    // Convert existing elements to tldraw shapes
    const tldrawShapes: TLShapePartial[] = elements.flatMap((el) => {
      const parentId = createShapeId('canvas-frame');
      
      if (el.type === 'text' || el.type === 'button') {
        const shapes: TLShapePartial[] = [];
        
        // Background shape for buttons or text with background
        if (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') {
          shapes.push({
            id: createShapeId(`el-${el.id}-bg`),
            type: 'geo',
            x: el.x,
            y: el.y,
            parentId,
            props: {
              geo: 'rectangle',
              w: el.width,
              h: el.height,
              fill: 'solid',
              dash: 'solid',
              color: mapToTldrawColor(el.style.backgroundColor),
            },
          });
        }

        // Text shape
        shapes.push({
          id: createShapeId(`el-${el.id}`),
          type: 'text',
          x: el.x,
          y: el.y,
          parentId,
          props: {
            text: el.content || ' ',
            // w: el.width, // Removing 'w' as it might be unexpected for 'text' type in some versions
            autoSize: true,
            size: el.style?.fontSize && el.style.fontSize > 40 ? 'l' : (el.style?.fontSize && el.style.fontSize > 24 ? 'm' : 's'),
            font: 'sans',
            align: el.style?.textAlign === 'center' ? 'middle' : (el.style?.textAlign === 'right' ? 'end' : 'start'),
            color: mapToTldrawColor(el.style?.color),
          },
        });
        
        return shapes;
      }

      const id = createShapeId(`el-${el.id}`);
      
      if (el.type === 'circle') {
        return [{
          id,
          type: 'geo',
          x: el.x,
          y: el.y,
          parentId,
          props: {
            geo: 'ellipse',
            w: el.width,
            h: el.height,
            fill: 'solid',
            dash: 'solid',
            color: mapToTldrawColor(el.style?.backgroundColor),
          },
        }];
      }

      if (el.type === 'shape') {
        let geo: any = 'rectangle';
        const shapeType = el.content?.toLowerCase() || '';
        if (shapeType.includes('triangle')) geo = 'triangle';
        else if (shapeType.includes('diamond')) geo = 'diamond';
        else if (shapeType.includes('pentagon')) geo = 'pentagon';
        else if (shapeType.includes('hexagon')) geo = 'hexagon';
        else if (shapeType.includes('star')) geo = 'star';

        return [{
          id,
          type: 'geo',
          x: el.x,
          y: el.y,
          parentId,
          props: {
            geo,
            w: el.width,
            h: el.height,
            fill: 'solid',
            dash: 'solid',
            color: mapToTldrawColor(el.style?.backgroundColor),
          },
        }];
      }

      if (el.type === 'line') {
        return [{
          id,
          type: 'line',
          x: el.x,
          y: el.y,
          parentId,
          props: {
            points: {
              'a1': { id: 'a1', index: 'a1', x: 0, y: 0 },
              'a2': { id: 'a2', index: 'a2', x: el.width, y: el.height },
            },
            color: mapToTldrawColor(el.style?.color),
            dash: 'draw',
          },
        }];
      }

      if (el.type === 'image') {
        return [{
          id,
          type: 'image',
          x: el.x,
          y: el.y,
          parentId,
          props: {
            w: el.width,
            h: el.height,
            url: el.content || '',
          },
        }];
      }

      // Default for rectangle or others (placeholders, groups)
      if (el.type === 'group') return []; // Skip group elements in tldraw as they are layout-only

      return [{
        id,
        type: 'geo',
        x: el.x,
        y: el.y,
        parentId,
        props: {
          geo: 'rectangle',
          w: el.width,
          h: el.height,
          fill: el.type === 'placeholder' ? 'none' : 'solid',
          dash: el.type === 'placeholder' ? 'dashed' : 'solid',
          color: mapToTldrawColor(el.style?.backgroundColor),
        },
      }];
    });

    // Create shapes individually to catch errors
    tldrawShapes.forEach(shape => {
      try {
        editor.createShape(shape);
      } catch (e) {
        console.error('Failed to create shape:', JSON.stringify(shape), e);
      }
    });
    
    // Zoom to fit the frame
    setTimeout(() => {
      if (!editor || editor.isDisposed) return;
      try {
        editor.zoomToFit();
      } catch (e) {
        console.warn('Failed to zoom to fit:', e);
      }
    }, 100);
  }, [canvasSize, elements]);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
    setTldrawEditor(editor);
    syncToEditor(editor);
  }, [setTldrawEditor, syncToEditor]);

  // Update tldraw when elements change from outside (e.g. InitialView)
  useEffect(() => {
    if (editor && elements.length > 0) {
      const currentShapes = editor.getCurrentPageShapes();
      const hasElements = currentShapes.some(s => s.id.toString().includes('el-'));
      
      if (!hasElements) {
        syncToEditor(editor);
      }
    }
  }, [elements, editor, syncToEditor]);

  return (
    <div className="flex-1 relative bg-neutral-100">
      <div className="absolute inset-0">
        <Tldraw 
          onMount={handleMount}
          inferDarkMode={false}
        />
      </div>
    </div>
  );
}
