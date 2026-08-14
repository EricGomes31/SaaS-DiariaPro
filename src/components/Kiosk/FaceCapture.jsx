import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react'
import { CameraOff } from 'lucide-react'

// Componente "burro" de câmera: só pede acesso, mostra o preview e expõe o
// elemento <video> por ref. Quem detecta/compara o rosto é o componente pai
// (KioskPage / WorkerModal), que já tem o hook useFaceModels.
const FaceCapture = forwardRef(function FaceCapture({ active = true, mirrored = true, height = 320 }, ref) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)

  useImperativeHandle(ref, () => videoRef.current, [])

  useEffect(() => {
    if (!active) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      return
    }

    let cancelled = false
    setError(null)
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(err => { if (!cancelled) setError(err) })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [active])

  if (error) {
    return (
      <div style={{
        height, borderRadius: 16, background: 'rgba(176,65,62,0.06)', border: '1px solid rgba(176,65,62,0.2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20,
      }}>
        <CameraOff size={28} color="#B0413E" />
        <span style={{ fontSize: 13, color: '#B0413E', textAlign: 'center', fontWeight: 600 }}>
          Não foi possível acessar a câmera. Verifique a permissão do navegador.
        </span>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: '100%', height, borderRadius: 16, background: '#000',
        objectFit: 'cover', transform: mirrored ? 'scaleX(-1)' : 'none',
      }}
    />
  )
})

export default FaceCapture
