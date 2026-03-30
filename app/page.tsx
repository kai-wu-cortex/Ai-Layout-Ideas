'use client'

import React from 'react';
import { CanvasProvider, useCanvas } from '@/lib/canvas-context';
import { TopBar } from '@/components/topbar/TopBar';
import { TldrawCanvas } from '@/components/canvas/TldrawCanvas';
import { InitialView } from '@/components/initial-view/InitialView';

export default function Page() {
  return (
    <CanvasProvider>
      <PageContent />
    </CanvasProvider>
  );
}

function PageContent() {
  const { isInitialView } = useCanvas();

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-100 overflow-hidden font-sans">
      {isInitialView ? (
        <InitialView />
      ) : (
        <>
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <TldrawCanvas />
          </div>
        </>
      )}
    </div>
  );
}
