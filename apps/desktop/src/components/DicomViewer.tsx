import React, { useEffect, useRef, useState } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import * as cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

// Presets constants
const PRESETS = {
  SOFT_TISSUE: { windowWidth: 400, windowCenter: 40 },
  LUNG: { windowWidth: 1500, windowCenter: -600 },
  BONE: { windowWidth: 1500, windowCenter: 300 },
};

interface DicomViewerProps {
  imageIds: string[];
}

export const DicomViewer: React.FC<DicomViewerProps> = ({ imageIds }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [currentSlice, setCurrentSlice] = useState(0);

  useEffect(() => {
    let renderingEngine: cornerstone.RenderingEngine;
    const renderingEngineId = 'myRenderingEngine';
    const viewportId = 'CT_STACK';
    const toolGroupId = 'myToolGroup';

    const setup = async () => {
      // 1. Initialize core
      await cornerstone.init();
      await cornerstoneTools.init();

      // Configure dicom image loader safely (ignoring TS errors for externals if any)
      try {
        const loader = cornerstoneDICOMImageLoader.default || cornerstoneDICOMImageLoader;
        (loader as any).external.cornerstone = cornerstone;
        (loader as any).external.dicomParser = dicomParser;
        (loader as any).configure({
          useWebWorkers: true,
          decodeConfig: {
            convertFloatPixelDataToInt: false,
          },
        });
      } catch (e) {
        console.warn('Could not configure cornerstoneDICOMImageLoader', e);
      }

      // 2. Strict Garbage Collection & Memory Limits
      // Max 300 MB cache for 4GB RAM PC
      const MAX_CACHE_SIZE = 300 * 1024 * 1024;
      cornerstone.cache.setMaxCacheSize(MAX_CACHE_SIZE);

      // 3. Setup rendering engine and viewport
      renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
      
      const viewportInput = {
        viewportId,
        type: cornerstone.Enums.ViewportType.STACK,
        element: viewerRef.current!,
        defaultOptions: {
          background: [0, 0, 0] as cornerstone.Types.Point3,
        },
      };

      renderingEngine.enableElement(viewportInput);
      const viewport = renderingEngine.getViewport(viewportId) as cornerstone.Types.IStackViewport;

      // 4. Load images into the stack
      await viewport.setStack(imageIds);
      viewport.render();

      // 5. Setup tools
      cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
      cornerstoneTools.addTool(cornerstoneTools.PanTool);
      cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
      cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);

      const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId)!;
      toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
      toolGroup.addTool(cornerstoneTools.PanTool.toolName);
      toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
      toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);

      toolGroup.addViewport(viewportId, renderingEngineId);

      // Active tools
      toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
        bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
      });
      toolGroup.setToolActive(cornerstoneTools.PanTool.toolName, {
        bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary }],
      });
      toolGroup.setToolActive(cornerstoneTools.ZoomTool.toolName, {
        bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }],
      });
      toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName, {
        bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Wheel }],
      });

      // 6. Listen for slice changes to perform aggressive garbage collection
      const onSliceChange = (e: any) => {
        const eventData = e.detail;
        const newImageIdIndex = eventData.imageIdIndex;
        setCurrentSlice(newImageIdIndex);
      };

      viewerRef.current?.addEventListener(cornerstone.Enums.Events.STACK_NEW_IMAGE, onSliceChange);
      
      // Store reference to function for cleanup
      (viewerRef.current as any)._onSliceChange = onSliceChange;
    };

    setup();

    return () => {
      // Cleanup
      if (viewerRef.current && (viewerRef.current as any)._onSliceChange) {
        viewerRef.current.removeEventListener(cornerstone.Enums.Events.STACK_NEW_IMAGE, (viewerRef.current as any)._onSliceChange);
      }
      
      try {
        renderingEngine?.destroy();
        cornerstoneTools.ToolGroupManager.destroyToolGroup('myToolGroup');
      } catch(e) {
          // ignore cleanup errors on fast unmounts
      }
    };
  }, [imageIds]);

  const applyPreset = (preset: { windowWidth: number; windowCenter: number }) => {
    const renderingEngine = cornerstone.getRenderingEngine('myRenderingEngine');
    if (!renderingEngine) return;

    const viewport = renderingEngine.getViewport('CT_STACK') as cornerstone.Types.IStackViewport;
    if (viewport) {
      const { windowWidth, windowCenter } = preset;
      const lower = windowCenter - windowWidth / 2;
      const upper = windowCenter + windowWidth / 2;
      
      viewport.setProperties({
        voiRange: { lower, upper }
      });
      viewport.render();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'black', color: 'white' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span>Presets: </span>
        <button onClick={() => applyPreset(PRESETS.SOFT_TISSUE)}>Tissus Mous</button>
        <button onClick={() => applyPreset(PRESETS.LUNG)}>Poumon</button>
        <button onClick={() => applyPreset(PRESETS.BONE)}>Os</button>
        
        <span style={{ marginLeft: 'auto' }}>
          Coupe: {currentSlice + 1} / {imageIds.length}
        </span>
      </div>
      <div 
        ref={viewerRef} 
        style={{ flex: 1, width: '100%' }}
        onContextMenu={(e) => e.preventDefault()} 
      />
    </div>
  );
};
