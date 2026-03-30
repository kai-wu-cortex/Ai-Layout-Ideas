'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ImagePlus, Send, ArrowRight, ArrowLeft, X, Loader2, Plus } from 'lucide-react';
import { useCanvas, CanvasElement, ElementType } from '@/lib/canvas-context';
import { streamLayoutPrototypes } from '@/lib/gemini';
import { LayoutCard } from './LayoutCard';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

export const InitialView: React.FC = () => {
  const { 
    setElements, 
    setIsInitialView, 
    canvasSize,
    setCanvasSize,
    layoutPrompt: prompt,
    setLayoutPrompt: setPrompt,
    layoutReferenceImage: referenceImage,
    setLayoutReferenceImage: setReferenceImage,
    generatedLayouts: layouts,
    setGeneratedLayouts: setLayouts,
    layoutPage: page,
    setLayoutPage: setPage,
    hasStartedLayoutGen: hasStarted,
    setHasStartedLayoutGen: setHasStarted,
    includePlaceholders,
    setIncludePlaceholders
  } = useCanvas();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // If free key is available, we don't need to ask for a key
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setNeedsKey(false);
        return;
      }
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsKey(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setReferenceImage(dataUrl);

        // Auto-detect image dimensions to set canvas size
        const img = new window.Image();
        img.onload = () => {
          // We might want to cap the size or just use the aspect ratio
          // For now, let's set the canvas size to match the image dimensions
          // but keep it within reasonable bounds if it's too large
          let targetWidth = img.width;
          let targetHeight = img.height;

          // If it's very large, scale it down while maintaining aspect ratio
          const maxDim = 2000;
          if (targetWidth > maxDim || targetHeight > maxDim) {
            const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          }

          setCanvasSize({ width: targetWidth, height: targetHeight });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (nextPage: number = 1) => {
    if (!prompt.trim() && !referenceImage) return;

    setIsGenerating(true);
    setError(null);
    setHasStarted(true);
    if (nextPage === 1) {
      setLayouts([]);
    }
    setPage(nextPage);

    try {
      // Check for API key before generating
      // Only check if free key is missing
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsKey(true);
          setIsGenerating(false);
          return;
        }
      }

      await streamLayoutPrototypes(
        prompt,
        canvasSize.width,
        canvasSize.height,
        (newLayout) => {
          setLayouts(prev => [...prev, newLayout]);
        },
        nextPage,
        referenceImage || undefined,
        includePlaceholders
      );
    } catch (err: any) {
      console.error('Generation failed:', err);
      
      let errorMsg = "";
      if (typeof err === 'string') {
        errorMsg = err;
      } else if (err?.message) {
        errorMsg = err.message;
      } else {
        errorMsg = JSON.stringify(err);
      }

      let message = "Failed to generate layouts. Please try again.";
      
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        message = "AI quota exceeded. Please wait a moment or try a simpler prompt.";
      } else if (errorMsg.includes("status code: 0") || errorMsg.includes("Failed to fetch")) {
        message = "Network error. Please check your connection or try again.";
      } else if (errorMsg.includes("API key")) {
        message = "Invalid or missing API key. Please reconnect your Gemini API key.";
        setNeedsKey(true);
      }

      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectLayout = (layout: any[]) => {
    // Ensure the canvas size is set to the current canvasSize in context
    // which should be the one used for generation
    setCanvasSize({ ...canvasSize });

    const newElements: CanvasElement[] = layout.map(el => {
      const type = (el.type === 'text' || el.type === 'image' || el.type === 'placeholder' || el.type === 'shape' || el.type === 'circle' || el.type === 'line' || el.type === 'group') ? el.type as ElementType : 'placeholder';
      
      return {
        id: uuidv4(),
        type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        content: el.content || '',
        style: {
          fontSize: el.style?.fontSize || 24,
          color: el.style?.color || (type === 'text' ? '#000000' : undefined),
          backgroundColor: el.style?.backgroundColor || (type === 'text' ? 'transparent' : '#f5f5f5'),
          fontFamily: el.style?.fontFamily || 'Inter',
          textAlign: el.style?.textAlign || 'center',
          fontWeight: el.style?.fontWeight || 'normal',
          borderRadius: el.style?.borderRadius || (type === 'circle' ? '50%' : '0px'),
          opacity: el.style?.opacity !== undefined ? el.style.opacity : 1,
          rotation: el.style?.rotation || 0,
          transform: el.style?.rotation ? `rotate(${el.style.rotation}deg)` : undefined,
          border: el.style?.border || (type === 'placeholder' ? '2px dashed #cbd5e1' : 'none'),
        }
      };
    });
    setElements(newElements);
    setIsInitialView(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-50 flex flex-col items-center overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-6xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 tracking-tight">AI Layout Ideas</span>
          </div>
          <div className="h-4 w-px bg-neutral-200" />
          <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Alignment • Hierarchy • Rhythm • White Space</span>
          </div>
        </div>
        {hasStarted && (
          <button 
            onClick={() => setIsInitialView(false)}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Skip to Editor
          </button>
        )}
      </div>

      <div className="flex-1 w-full max-w-6xl px-6 flex flex-col items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 max-w-2xl"
            >
              <h1 className="text-5xl font-bold text-neutral-900 leading-tight">
                What layout should we <span className="text-blue-600">create</span> today?
              </h1>
              <p className="text-lg text-neutral-500">
                Upload a reference image or describe your vision. I&apos;ll generate 16 unique layout ideas for you to start with.
              </p>
              
              <div className="relative group">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2 text-left"
                  >
                    <X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} />
                    {error}
                  </motion.div>
                )}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4 px-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Canvas Size:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={canvasSize.width}
                          onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 0 })}
                          className="w-16 h-7 text-xs border border-neutral-200 rounded px-1 focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="W"
                        />
                        <span className="text-neutral-300">×</span>
                        <input 
                          type="number" 
                          value={canvasSize.height}
                          onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 0 })}
                          className="w-16 h-7 text-xs border border-neutral-200 rounded px-1 focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="H"
                        />
                      </div>
                    </div>

                    <div className="h-4 w-px bg-neutral-200 mx-2" />

                    <button
                      onClick={() => setIncludePlaceholders(!includePlaceholders)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        includePlaceholders 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-neutral-50 text-neutral-500 border border-neutral-100'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${includePlaceholders ? 'bg-blue-600' : 'bg-neutral-300'}`} />
                      Image Placeholders
                    </button>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your poster layout (e.g., 'A modern minimalist event poster with a large hero image and bold typography')"
                    className="w-full h-32 resize-none border-none focus:ring-0 text-lg text-neutral-800 placeholder:text-neutral-400"
                  />
                  <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 flex items-center gap-2"
                      >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-sm font-medium">Reference Image</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                    <button
                      onClick={needsKey ? handleConnectKey : () => handleGenerate(1)}
                      disabled={isGenerating || (!prompt.trim() && !referenceImage && !needsKey)}
                      className={`${
                        needsKey ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
                      } disabled:bg-neutral-300 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : needsKey ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {needsKey ? 'Connect Gemini API Key' : 'Generate Ideas'}
                    </button>
                  </div>
                  {referenceImage && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 group/img">
                      <Image src={referenceImage} alt="Reference" fill className="object-cover" />
                      <button 
                        onClick={() => setReferenceImage(null)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col"
            >
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Layout Ideas</h2>
                  <p className="text-neutral-500">Page {page} • {layouts.length} generated</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setIncludePlaceholders(!includePlaceholders)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      includePlaceholders 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-white text-neutral-500 border-neutral-200'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${includePlaceholders ? 'bg-blue-600' : 'bg-neutral-300'}`} />
                    Placeholders
                  </button>

                  <button 
                    onClick={() => handleGenerate(page + 1)}
                    disabled={isGenerating}
                    className="bg-white border border-neutral-200 hover:border-blue-500 text-neutral-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Generate More
                  </button>
                </div>
              </div>

              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-neutral-200"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 pb-12">
                  {layouts.map((layout, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (idx % 16) * 0.05 }}
                    >
                      <LayoutCard 
                        layout={layout} 
                        canvasSize={canvasSize} 
                        onClick={() => selectLayout(layout)}
                      />
                    </motion.div>
                  ))}
                  {isGenerating && Array.from({ length: 4 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="aspect-[3/4] bg-neutral-100 rounded-xl animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating Input Bar */}
              <div className="py-6 mt-auto">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2"
                  >
                    <X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} />
                    {error}
                  </motion.div>
                )}
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg p-2 flex items-center gap-2 max-w-3xl mx-auto">
                  <div className="flex items-center gap-1 border-r border-neutral-100 pr-2 mr-1">
                    <input 
                      type="number" 
                      value={canvasSize.width}
                      onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 0 })}
                      className="w-12 h-7 text-[10px] border border-neutral-100 rounded px-1 focus:ring-1 focus:ring-blue-500 outline-none text-center"
                      placeholder="W"
                    />
                    <span className="text-[10px] text-neutral-300">×</span>
                    <input 
                      type="number" 
                      value={canvasSize.height}
                      onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 0 })}
                      className="w-12 h-7 text-[10px] border border-neutral-100 rounded px-1 focus:ring-1 focus:ring-blue-500 outline-none text-center"
                      placeholder="H"
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Refine your request..."
                    className="flex-1 border-none focus:ring-0 text-neutral-800"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate(1)}
                  />
                  <button
                    onClick={needsKey ? handleConnectKey : () => handleGenerate(1)}
                    disabled={isGenerating}
                    className={`${
                      needsKey ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50`}
                  >
                    {needsKey ? <Sparkles className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
