import { useCallback, useEffect, useRef, useState } from 'react'

const MODELS_URL = '/models'

// Distância Euclidiana abaixo desse valor = mesmo rosto. Ponto de partida
// recomendado pela biblioteca — vale ajustar depois de testar com fotos
// reais da equipe (iluminação do local de trabalho afeta a taxa de acerto).
export const FACE_MATCH_THRESHOLD = 0.5

// Carrega o @vladmandic/face-api sob demanda (import dinâmico) — só quem
// realmente abre a câmera (quiosque ou cadastro de rosto) baixa essa lib,
// o painel administrativo normal não paga esse custo.
export function useFaceModels() {
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState(null)
  const faceapiRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const faceapi = await import('@vladmandic/face-api')
        await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL), faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL), faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL)])
        if (cancelled) return
        faceapiRef.current = faceapi
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err)
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Detecta um único rosto no elemento de vídeo e retorna o descritor
  // (vetor de 128 números) — ou null se nenhum rosto for encontrado.
  const detectDescriptor = useCallback(async videoEl => {
    const faceapi = faceapiRef.current
    if (!faceapi || !videoEl) return null
    const result = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
    return result ? Array.from(result.descriptor) : null
  }, [])

  const euclideanDistance = useCallback((a, b) => {
    const faceapi = faceapiRef.current
    if (faceapi) return faceapi.euclideanDistance(a, b)
    // Fallback puro-JS (não deveria ser necessário, os modelos já garantem faceapi carregado antes de comparar)
    return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))
  }, [])

  // Monta um "reconhecedor" 1:N a partir do rosto cadastrado de cada
  // diarista — usado pelo quiosque para identificar sozinho quem chegou,
  // sem precisar que a pessoa busque o próprio nome antes.
  const buildMatcher = useCallback(workers => {
    const faceapi = faceapiRef.current
    if (!faceapi) return null
    const labeled = workers.filter(w => w.faceDescriptor?.length).map(w => new faceapi.LabeledFaceDescriptors(w.id, [new Float32Array(w.faceDescriptor)]))
    if (labeled.length === 0) return null
    return new faceapi.FaceMatcher(labeled, FACE_MATCH_THRESHOLD)
  }, [])

  // Roda uma detecção no frame atual e devolve o melhor match do reconhecedor
  // ({ workerId, distance }) — ou null se nenhum rosto foi encontrado no frame,
  // ou { workerId: null } se um rosto foi encontrado mas não bateu com ninguém.
  const identifyFace = useCallback(async (videoEl, matcher) => {
    const faceapi = faceapiRef.current
    if (!faceapi || !videoEl || !matcher) return null
    const result = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
    if (!result) return null
    const match = matcher.findBestMatch(result.descriptor)
    return {
      workerId: match.label === 'unknown' ? null : match.label,
      distance: match.distance,
    }
  }, [])

  return {
    status,
    error,
    detectDescriptor,
    euclideanDistance,
    buildMatcher,
    identifyFace,
  }
}
