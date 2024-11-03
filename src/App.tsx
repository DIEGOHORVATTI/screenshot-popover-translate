import { useState, useRef } from 'react'
import { useKeyPressEvent } from 'react-use'

import html2canvas from 'html2canvas'
import Tesseract from 'tesseract.js'

import axios from 'axios'

export const App = () => {
  const [selection, setSelection] = useState<{
    isSelecting: boolean
    startCoords: { x: number; y: number } | null
    endCoords: { x: number; y: number } | null
  }>({ isSelecting: false, startCoords: null, endCoords: null })

  const [recognized, setRecognized] = useState<Tesseract.Page | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault()
      setSelection({
        isSelecting: true,
        startCoords: { x: event.clientX, y: event.clientY },
        endCoords: null,
      })
    }
  }

  const handleMouseMove = ({ clientX: x, clientY: y }: React.MouseEvent) => {
    if (selection.isSelecting && selection.startCoords) {
      setSelection((prev) => ({ ...prev, endCoords: { x, y } }))
    }
  }

  const handleMouseUp = async () => {
    if (selection.isSelecting && selection.startCoords && selection.endCoords) {
      setSelection((prev) => ({ ...prev, isSelecting: false }))
      setRecognized(null)

      const canvas = await html2canvas(contentRef.current!, {
        ...getSelectionDimensions(),
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const { data } = await Tesseract.recognize(imgData, 'eng')

      const text = await axios
        .post<string>('https://translate-google-api-v1.vercel.app/translate', {
          text: data.text,
          to: 'pt-BR',
        })
        .then(({ data }) => data)

      setRecognized({
        ...data,
        text,
      })

      console.log(data)
    }
  }

  const getSelectionDimensions = () => {
    const x = Math.min(selection.startCoords!.x, selection.endCoords!.x)
    const y = Math.min(selection.startCoords!.y, selection.endCoords!.y)
    const width = Math.abs(selection.startCoords!.x - selection.endCoords!.x)
    const height = Math.abs(selection.startCoords!.y - selection.endCoords!.y)

    return { x, y, width, height }
  }

  const getSelectionStyle = (): React.CSSProperties => {
    if (!selection.startCoords || !selection.endCoords) return {}
    const { x, y, width, height } = getSelectionDimensions()

    return {
      zIndex: 999,
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      border: '2px dashed black',
      pointerEvents: 'none',
    }
  }

  const getPopoverStyle = (): React.CSSProperties => {
    const { x, y, width, height } = getSelectionDimensions()

    const halfFontSize = Number(recognized?.words[0]?.font_size) / 2

    return {
      zIndex: 1000,
      position: 'absolute',
      left: x,
      top: y,
      fontSize: halfFontSize,
      fontWeight: 'bold',
      minWidth: width,
      maxWidth: '300px',
      minHeight: height,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: 10,
      pointerEvents: 'none',
      overflow: 'auto',
    }
  }

  useKeyPressEvent('Escape', () =>
    setSelection({ isSelecting: false, startCoords: null, endCoords: null })
  )

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
      }}
    >
      {selection.isSelecting && <div style={getSelectionStyle()} />}

      {!selection.isSelecting && recognized && selection.startCoords && selection.endCoords && (
        <div style={getPopoverStyle()}>{recognized.text}</div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: selection.isSelecting ? 'auto' : 'none',
          zIndex: 998,
        }}
      />
      <div ref={contentRef} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <h2>Selecione uma área da imagem para extrair o texto</h2>

        <img src="/tema-da-aula.png" alt="Tema da Aula" style={{ width: '100%' }} />
      </div>
    </div>
  )
}
