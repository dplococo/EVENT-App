import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonToolbar } from '@ionic/react'
import {
  alertCircleOutline, arrowBackOutline, checkmarkCircleOutline, closeCircleOutline,
  qrCodeOutline, searchOutline, timeOutline,
} from 'ionicons/icons'
import jsQR from 'jsqr'
import { apiError, eventService, ticketService } from '../services/api'
import { usePolling } from '../hooks/usePolling'

// Lo que muestra la pantalla según la respuesta del check-in.
const RESULTS = {
  ok: { tone: 'ok', icon: checkmarkCircleOutline, title: 'Adelante' },
  used: { tone: 'warn', icon: timeOutline, title: 'Ya ingresó' },
  cancelled: { tone: 'bad', icon: closeCircleOutline, title: 'Entrada anulada' },
  wrong_event: { tone: 'bad', icon: alertCircleOutline, title: 'Es de otro evento' },
  not_found: { tone: 'bad', icon: closeCircleOutline, title: 'Entrada no válida' },
}

const time = (value) => (value ? new Date(value).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '')

const vibrate = (pattern) => { try { navigator.vibrate?.(pattern) } catch { /* sin vibración */ } }

/**
 * Lee QR con la cámara. Usa el lector nativo del navegador cuando existe
 * (Android) y si no decodifica cuadros con jsQR (iOS).
 */
