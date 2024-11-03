import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';

export const App = () => {
  const [selection, setSelection] = useState<{
    isSelecting: boolean;
    startCoords: { x: number; y: number } | null;
    endCoords: { x: number; y: number } | null;
  }>({ isSelecting: false, startCoords: null, endCoords: null });

  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.altKey) {
      e.preventDefault();
      setSelection({
        isSelecting: true,
        startCoords: { x: e.clientX, y: e.clientY },
        endCoords: null
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selection.isSelecting && selection.startCoords) {
      setSelection((prev) => ({
        ...prev,
        endCoords: { x: e.clientX, y: e.clientY }
      }));
    }
  };

  const handleMouseUp = async () => {
    if (selection.isSelecting && selection.startCoords && selection.endCoords) {
      setSelection((prev) => ({ ...prev, isSelecting: false }));
      await captureSelection();
    }
  };

  const captureSelection = async () => {
    const { x, y, width, height } = getSelectionDimensions();
    const canvas = await html2canvas(contentRef.current!, {
      x,
      y,
      width,
      height,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    openImageInNewTab(imgData);
    await performTextRecognition(imgData);
  };

  const getSelectionDimensions = () => {
    const x = Math.min(selection.startCoords!.x, selection.endCoords!.x);
    const y = Math.min(selection.startCoords!.y, selection.endCoords!.y);
    const width = Math.abs(selection.startCoords!.x - selection.endCoords!.x);
    const height = Math.abs(selection.startCoords!.y - selection.endCoords!.y);
    return { x, y, width, height };
  };

  const openImageInNewTab = (imgData: string) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.body.innerHTML = `<img src="${imgData}" alt="Captured" style="width:100%"/>`;
    }
  };

  const performTextRecognition = async (imgData: string) => {
    const {
      data: { text }
    } = await Tesseract.recognize(imgData, 'eng');
    console.log(text);
  };

  const getSelectionStyle = (): React.CSSProperties => {
    if (!selection.startCoords || !selection.endCoords) return {};
    const { x, y, width, height } = getSelectionDimensions();

    return {
      zIndex: 999,
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      border: '2px dashed rgba(255, 0, 0, 0.5)',
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      pointerEvents: 'none'
    };
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }}
    >
      {selection.isSelecting && <div style={getSelectionStyle()} />}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: selection.isSelecting
            ? 'rgba(255, 255, 255, 0.5)'
            : 'transparent',
          pointerEvents: selection.isSelecting ? 'auto' : 'none',
          zIndex: 998
        }}
      />
      <div
        ref={contentRef}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        <h2>Selecione uma área da imagem para extrair o texto</h2>
        <img
          src="/tema-da-aula.webp"
          alt="Tema da Aula"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};
