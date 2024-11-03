import { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

const Cropper = ({ children }: React.PropsWithChildren) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const startSelectionRef = useRef<{ startX: number; startY: number } | null>(
    null
  );

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsSelecting(true);

    const imgRect = imageRef.current?.getBoundingClientRect();
    if (imgRect) {
      startSelectionRef.current = {
        startX: event.clientX - imgRect.left,
        startY: event.clientY - imgRect.top
      };
      setSelection(null);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isSelecting || !startSelectionRef.current) return;

    const { startX, startY } = startSelectionRef.current;
    const imgRect = imageRef.current?.getBoundingClientRect();

    if (imgRect) {
      const currentX = event.clientX - imgRect.left;
      const currentY = event.clientY - imgRect.top;

      const newSelection = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        w: Math.abs(startX - currentX),
        h: Math.abs(startY - currentY)
      };

      setSelection(newSelection);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      captureSelection();
    }
    setIsSelecting(false);
  };

  const captureSelection = async () => {
    if (selection) {
      const croppedImage = await cropImage(selection);

      if (croppedImage) {
        console.log(croppedImage);
        const ocrResult = await performOCR(croppedImage);

        console.log(`OCR Result: ${ocrResult}`);
      } else {
        console.error('Erro ao cortar a imagem');
      }
    }
  };

  const cropImage = async (area: Selection): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Erro ao obter o contexto do canvas');
        resolve('');
        return;
      }

      const img = imageRef.current?.querySelector('img');
      if (!img) {
        resolve('');
        return;
      }

      canvas.width = area.w;
      canvas.height = area.h;

      context.drawImage(
        img,
        area.x,
        area.y,
        area.w,
        area.h,
        0,
        0,
        area.w,
        area.h
      );
      resolve(canvas.toDataURL('image/png'));
    });
  };

  const performOCR = async (image: string): Promise<string> => {
    const {
      data: { text }
    } = await Tesseract.recognize(image, 'eng');
    return text;
  };

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#4444',
        cursor: isSelecting ? 'crosshair' : 'default'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isSelecting) handleMouseUp();
      }}
    >
      {selection && <Overlay selection={selection} />}
      <div ref={imageRef} style={{ position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

const Overlay = ({ selection }: { selection: Selection }) => {
  return (
    <div
      style={{
        zIndex: 1,
        position: 'absolute',
        left: selection.x,
        top: selection.y,
        width: selection.w,
        height: selection.h,
        border: '2px dashed rgba(255, 0, 0, 0.5)',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        pointerEvents: 'none'
      }}
    />
  );
};

// Componente principal para utilização
export const App = () => {
  return (
    <Cropper>
      <h1>ola mundo</h1>

      <h2>Lorem ipsum dolor sit amet</h2>

      <img
        src="/tema-da-aula.webp" // Verifique se o caminho é correto
        alt="Tema da Aula"
        style={{ width: '100%' }} // Ajusta a imagem para ocupar a largura total
      />
    </Cropper>
  );
};