function useQrScanner(videoRef, onCode, paused) {
  const [cameraError, setCameraError] = useState('')
  const pausedRef = useRef(paused)
  const onCodeRef = useRef(onCode)
  pausedRef.current = paused
  onCodeRef.current = onCode

  useEffect(() => {
    let stream
    let stopped = false
    let timer
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null

    const tick = async () => {
      if (stopped) return
      const video = videoRef.current
      if (!pausedRef.current && video && video.readyState >= 2) {
        try {
          let value = null
          if (detector) {
            const codes = await detector.detect(video)
            value = codes[0]?.rawValue || null
          } else {
            const w = video.videoWidth
            const h = video.videoHeight
            // Se reduce el cuadro: alcanza para un QR y es mucho más rápido.
            const scale = Math.min(1, 640 / Math.max(w, h))
            canvas.width = Math.round(w * scale)
            canvas.height = Math.round(h * scale)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            value = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data || null
          }
          if (value) onCodeRef.current(value)
        } catch { /* cuadro ilegible: se sigue con el próximo */ }
      }
      timer = setTimeout(tick, 180)
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Este dispositivo no da acceso a la cámara desde la app. Usá la búsqueda por nombre o CI.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        const video = videoRef.current
        video.srcObject = stream
        await video.play().catch(() => {})
        tick()
      } catch (err) {
        setCameraError(err?.name === 'NotAllowedError'
          ? 'No hay permiso para usar la cámara. Habilitalo en los ajustes del teléfono.'
          : 'No se pudo abrir la cámara. Usá la búsqueda por nombre o CI.')
      }
    }

    start()
    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return cameraError
}

export default function ScanPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const lastRef = useRef({ code: '', at: 0 })
  const [event, setEvent] = useState(null)
  const [summary, setSummary] = useState(null)
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [tab, setTab] = useState('scan')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [busyCode, setBusyCode] = useState('')

  useEffect(() => {
    eventService.getById(id).then((res) => setEvent(res.data)).catch(() => {})
  }, [id])

  const loadSummary = () => ticketService.getSummary(id).then((res) => setSummary(res.data.totals)).catch(() => {})
  usePolling(loadSummary, 10000, [id])

  const checkIn = useCallback(async (code) => {
    setChecking(true)
    try {
      const res = await ticketService.checkIn(id, code)
      setResult(res.data)
      vibrate(res.data.result === 'ok' ? 80 : [120, 80, 120])
      if (res.data.result === 'ok') loadSummary()
      return res.data
    } catch (err) {
      setResult({ result: 'error', message: apiError(err, 'No se pudo validar la entrada') })
      vibrate([120, 80, 120])
      return null
    } finally {
      setChecking(false)
    }
  }, [id])

  // El mismo QR queda frente a la cámara varios cuadros: se lee una vez.
  const onCode = useCallback((code) => {
    const now = Date.now()
    if (code === lastRef.current.code && now - lastRef.current.at < 4000) return
    lastRef.current = { code, at: now }
    checkIn(code)
  }, [checkIn])

  const cameraError = useQrScanner(videoRef, onCode, tab !== 'scan' || checking || !!result)

  // Tras un ingreso válido se vuelve sola a escanear; un rechazo espera el toque.
  useEffect(() => {
    if (result?.result !== 'ok') return
    const t = setTimeout(() => setResult(null), 2200)
    return () => clearTimeout(t)
  }, [result])

  useEffect(() => {
    if (tab !== 'search') return
    const q = search.trim()
    if (q.length < 2) { setOrders(null); return }
    const t = setTimeout(() => {
      ticketService.getOrders(id, q)
        .then((res) => { setOrders(res.data); setSearchError('') })
        .catch((err) => setSearchError(apiError(err, 'No se pudo buscar')))
    }, 300)
    return () => clearTimeout(t)
  }, [id, search, tab])

  const admitFromList = async (order, ticket) => {
    setBusyCode(ticket.code)
    const data = await checkIn(ticket.code)
    setBusyCode('')
    if (data) {
      setOrders((list) => list?.map((o) => o.id !== order.id ? o : {
        ...o,
        usedCount: o.usedCount + (data.result === 'ok' ? 1 : 0),
        tickets: o.tickets.map((t) => t.code === ticket.code && data.result === 'ok' ? { ...t, status: 'Used', checkedInAt: new Date().toISOString() } : t),
      }))
    }
  }

  const meta = result && (RESULTS[result.result] || { tone: 'bad', icon: alertCircleOutline, title: 'Error' })
  const info = result?.ticket

  return (
    <IonPage>
      <IonHeader className="mobile-sticky-header" translucent={false}>
        <IonToolbar className="mobile-sticky-header__toolbar">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="mobile-sticky-header__title">Control de acceso</h1>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding app-shell app-shell--detail">
        <div className="scan-page">
          <div className="scan-counter">
            <div>
              <span>{event?.name || 'Evento'}</span>
              <strong>{summary ? `${summary.used} / ${summary.sold}` : '—'}</strong>
              <span>ingresaron</span>
            </div>
            <IonIcon icon={qrCodeOutline} />
          </div>

          <div className="mode-switch" role="tablist" aria-label="Modo">
            <button type="button" role="tab" aria-selected={tab === 'scan'} className={tab === 'scan' ? 'is-active' : ''} onClick={() => setTab('scan')}>Escanear QR</button>
            <button type="button" role="tab" aria-selected={tab === 'search'} className={tab === 'search' ? 'is-active' : ''} onClick={() => setTab('search')}>Buscar</button>
          </div>

          {/* El video queda montado aunque se cambie a Buscar: la cámara sigue abierta y vuelve al instante. */}
          {tab === 'scan' && cameraError && (
            <div className="notice notice--warning"><div><strong>Cámara no disponible</strong><p>{cameraError}</p></div></div>
          )}
          <div className="scan-camera" hidden={tab !== 'scan' || !!cameraError}>
            <video ref={videoRef} playsInline muted autoPlay />
            <div className="scan-camera__frame" aria-hidden="true" />
            <p className="scan-camera__hint">{checking ? 'Validando…' : 'Apuntá al QR de la entrada'}</p>
          </div>

          {tab === 'search' && (
            <div className="scan-search">
              <div className="search-bar__field">
                <IonIcon icon={searchOutline} />
                <input className="search-bar__input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, CI, teléfono o código" autoFocus />
              </div>
              {searchError && <div className="error-banner">{searchError}</div>}
              {orders && orders.length === 0 && (
                <div className="empty-state"><strong>Sin resultados</strong><p>Probá con otro dato del comprador.</p></div>
              )}
              {orders?.map((o) => (
                <div key={o.id} className={`scan-order ${o.status === 'Cancelled' ? 'is-cancelled' : ''}`}>
                  <div className="scan-order__head">
                    <div>
                      <strong>{o.customerName}</strong>
                      <span>{o.customerDocument ? `CI ${o.customerDocument} · ` : ''}{o.zoneName}</span>
                    </div>
                    <span className="scan-order__count">{o.status === 'Cancelled' ? 'Anulada' : `${o.usedCount}/${o.quantity}`}</span>
                  </div>
                  {o.status !== 'Cancelled' && (
                    <div className="scan-order__tickets">
                      {o.tickets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`scan-ticket ${t.status === 'Used' ? 'is-used' : ''}`}
                          disabled={t.status !== 'Valid' || !!busyCode}
                          onClick={() => admitFromList(o, t)}
                        >
                          {busyCode === t.code ? <IonSpinner name="crescent" /> : t.status === 'Used' ? `#${t.number} ✓ ${time(t.checkedInAt)}` : `#${t.number} Marcar ingreso`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {result && (
          <button type="button" className={`scan-result scan-result--${meta.tone}`} onClick={() => setResult(null)}>
            <IonIcon icon={meta.icon} />
            <strong>{meta.title}</strong>
            {result.result === 'error' && <p>{result.message}</p>}
            {result.result === 'wrong_event' && <p>Esta entrada es para «{result.eventName}».</p>}
            {info && (
              <div className="scan-result__info">
                <span className="scan-result__zone"><i style={{ backgroundColor: info.zoneColor }} />{info.zoneName}</span>
                <p>{info.customerName}{info.customerDocument ? ` · CI ${info.customerDocument}` : ''}</p>
                <p>Entrada {info.number} de {info.quantity}</p>
                {result.result === 'used' && <p>Ingresó a las {time(info.checkedInAt)}{info.checkedInByName ? ` (${info.checkedInByName})` : ''}</p>}
              </div>
            )}
            <span className="scan-result__next">{result.result === 'ok' ? '' : 'Tocá para seguir'}</span>
          </button>
        )}
      </IonContent>
    </IonPage>
  )
}
