import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonToolbar } from '@ionic/react'
import { arrowBackOutline, calendarOutline, locationOutline } from 'ionicons/icons'
import { eventService, tableService, tabService } from '../services/api'
import SectionHeader from '../components/SectionHeader'
import BottomNav from '../components/BottomNav'
import { resolveAssetUrl } from '../utils/assetUrl'
import { usePolling } from '../hooks/usePolling'
import { eventWindowLabel, money } from '../utils/money'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [stats, setStats] = useState(null)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapAspectRatio, setMapAspectRatio] = useState(null)
  const [openTabs, setOpenTabs] = useState([])
  const [live, setLive] = useState(null)
  // El modo va en la URL para que al volver de una cuenta siga en Consumos.
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('modo') === 'consumos' ? 'consumos' : 'reservas'
  const setMode = (next) => setSearchParams(next === 'consumos' ? { modo: 'consumos' } : {}, { replace: true })
  const VIRTUAL_WIDTH = 900
  const VIRTUAL_HEIGHT = 700

  useEffect(() => {
    Promise.all([eventService.getById(id), eventService.getStats(id), tableService.getByEventId(id)])
      .then(([eventRes, statsRes, tablesRes]) => {
        setEvent(eventRes.data)
        setStats(statsRes.data)
        setTables(tablesRes.data || [])
      })
      .finally(() => setLoading(false))
  }, [id])

  // Refresca la disponibilidad de mesas mientras el usuario navega el mapa,
  // para reflejar reservas hechas desde el desktop u otros dispositivos.
  usePolling(() => {
    Promise.all([eventService.getStats(id), tableService.getByEventId(id)])
      .then(([statsRes, tablesRes]) => {
        setStats(statsRes.data)
        setTables(tablesRes.data || [])
      })
      .catch(() => {})
  }, 15000, [id])

  // En modo Consumos se siguen las cuentas abiertas que cargan los demás mozos.
  usePolling(() => {
    if (mode !== 'consumos') return
    Promise.all([tabService.getByEvent(id, 'Open'), tabService.getLive(id)])
      .then(([tabsRes, liveRes]) => {
        setOpenTabs(tabsRes.data || [])
        setLive(liveRes.data)
      })
      .catch(() => {})
  }, 10000, [id, mode])

  // Cuentas abiertas y lo consumido hasta ahora, por mesa.
  const tabsByTable = useMemo(() => {
    const map = new Map()
    for (const tab of openTabs) {
      const entry = map.get(tab.tableId) || { count: 0, amount: 0 }
      entry.count += 1
      entry.amount += tab.runningSubtotal
      map.set(tab.tableId, entry)
    }
    return map
  }, [openTabs])
  const openAmount = openTabs.reduce((sum, tab) => sum + tab.runningSubtotal, 0)

  const handleTableTap = (table) => {
    navigate(mode === 'consumos' ? `/events/${id}/tables/${table.id}/consumos` : `/events/${id}/reserve/${table.id}`)
  }

  const projectTablePosition = (table) => {
    if (!tables.length) {
      return { left: '50%', top: '50%' }
    }

    // posX/posY son la esquina superior izquierda (como en el diseñador): se ubica el centro.
    const rawX = Number(table.posX || 0) + Number(table.width || 0) / 2
    const rawY = Number(table.posY || 0) + Number(table.height || 0) / 2
    return {
      left: `${Math.max(3, Math.min(97, (rawX / VIRTUAL_WIDTH) * 100))}%`,
      top: `${Math.max(3, Math.min(97, (rawY / VIRTUAL_HEIGHT) * 100))}%`
    }
  }

  const getTableDotSize = (table) => {
    const capacity = Number(table.capacity || 0)
    if (capacity <= 2) return 6
    if (capacity <= 4) return 7
    if (capacity <= 6) return 8
    if (capacity <= 8) return 9
    return 10
  }

  const handleMapImageLoad = (eventTarget) => {
    const { naturalWidth, naturalHeight } = eventTarget
    if (naturalWidth && naturalHeight) {
      setMapAspectRatio(`${naturalWidth} / ${naturalHeight}`)
    }
  }

  return (
    <IonPage>
      <IonHeader className="mobile-sticky-header" translucent={false}>
        <IonToolbar className="mobile-sticky-header__toolbar">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="mobile-sticky-header__title">{event?.name || 'Detalle'}</h1>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding app-shell app-shell--detail">
        <div className="detail-page">

          <div className="detail-page__body">
            {loading ? (
              <div className="center-fill"><IonSpinner name="crescent" /></div>
            ) : (
              <>
                <div className="event-hero event-hero--compact">
                  <div className="event-hero__content">
                    <h1>{event?.name}</h1>
                    <div className="event-meta">
                      <span><IonIcon icon={locationOutline} /> {event?.location}</span>
                      <span><IonIcon icon={calendarOutline} /> {new Date(event?.date).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>

                <div className="mode-switch" role="tablist" aria-label="Modo">
                  <button type="button" role="tab" aria-selected={mode === 'reservas'} className={mode === 'reservas' ? 'is-active' : ''} onClick={() => setMode('reservas')}>Reservas</button>
                  <button type="button" role="tab" aria-selected={mode === 'consumos'} className={mode === 'consumos' ? 'is-active' : ''} onClick={() => setMode('consumos')}>Consumos</button>
                </div>

                {mode === 'consumos' && live && !live.isLive && (
                  <div className="notice notice--warning">
                    <div>
                      <strong>{live.reason}</strong>
                      <p>Los consumos se cargan solo durante el evento ({eventWindowLabel(live)}). Las cuentas abiertas se pueden cobrar igual.</p>
                    </div>
                  </div>
                )}

                {mode === 'consumos' && (
                  <div className="metric-row">
                    <div className="metric-card metric-card--primary">
                      <p className="metric-label">Cuentas abiertas</p>
                      <div className="metric-value">{openTabs.length}</div>
                    </div>
                    <div className="metric-card metric-card--neutral">
                      <p className="metric-label">Por cobrar</p>
                      <div className="metric-value">{money(openAmount)}</div>
                    </div>
                  </div>
                )}

                {mode === 'reservas' && stats && (
                  <>
                    <div className="metric-row">
                      <div className="metric-card metric-card--neutral">
                        <p className="metric-label">Mesas totales</p>
                        <div className="metric-value">{stats.totalTables}</div>
                      </div>
                      <div className="metric-card metric-card--success">
                        <p className="metric-label">Disponibles</p>
                        <div className="metric-value">{stats.availableSeats}</div>
                      </div>
                    </div>
                    <div className="metric-row">
                      <div className="metric-card metric-card--warning">
                        <p className="metric-label">Pendientes</p>
                        <div className="metric-value">{stats.pendingReservations}</div>
                      </div>
                      <div className="metric-card metric-card--primary">
                        <p className="metric-label">Confirmadas</p>
                        <div className="metric-value">{stats.confirmedReservations}</div>
                      </div>
                    </div>
                  </>
                )}

                <SectionHeader
                  title="Mapa de mesas"
                  subtitle={mode === 'consumos' ? 'Tocá una mesa para cargar consumos.' : 'Tocá una mesa para ver detalles o reservar.'}
                />
                <IonCard className="soft-card map-card">
                  <IonCardContent>
                    <div className="map-stage map-stage--poster map-stage--mobile-tidy">
                      <div className="map-stage__frame" style={mapAspectRatio ? { aspectRatio: mapAspectRatio } : undefined}>
                        {event?.backgroundCanvasUrl ? (
                          <img
                            className="map-bg"
                            src={resolveAssetUrl(event.backgroundCanvasUrl)}
                            alt={`Plano de ${event.name}`}
                            onLoad={(e) => handleMapImageLoad(e.currentTarget)}
                          />
                        ) : (
                          <div className="map-fallback">
                            <div>
                              <strong>Plano no cargado</strong>
                              <p>Se mostrará el mapa real cuando el evento tenga imagen de fondo.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="map-overlay" style={mapAspectRatio ? { aspectRatio: mapAspectRatio } : undefined}>
                        {tables.map((table) => {
                          const tabInfo = tabsByTable.get(table.id)
                          const state = mode === 'consumos'
                            ? (tabInfo ? 'tab' : 'idle')
                            : table.computedStatus === 'full' ? 'full' : table.computedStatus === 'partial' ? 'partial' : 'free'
                          const dotSize = getTableDotSize(table)
                          return (
                            <button
                              key={table.id}
                              type="button"
                              className={`map-dot state-${state}`}
                              style={{
                                ...projectTablePosition(table),
                                width: `${dotSize}px`,
                                height: `${dotSize}px`
                              }}
                              onClick={() => handleTableTap(table)}
                              aria-label={`Mesa ${table.label}`}
                              title={`Mesa ${table.label} · ${table.reservedSeats}/${table.capacity}`}
                            >
                              <span className={`dot-label ${dotSize <= 7 ? 'dot-label--small' : ''}`}>{`${table.reservedSeats}/${table.capacity}`}</span>
                            </button>
                          )
                        })}
                      </div>

                      {tables.length === 0 && <div className="empty-map">No hay mesas cargadas para este evento.</div>}
                    </div>
                  </IonCardContent>
                </IonCard>

                {mode === 'consumos' ? (
                  <>
                    <div className="bottom-legend">
                      <span><i className="legend-dot tab" />Con cuenta abierta</span>
                      <span><i className="legend-dot idle" />Sin consumos</span>
                    </div>
                    <SectionHeader title="Mesas" />
                    <div className="tab-table-grid">
                      {tables.map((table) => {
                        const tabInfo = tabsByTable.get(table.id)
                        return (
                          <button
                            key={table.id}
                            type="button"
                            className={`tab-table ${tabInfo ? 'tab-table--open' : ''}`}
                            onClick={() => handleTableTap(table)}
                          >
                            <strong>{table.label}</strong>
                            <span>{tabInfo ? money(tabInfo.amount) : 'Sin cuenta'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="bottom-legend">
                    <span><i className="legend-dot free" />Disponible</span>
                    <span><i className="legend-dot partial" />Parcial</span>
                    <span><i className="legend-dot full" />Lleno</span>
                  </div>
                )}
              </>
            )}
          </div>

          <BottomNav active="Eventos" onNavigate={navigate} />
        </div>
      </IonContent>
    </IonPage>
  )
}
