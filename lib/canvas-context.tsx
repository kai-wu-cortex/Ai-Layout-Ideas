'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'text' | 'image' | 'placeholder' | 'shape' | 'circle' | 'group' | 'pen' | 'line';
export type ToolType = 'select' | 'pen' | 'line';

export interface LayoutConfig {
  mode: 'none' | 'horizontal' | 'vertical';
  spacing: number;
  padding: { top: number; right: number; bottom: number; left: number };
  align: 'start' | 'center' | 'end' | 'stretch';
  justify: 'start' | 'center' | 'end' | 'space-between';
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; // text content or image URL
  style?: any; // CSS styles
  aiPrompt?: string; // prompt for AI generation
  isGenerating?: boolean;
  parentId?: string;
  layout?: LayoutConfig;
}

export interface CanvasTemplate {
  id: string;
  name: string;
  elements: CanvasElement[];
  canvasSize: { width: number; height: number };
}

export interface LayoutGridConfig {
  enabled: boolean;
  columns: number;
  gutter: number;
  margin: number;
  color: string;
}

export interface ContainerBoxConfig {
  enabled: boolean;
  width: number;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  canvasSize: { width: number; height: number };
  scale: number;
  templates: CanvasTemplate[];
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layoutGrid: LayoutGridConfig;
  setLayoutGrid: React.Dispatch<React.SetStateAction<LayoutGridConfig>>;
  containerBox: ContainerBoxConfig;
  setContainerBox: React.Dispatch<React.SetStateAction<ContainerBoxConfig>>;
  currentTool: ToolType;
  setCurrentTool: React.Dispatch<React.SetStateAction<ToolType>>;
  isInitialView: boolean;
  setIsInitialView: React.Dispatch<React.SetStateAction<boolean>>;
  layoutPrompt: string;
  setLayoutPrompt: React.Dispatch<React.SetStateAction<string>>;
  layoutReferenceImage: string | null;
  setLayoutReferenceImage: React.Dispatch<React.SetStateAction<string | null>>;
  generatedLayouts: CanvasElement[][];
  setGeneratedLayouts: React.Dispatch<React.SetStateAction<CanvasElement[][]>>;
  layoutPage: number;
  setLayoutPage: React.Dispatch<React.SetStateAction<number>>;
  hasStartedLayoutGen: boolean;
  setHasStartedLayoutGen: React.Dispatch<React.SetStateAction<boolean>>;
  includePlaceholders: boolean;
  setIncludePlaceholders: React.Dispatch<React.SetStateAction<boolean>>;
  tldrawEditor: any;
  setTldrawEditor: (editor: any) => void;
  addElement: (type: ElementType, initialContent?: string) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  selectElement: (id: string | null, multi?: boolean) => void;
  selectElements: (ids: string[]) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;
  groupElements: (ids: string[]) => string | null;
  ungroupElements: (id: string) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  setSnapToGrid: React.Dispatch<React.SetStateAction<boolean>>;
  setGridSize: React.Dispatch<React.SetStateAction<number>>;
}

