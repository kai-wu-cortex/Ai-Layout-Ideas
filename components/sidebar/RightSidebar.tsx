'use client'

import React, { useState, useEffect } from 'react';
import { useCanvas } from '@/lib/canvas-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Wand2, RefreshCw, AlignLeft, AlignCenter, AlignRight, AlignJustify, Upload, Group, Ungroup, ArrowDown, ArrowRight } from 'lucide-react';
import { generateFastText, generateOrEditImage } from '@/lib/gemini';

export function RightSidebar() {
  const { elements, selectedIds, updateElement, removeElements, groupElements, ungroupElements, layoutGrid, setLayoutGrid, containerBox, setContainerBox, canvasSize, setCanvasSize } = useCanvas();
  const selectedElement = elements.find(el => selectedIds.includes(el.id));
  const [isGenerating, setIsGenerating] = useState(false);

  if (selectedIds.length > 1) {
    return (
      <div className="w-80 border-l bg-white flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold">{selectedIds.length} Elements</h2>
          <Button variant="ghost" size="icon" onClick={() => removeElements(selectedIds)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <Button className="w-full gap-2" onClick={() => groupElements(selectedIds)}>
            <Group className="w-4 h-4" />
            Group Elements (Auto Layout)
          </Button>
          <p className="text-xs text-neutral-500 text-center">Grouping elements allows you to use Figma-like Auto Layout features.</p>
        </div>
      </div>
    );
  }

  if (!selectedElement || selectedIds.length !== 1) {
    return (
      <div className="w-80 border-l bg-white flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Canvas Properties</h2>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Canvas Size</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input 
                    type="number" 
                    value={canvasSize.width} 
                    onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 0 })} 
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input 
                    type="number" 
                    value={canvasSize.height} 
                    onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 0 })} 
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Layout Grid</h3>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Enable Grid</Label>
                <input 
                  type="checkbox" 
                  checked={layoutGrid.enabled} 
                  onChange={(e) => setLayoutGrid({...layoutGrid, enabled: e.target.checked})} 
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {layoutGrid.enabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Columns</Label>
                      <span className="text-xs text-neutral-500">{layoutGrid.columns}</span>
                    </div>
                    <Slider 
                      min={1} max={24} step={1} 
                      value={[layoutGrid.columns]} 
                      onValueChange={(val) => setLayoutGrid({...layoutGrid, columns: Array.isArray(val) ? val[0] : val as any})} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Gutter</Label>
                      <span className="text-xs text-neutral-500">{layoutGrid.gutter}px</span>
                    </div>
                    <Slider 
                      min={0} max={100} step={1} 
                      value={[layoutGrid.gutter]} 
                      onValueChange={(val) => setLayoutGrid({...layoutGrid, gutter: Array.isArray(val) ? val[0] : val as any})} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Margin</Label>
                      <span className="text-xs text-neutral-500">{layoutGrid.margin}px</span>
                    </div>
                    <Slider 
                      min={0} max={200} step={1} 
                      value={[layoutGrid.margin]} 
                      onValueChange={(val) => setLayoutGrid({...layoutGrid, margin: Array.isArray(val) ? val[0] : val as any})} 
                    />
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Container Box</h3>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Container</Label>
                <input 
                  type="checkbox" 
                  checked={containerBox.enabled} 
                  onChange={(e) => setContainerBox({...containerBox, enabled: e.target.checked})} 
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {containerBox.enabled && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Max Width</Label>
                    <span className="text-xs text-neutral-500">{containerBox.width}px</span>
                  </div>
                  <Slider 
                    min={320} max={1920} step={10} 
                    value={[containerBox.width]} 
                    onValueChange={(val) => setContainerBox({...containerBox, width: Array.isArray(val) ? val[0] : val as any})} 
                  />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  const handleStyleChange = (key: string, value: any) => {
    updateElement(selectedElement.id, {
      style: { ...selectedElement.style, [key]: value }
    });
  };

  const handleLayoutChange = (key: string, value: any) => {
    updateElement(selectedElement.id, {
      layout: { ...(selectedElement.layout || {
        mode: 'none',
        spacing: 10,
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
        align: 'start',
        justify: 'start'
      }), [key]: value }
    });
  };

  const handlePaddingChange = (side: string, value: number) => {
    const currentLayout = selectedElement.layout || {
      mode: 'none',
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
      align: 'start',
      justify: 'start'
    };
    updateElement(selectedElement.id, {
      layout: {
        ...currentLayout,
        padding: { ...currentLayout.padding, [side]: value }
      }
    });
  };

  const handleAITextEdit = async (instruction: string) => {
    if (selectedElement.type !== 'text' || !selectedElement.content) return;
    setIsGenerating(true);
    updateElement(selectedElement.id, { isGenerating: true });
    try {
      const prompt = `Original text: "${selectedElement.content}". Instruction: ${instruction}. Provide ONLY the revised text.`;
      const result = await generateFastText(prompt);
      updateElement(selectedElement.id, { content: result, isGenerating: false });
    } catch (error) {
      console.error(error);
      updateElement(selectedElement.id, { isGenerating: false });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIImageEdit = async () => {
    if (selectedElement.type !== 'image' || !selectedElement.aiPrompt) return;

    if (typeof window !== 'undefined' && (window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    updateElement(selectedElement.id, { isGenerating: true });
    try {
      let resultUrl;
      if (selectedElement.content && selectedElement.content.startsWith('data:image')) {
        // Edit existing image
        const mimeType = selectedElement.content.split(';')[0].split(':')[1];
        resultUrl = await generateOrEditImage(selectedElement.aiPrompt, selectedElement.content, mimeType);
      } else {
        // Generate new image
        resultUrl = await generateOrEditImage(selectedElement.aiPrompt);
      }
      updateElement(selectedElement.id, { content: resultUrl, isGenerating: false });
    } catch (error) {
      console.error(error);
      updateElement(selectedElement.id, { isGenerating: false });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateElement(selectedElement.id, { content: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-80 border-l bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center shrink-0">
        <h2 className="text-lg font-semibold capitalize">{selectedElement.type} Properties</h2>
        <Button variant="ghost" size="icon" onClick={() => removeElements([selectedElement.id])}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Position & Size */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Transform</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">X</Label>
                <Input 
                  type="number" 
                  value={Math.round(selectedElement.x)} 
                  onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Y</Label>
                <Input 
                  type="number" 
                  value={Math.round(selectedElement.y)} 
                  onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Width</Label>
                <Input 
                  type="number" 
                  value={Math.round(selectedElement.width)} 
                  onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Height</Label>
                <Input 
                  type="number" 
                  value={Math.round(selectedElement.height)} 
                  onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Rotation</Label>
                <span className="text-xs text-neutral-500">{selectedElement.style?.rotation || 0}°</span>
              </div>
              <Slider 
                min={0} max={360} step={1} 
                value={[selectedElement.style?.rotation || 0]} 
                onValueChange={(val) => handleStyleChange('rotation', Array.isArray(val) ? val[0] : val)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs text-neutral-500">{Math.round((selectedElement.style?.opacity ?? 1) * 100)}%</span>
              </div>
              <Slider 
                min={0} max={1} step={0.01} 
                value={[selectedElement.style?.opacity ?? 1]} 
                onValueChange={(val) => handleStyleChange('opacity', Array.isArray(val) ? val[0] : val)}
              />
            </div>
          </div>

          <Separator />

          {/* Text Properties */}
          {selectedElement.type === 'text' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Typography</h3>
              
              <div className="space-y-2">
                <Label className="text-xs">Content</Label>
                <Textarea 
                  value={selectedElement.content || ''} 
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Font Family</Label>
                <Select 
                  value={selectedElement.style?.fontFamily || 'Inter'} 
                  onValueChange={(val) => handleStyleChange('fontFamily', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                    <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Alignment</Label>
                <div className="flex gap-1 bg-neutral-100 p-1 rounded-md">
                  <Button 
                    variant={selectedElement.style?.textAlign === 'left' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="flex-1 h-8"
                    onClick={() => handleStyleChange('textAlign', 'left')}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={selectedElement.style?.textAlign === 'center' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="flex-1 h-8"
                    onClick={() => handleStyleChange('textAlign', 'center')}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={selectedElement.style?.textAlign === 'right' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="flex-1 h-8"
                    onClick={() => handleStyleChange('textAlign', 'right')}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={selectedElement.style?.textAlign === 'justify' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="flex-1 h-8"
                    onClick={() => handleStyleChange('textAlign', 'justify')}
                  >
                    <AlignJustify className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Font Size</Label>
                  <span className="text-xs text-neutral-500">{selectedElement.style?.fontSize}px</span>
                </div>
                <Slider 
                  min={8} max={200} step={1} 
                  value={[selectedElement.style?.fontSize || 24]} 
                  onValueChange={(val) => handleStyleChange('fontSize', Array.isArray(val) ? val[0] : val)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Line Height</Label>
                  <span className="text-xs text-neutral-500">{selectedElement.style?.lineHeight || 1.2}</span>
                </div>
                <Slider 
                  min={0.5} max={3} step={0.1} 
                  value={[selectedElement.style?.lineHeight || 1.2]} 
                  onValueChange={(val) => handleStyleChange('lineHeight', Array.isArray(val) ? val[0] : val)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Letter Spacing</Label>
                  <span className="text-xs text-neutral-500">{selectedElement.style?.letterSpacing || 0}px</span>
                </div>
                <Slider 
                  min={-5} max={20} step={0.5} 
                  value={[selectedElement.style?.letterSpacing || 0]} 
                  onValueChange={(val) => handleStyleChange('letterSpacing', Array.isArray(val) ? val[0] : val)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={selectedElement.style?.color || '#000000'} 
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    type="text" 
                    value={selectedElement.style?.color || '#000000'} 
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label className="text-xs flex items-center gap-2 text-blue-600">
                  <Wand2 className="w-3 h-3" /> AI Text Assistant
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAITextEdit('Make it shorter')} disabled={isGenerating}>Shorter</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAITextEdit('Make it longer')} disabled={isGenerating}>Longer</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAITextEdit('Make it more professional')} disabled={isGenerating}>Professional</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAITextEdit('Make it catchy and engaging')} disabled={isGenerating}>Catchy</Button>
                </div>
              </div>
            </div>
          )}

          {/* Image Properties */}
          {selectedElement.type === 'image' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Image Source</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => document.getElementById('element-image-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <input 
                    id="element-image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">AI Image Generation</h3>
                
                <div className="space-y-2">
                  <Label className="text-xs">Prompt</Label>
                  <Textarea 
                    placeholder="Describe what you want to generate or edit..."
                    value={selectedElement.aiPrompt || ''} 
                    onChange={(e) => updateElement(selectedElement.id, { aiPrompt: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={handleAIImageEdit}
                  disabled={isGenerating || !selectedElement.aiPrompt}
                >
                  {selectedElement.content ? <RefreshCw className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                  {selectedElement.content ? 'Edit Image with AI' : 'Generate Image'}
                </Button>
              </div>
            </div>
          )}

          {/* Shape & Placeholder Properties */}
          {(selectedElement.type === 'shape' || selectedElement.type === 'placeholder') && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Appearance</h3>
              
              <div className="space-y-2">
                <Label className="text-xs">Fill Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={selectedElement.style?.backgroundColor || '#e5e5e5'} 
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    type="text" 
                    value={selectedElement.style?.backgroundColor || '#e5e5e5'} 
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Corner Radius</Label>
                  <span className="text-xs text-neutral-500">{parseInt(selectedElement.style?.borderRadius || '0')}px</span>
                </div>
                <Slider 
                  min={0} max={200} step={1} 
                  value={[parseInt(selectedElement.style?.borderRadius || '0')]} 
                  onValueChange={(val) => handleStyleChange('borderRadius', `${Array.isArray(val) ? val[0] : val}px`)}
                />
              </div>
            </div>
          )}

          {/* Auto Layout Properties */}
          {selectedElement.type === 'group' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Auto Layout</h3>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500" onClick={() => ungroupElements(selectedElement.id)}>
                    <Ungroup className="w-3 h-3 mr-1" /> Ungroup
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Direction</Label>
                  <div className="flex gap-1 bg-neutral-100 p-1 rounded-md">
                    <Button 
                      variant={selectedElement.layout?.mode === 'none' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => handleLayoutChange('mode', 'none')}
                    >
                      None
                    </Button>
                    <Button 
                      variant={selectedElement.layout?.mode === 'horizontal' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => handleLayoutChange('mode', 'horizontal')}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={selectedElement.layout?.mode === 'vertical' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => handleLayoutChange('mode', 'vertical')}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedElement.layout?.mode !== 'none' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Alignment</Label>
                      <div className="flex gap-1 bg-neutral-100 p-1 rounded-md">
                        <Button 
                          variant={selectedElement.layout?.align === 'start' ? 'default' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleLayoutChange('align', 'start')}
                        >
                          Start
                        </Button>
                        <Button 
                          variant={selectedElement.layout?.align === 'center' ? 'default' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleLayoutChange('align', 'center')}
                        >
                          Center
                        </Button>
                        <Button 
                          variant={selectedElement.layout?.align === 'end' ? 'default' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleLayoutChange('align', 'end')}
                        >
                          End
                        </Button>
                        <Button 
                          variant={selectedElement.layout?.align === 'stretch' ? 'default' : 'ghost'} 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleLayoutChange('align', 'stretch')}
                        >
                          Stretch
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs">Spacing</Label>
                        <span className="text-xs text-neutral-500">{selectedElement.layout?.spacing}px</span>
                      </div>
                      <Slider 
                        min={0} max={100} step={1} 
                        value={[selectedElement.layout?.spacing || 0]} 
                        onValueChange={(val) => handleLayoutChange('spacing', Array.isArray(val) ? val[0] : val)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Padding</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 w-4">T</span>
                          <Input 
                            type="number" 
                            className="h-7 text-xs" 
                            value={selectedElement.layout?.padding.top} 
                            onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 w-4">R</span>
                          <Input 
                            type="number" 
                            className="h-7 text-xs" 
                            value={selectedElement.layout?.padding.right} 
                            onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 w-4">B</span>
                          <Input 
                            type="number" 
                            className="h-7 text-xs" 
                            value={selectedElement.layout?.padding.bottom} 
                            onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 w-4">L</span>
                          <Input 
                            type="number" 
                            className="h-7 text-xs" 
                            value={selectedElement.layout?.padding.left} 
                            onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
