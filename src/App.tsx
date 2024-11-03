import { useState } from 'react'
import { useKeyPressEvent } from 'react-use'
import html2canvas from 'html2canvas'
import Tesseract from 'tesseract.js'
import axios from 'axios'

interface Selection {
  isSelecting: boolean
  startCoords: { x: number; y: number } | null
  endCoords: { x: number; y: number } | null
}

export const App = () => {
  const [selection, setSelection] = useState<Selection>({
    isSelecting: false,
    startCoords: null,
    endCoords: null,
  })

  const [recognized, setRecognized] = useState<Tesseract.Page | null>(null)

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

      const canvas = await html2canvas(document.body, {
        ...getSelectionDimensions(),
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')

      const { data } = await Tesseract.recognize(imgData, 'eng')

      const translatedText = await axios
        .post<string>('https://translate-google-api-v1.vercel.app/translate', {
          text: data.text,
          to: 'pt-BR',
        })
        .then(({ data }) => data)

      setRecognized({
        ...data,
        text: translatedText,
      })
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
      position: 'fixed',
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

    const FONT_RATIO = 3

    const fontSize = recognized?.words[0]?.font_size
      ? (Number(recognized.words[0].font_size) / FONT_RATIO + width / FONT_RATIO) / FONT_RATIO -
        FONT_RATIO
      : 14

    return {
      zIndex: 1000,
      position: 'absolute',
      left: x,
      top: y,
      fontSize: fontSize,
      fontWeight: 'bold',
      maxWidth: width,
      minWidth: 1,
      minHeight: height,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: 10,
      pointerEvents: 'none',
      overflowY: 'auto',
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
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 999,
      }}
    >
      {selection.isSelecting && <div style={getSelectionStyle()} />}

      {!selection.isSelecting && recognized && selection.startCoords && selection.endCoords && (
        <div style={getPopoverStyle()}>{recognized.text}</div>
      )}
    </div>
  )
}