const CanvasContext = createContext<CanvasState | undefined>(undefined);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1200 });
  const [scale, setScale] = useState(1);
  const [templates, setTemplates] = useState<CanvasTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('canvasTemplates');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse templates', e);
        }
      }
    }
    return [];
  });
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [layoutGrid, setLayoutGrid] = useState<LayoutGridConfig>({
    enabled: false,
    columns: 12,
    gutter: 20,
    margin: 40,
    color: 'rgba(255, 0, 0, 0.1)',
  });
  const [containerBox, setContainerBox] = useState<ContainerBoxConfig>({
    enabled: false,
    width: 1200,
  });
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [isInitialView, setIsInitialView] = useState(true);
  const [layoutPrompt, setLayoutPrompt] = useState('');
  const [layoutReferenceImage, setLayoutReferenceImage] = useState<string | null>(null);
  const [generatedLayouts, setGeneratedLayouts] = useState<CanvasElement[][]>([]);
  const [layoutPage, setLayoutPage] = useState(1);
  const [hasStartedLayoutGen, setHasStartedLayoutGen] = useState(false);
  const [includePlaceholders, setIncludePlaceholders] = useState(true);
  const [tldrawEditor, setTldrawEditor] = useState<any>(null);

  // Save templates to local storage when updated
  useEffect(() => {
    localStorage.setItem('canvasTemplates', JSON.stringify(templates));
  }, [templates]);

  const saveTemplate = useCallback((name: string) => {
    // If tldraw is active, we should probably save its state
    let elementsToSave = elements;
    if (tldrawEditor) {
      // Convert tldraw shapes back to elements if possible, or just save the snapshot
      // For now, we'll just save the current elements in context
      // In a real app, we'd sync tldraw -> elements before saving
    }

    const newTemplate: CanvasTemplate = {
      id: uuidv4(),
      name,
      elements: JSON.parse(JSON.stringify(elementsToSave)), // Deep copy
      canvasSize: { ...canvasSize }
    };
    setTemplates(prev => [...prev, newTemplate]);
  }, [elements, canvasSize, tldrawEditor]);

  const loadTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setElements(JSON.parse(JSON.stringify(template.elements))); // Deep copy
      setCanvasSize({ ...template.canvasSize });
      setSelectedIds([]);
      
      // If tldraw is active, it will be updated by the useEffect in TldrawCanvas
    }
  }, [templates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const addElement = useCallback((type: ElementType, initialContent?: string) => {
    const newElement: CanvasElement = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      width: type === 'text' ? 200 : 300,
      height: type === 'text' ? 50 : 300,
      content: initialContent || (type === 'text' ? 'Double click to edit' : ''),
      style: {
        fontSize: 24,
        color: '#000000',
        fontFamily: 'Inter',
        textAlign: 'left',
        fontWeight: 'normal',
        backgroundColor: (type === 'shape' || type === 'placeholder') ? '#e5e5e5' : 'transparent',
        borderRadius: (type === 'shape' || type === 'placeholder') ? '0px' : undefined,
      }
    };
    setElements(prev => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    return newElement.id;
  }, []);

  // Auto Layout Engine
  const applyAutoLayout = useCallback((currentElements: CanvasElement[]) => {
    let newElements = [...currentElements];
    let changed = false;
    let iterations = 0;

    do {
      changed = false;
      const groups = newElements.filter(el => el.type === 'group' && el.layout && el.layout.mode !== 'none');

      groups.forEach(group => {
        const children = newElements.filter(child => child.parentId === group.id);
        if (children.length === 0) return;

        let currentX = group.layout!.padding.left;
        let currentY = group.layout!.padding.top;
        const spacing = group.layout!.spacing;

        const maxWidth = Math.max(...children.map(c => c.width));
        const maxHeight = Math.max(...children.map(c => c.height));

        children.forEach(child => {
          const idx = newElements.findIndex(fe => fe.id === child.id);
          if (idx !== -1) {
            let newX = child.x;
            let newY = child.y;
            let newChildWidth = child.width;
            let newChildHeight = child.height;

            if (group.layout?.mode === 'vertical') {
              if (group.layout.align === 'stretch') {
                newChildWidth = maxWidth;
                newX = group.layout.padding.left;
              } else if (group.layout.align === 'center') {
                newX = group.layout.padding.left + (maxWidth - child.width) / 2;
              } else if (group.layout.align === 'end') {
                newX = group.layout.padding.left + maxWidth - child.width;
              } else {
                newX = group.layout.padding.left;
              }
              newY = currentY;
              currentY += child.height + spacing;
            } else if (group.layout?.mode === 'horizontal') {
              newX = currentX;
              if (group.layout.align === 'stretch') {
                newChildHeight = maxHeight;
                newY = group.layout.padding.top;
              } else if (group.layout.align === 'center') {
                newY = group.layout.padding.top + (maxHeight - child.height) / 2;
              } else if (group.layout.align === 'end') {
                newY = group.layout.padding.top + maxHeight - child.height;
              } else {
                newY = group.layout.padding.top;
              }
              currentX += child.width + spacing;
            }

            if (newX !== child.x || newY !== child.y || newChildWidth !== child.width || newChildHeight !== child.height) {
              newElements[idx] = { ...newElements[idx], x: newX, y: newY, width: newChildWidth, height: newChildHeight };
              changed = true;
            }
          }
        });

        // Update group size based on children
        let newWidth = group.width;
        let newHeight = group.height;

        if (group.layout!.mode === 'vertical') {
          newWidth = Math.max(...children.map(c => c.width)) + group.layout!.padding.left + group.layout!.padding.right;
          newHeight = currentY - spacing + group.layout!.padding.bottom;
        } else if (group.layout!.mode === 'horizontal') {
          newWidth = currentX - spacing + group.layout!.padding.right;
          newHeight = Math.max(...children.map(c => c.height)) + group.layout!.padding.top + group.layout!.padding.bottom;
        }

        const groupIdx = newElements.findIndex(fe => fe.id === group.id);
        if (groupIdx !== -1 && (newWidth !== group.width || newHeight !== group.height)) {
          newElements[groupIdx] = { ...newElements[groupIdx], width: newWidth, height: newHeight };
          changed = true;
        }
      });
      iterations++;
    } while (changed && iterations < 5);

    return newElements;
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const updated = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      return applyAutoLayout(updated);
    });
  }, [applyAutoLayout]);

  const removeElement = useCallback((id: string) => {
    setElements(prev => {
      const updated = prev.filter(el => el.id !== id);
      return applyAutoLayout(updated);
    });
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [applyAutoLayout]);

  const removeElements = useCallback((ids: string[]) => {
    setElements(prev => {
      const updated = prev.filter(el => !ids.includes(el.id));
      return applyAutoLayout(updated);
    });
    setSelectedIds(prev => prev.filter(selectedId => !ids.includes(selectedId)));
  }, [applyAutoLayout]);

  const selectElement = useCallback((id: string | null, multi: boolean = false) => {
    if (id === null) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prev => {
        if (multi) {
          return prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
        }
        return [id];
      });
    }
  }, []);

  const selectElements = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const reorderElement = useCallback((id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index < 0) return prev;
      
      const newElements = [...prev];
      const [element] = newElements.splice(index, 1);
      
      if (direction === 'up') {
        newElements.splice(Math.min(index + 1, prev.length - 1), 0, element);
      } else if (direction === 'down') {
        newElements.splice(Math.max(index - 1, 0), 0, element);
      } else if (direction === 'front') {
        newElements.push(element);
      } else if (direction === 'back') {
        newElements.unshift(element);
      }
      return applyAutoLayout(newElements);
    });
  }, [applyAutoLayout]);

  const groupElements = useCallback((ids: string[]) => {
    if (ids.length === 0) return null;
    
    const groupId = uuidv4();
    setElements(prev => {
      const selectedElements = prev.filter(el => ids.includes(el.id));
      if (selectedElements.length === 0) return prev;

      // Calculate bounding box
      const minX = Math.min(...selectedElements.map(el => el.x));
      const minY = Math.min(...selectedElements.map(el => el.y));
      const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
      const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

      const groupElement: CanvasElement = {
        id: groupId,
        type: 'group',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        layout: {
          mode: 'none',
          spacing: 10,
          padding: { top: 10, right: 10, bottom: 10, left: 10 },
          align: 'start',
          justify: 'start'
        },
        style: {
          backgroundColor: 'transparent',
          border: '1px dashed #3b82f6'
        }
      };

      const updatedElements = prev.map(el => {
        if (ids.includes(el.id)) {
          return { ...el, parentId: groupId, x: el.x - minX, y: el.y - minY };
        }
        return el;
      });

      const final = [...updatedElements, groupElement];
      return applyAutoLayout(final);
    });
    setSelectedIds([groupId]);
    return groupId;
  }, [applyAutoLayout]);

  const ungroupElements = useCallback((id: string) => {
    setElements(prev => {
      const group = prev.find(el => el.id === id);
      if (!group || group.type !== 'group') return prev;

      const updated = prev.filter(el => el.id !== id).map(el => {
        if (el.parentId === id) {
          return { 
            ...el, 
            parentId: undefined, 
            x: el.x + group.x, 
            y: el.y + group.y 
          };
        }
        return el;
      });
      return applyAutoLayout(updated);
    });
    setSelectedIds([]);
  }, [applyAutoLayout]);

  return (
    <CanvasContext.Provider value={{
      elements, selectedIds, canvasSize, scale, templates, showGrid, snapToGrid, gridSize, layoutGrid, containerBox,
      addElement, updateElement, removeElement, removeElements, selectElement, selectElements, reorderElement, groupElements, ungroupElements, setCanvasSize, setScale, setElements,
      saveTemplate, loadTemplate, deleteTemplate, setShowGrid, setSnapToGrid, setGridSize, setLayoutGrid, setContainerBox, currentTool, setCurrentTool, isInitialView, setIsInitialView,
      layoutPrompt, setLayoutPrompt, layoutReferenceImage, setLayoutReferenceImage, generatedLayouts, setGeneratedLayouts, layoutPage, setLayoutPage, hasStartedLayoutGen, setHasStartedLayoutGen,
      includePlaceholders, setIncludePlaceholders, tldrawEditor, setTldrawEditor
    }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) throw new Error('useCanvas must be used within CanvasProvider');
  return context;
}
