import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import Tesseract from 'tesseract.js';

export const App = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCoords, setStartCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [endCoords, setEndCoords] = useState<{ x: number; y: number } | null>(
    null
  );
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null); // Ref para o conteúdo a ser capturado

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.altKey) {
      e.preventDefault(); // Previne o comportamento padrão
      setIsSelecting(true);
      setStartCoords({ x: e.clientX, y: e.clientY });
      setEndCoords(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && startCoords) {
      setEndCoords({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async () => {
    if (isSelecting && startCoords && endCoords) {
      setIsSelecting(false);

      // Capture the selection area
      const x = Math.min(startCoords.x, endCoords.x);
      const y = Math.min(startCoords.y, endCoords.y);
      const width = Math.abs(startCoords.x - endCoords.x);
      const height = Math.abs(startCoords.y - endCoords.y);

      // Use html2canvas on the window itself to capture the full view
      const canvas = await html2canvas(contentRef.current!, {
        x: x,
        y: y,
        width: width,
        height: height,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');

      // Open the image in a new tab
      const newTab = window.open();
      if (newTab) {
        newTab.document.body.innerHTML = `<img src="${imgData}" alt="Captured" style="width:100%"/>`;
      }

      // Perform text recognition
      Tesseract.recognize(imgData, 'eng').then(({ data: { text } }) => {
        console.log(text);
      });
    }
  };

  const getSelectionStyle = (): React.CSSProperties => {
    if (!startCoords || !endCoords) return {};
    const x = Math.min(startCoords.x, endCoords.x);
    const y = Math.min(startCoords.y, endCoords.y);
    const width = Math.abs(startCoords.x - endCoords.x);
    const height = Math.abs(startCoords.y - endCoords.y);

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
        backgroundColor: '#f0f0f0' // Fundo cinza
      }}
    >
      {isSelecting && <div style={getSelectionStyle()} ref={selectionRef} />}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: isSelecting
            ? 'rgba(255, 255, 255, 0.5)'
            : 'transparent',
          pointerEvents: isSelecting ? 'auto' : 'none',
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
