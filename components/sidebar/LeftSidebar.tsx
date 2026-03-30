'use client'

import React, { useState } from 'react';
import { useCanvas } from '@/lib/canvas-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Image as ImageIcon, LayoutTemplate, Sparkles, Search, Square, Circle, Layers, Save, Trash2, Pen, Minus } from 'lucide-react';
import { generateHighQualityImage, generateTextWithSearch } from '@/lib/gemini';

export function LeftSidebar() {
  const { addElement, elements, updateElement, selectedIds, selectElement, reorderElement, setElements, templates, saveTemplate, loadTemplate, deleteTemplate, setCurrentTool } = useCanvas();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('modern');
  const [imageSize, setImageSize] = useState('1K');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setElements(prev => {
      const draggedIndex = prev.findIndex(el => el.id === draggedId);
      const targetIndex = prev.findIndex(el => el.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return prev;
      
      const newElements = [...prev];
      const [draggedElement] = newElements.splice(draggedIndex, 1);
      
      // Insert at target index
      newElements.splice(targetIndex, 0, draggedElement);
      return newElements;
    });
    setDraggedId(null);
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt) return;

    if (typeof window !== 'undefined' && (window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    
    // Add a placeholder element first
    const elementId = addElement('image');
    updateElement(elementId, { isGenerating: true });
    
    try {
      const fullPrompt = `Style: ${aiStyle}. ${aiPrompt}`;
      const imageUrl = await generateHighQualityImage(fullPrompt, imageSize as any, '3:4');
      
      updateElement(elementId, { content: imageUrl, isGenerating: false });
    } catch (error) {
      console.error(error);
      updateElement(elementId, { isGenerating: false });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const result = await generateTextWithSearch(`Search for information about: ${searchQuery}. Provide a concise summary suitable for a poster or layout.`);
      setSearchResults(result || 'No results found.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-80 border-r bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5" />
          Design Tools
        </h2>
      </div>

      <Tabs defaultValue="elements" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 shrink-0 flex-wrap h-auto">
          <TabsTrigger value="elements" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2">Elements</TabsTrigger>
          <TabsTrigger value="layers" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2">Layers</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2">Templates</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2">AI Gen</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 min-h-0">
          <TabsContent value="elements" className="p-4 space-y-4 m-0">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => addElement('text')}>
                <Type className="w-6 h-6" />
                <span>Text</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => addElement('image')}>
                <ImageIcon className="w-6 h-6" />
                <span>Image</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => addElement('placeholder')}>
                <LayoutTemplate className="w-6 h-6" />
                <span>Placeholder</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => {
                const id = addElement('shape');
                updateElement(id, { style: { backgroundColor: '#e5e5e5', borderRadius: '0px' } });
              }}>
                <Square className="w-6 h-6" />
                <span>Rectangle</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => {
                const id = addElement('shape');
                updateElement(id, { style: { backgroundColor: '#e5e5e5', borderRadius: '9999px' } });
              }}>
                <Circle className="w-6 h-6" />
                <span>Circle</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => setCurrentTool('line')}>
                <Minus className="w-6 h-6" />
                <span>Line</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => setCurrentTool('pen')}>
                <Pen className="w-6 h-6" />
                <span>Pen</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="layers" className="p-0 m-0 flex-1 flex flex-col h-full">
            <div className="p-3 bg-neutral-50 border-b text-xs text-neutral-500 flex items-center justify-between shrink-0">
              <span>Drag to reorder</span>
              <span>Shortcuts: <kbd className="bg-white border rounded px-1 shadow-sm">[</kbd> <kbd className="bg-white border rounded px-1 shadow-sm">]</kbd></span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {elements.slice().reverse().map((el, index) => {
                const isSelected = selectedIds.includes(el.id);
                return (
                  <div 
                    key={el.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, el.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, el.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-neutral-50 ${isSelected ? 'bg-blue-50 border-blue-200' : ''} ${draggedId === el.id ? 'opacity-50' : ''}`}
                    onClick={(e) => selectElement(el.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {el.type === 'text' && <Type className="w-4 h-4 text-neutral-500 shrink-0" />}
                      {el.type === 'image' && <ImageIcon className="w-4 h-4 text-neutral-500 shrink-0" />}
                      {el.type === 'placeholder' && <LayoutTemplate className="w-4 h-4 text-neutral-500 shrink-0" />}
                      {el.type === 'pen' && <Pen className="w-4 h-4 text-neutral-500 shrink-0" />}
                      {el.type === 'line' && <Minus className="w-4 h-4 text-neutral-500 shrink-0" />}
                      {el.type === 'shape' && (el.style?.borderRadius === '9999px' ? <Circle className="w-4 h-4 text-neutral-500 shrink-0" /> : <Square className="w-4 h-4 text-neutral-500 shrink-0" />)}
                      <span className="text-sm truncate">
                        {el.type === 'text' ? (el.content || 'Empty Text') : 
                         el.type === 'shape' ? (el.style?.borderRadius === '9999px' ? 'Circle' : 'Rectangle') :
                         el.type === 'pen' ? 'Pen' :
                         el.type === 'line' ? 'Line' :
                         el.type.charAt(0).toUpperCase() + el.type.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); reorderElement(el.id, 'up'); }}>
                        <span className="text-xs">↑</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); reorderElement(el.id, 'down'); }}>
                        <span className="text-xs">↓</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {elements.length === 0 && (
                <div className="p-8 text-center text-neutral-400 text-sm">
                  No elements on canvas
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="p-4 space-y-4 m-0">
            <div className="space-y-2">
              <Label>Save Current Layout</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Template name..." 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && templateName) {
                      saveTemplate(templateName);
                      setTemplateName('');
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  onClick={() => {
                    if (templateName) {
                      saveTemplate(templateName);
                      setTemplateName('');
                    }
                  }}
                  disabled={!templateName}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <Label>Saved Templates</Label>
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <div className="text-sm text-neutral-500 text-center py-4 border border-dashed rounded-md">
                    No templates saved yet
                  </div>
                ) : (
                  templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-neutral-50">
                      <div 
                        className="flex-1 cursor-pointer truncate mr-2 text-sm font-medium"
                        onClick={() => loadTemplate(template.id)}
                      >
                        {template.name}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="p-4 space-y-6 m-0">
            <div className="space-y-2">
              <Label>Design Prompt</Label>
              <Textarea 
                placeholder="Describe the image you want to generate..." 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="h-32"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Style</Label>
              <Input 
                placeholder="e.g. Cyberpunk, Minimalist, Watercolor" 
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Image Size</Label>
              <Select value={imageSize} onValueChange={(val) => val && setImageSize(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1K">1K (Fastest)</SelectItem>
                  <SelectItem value="2K">2K (High Quality)</SelectItem>
                  <SelectItem value="4K">4K (Ultra Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full gap-2" 
              onClick={handleGenerateImage}
              disabled={isGenerating || !aiPrompt}
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </Button>
          </TabsContent>

          <TabsContent value="search" className="p-4 space-y-4 m-0">
            <div className="space-y-2">
              <Label>Search Web for Ideas</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Latest tech trends 2026" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button size="icon" onClick={handleSearch} disabled={isSearching}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {searchResults && (
              <div className="space-y-2 mt-4">
                <Label>Results</Label>
                <div className="p-3 bg-neutral-50 rounded-md text-sm text-neutral-700 whitespace-pre-wrap">
                  {searchResults}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full text-xs"
                  onClick={() => {
                    addElement('text', searchResults);
                  }}
                >
                  Add to Canvas
                </Button>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
