import { useEffect, useState } from 'react'
import { IonCard, IonCardContent, IonContent, IonIcon, IonPage, IonSpinner, IonBadge } from '@ionic/react'
import {
  calendarOutline,
  chevronForwardOutline,
  personOutline,
  logOutOutline,
  locationOutline,
} from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventService } from '../services/api'
import BottomNav from '../components/BottomNav'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventService.getAll()
      .then((res) => setEvents(res.data || []))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const activeEvents = events.filter(e => e.status === 'Active')
  const upcomingEvents = events.filter(e => new Date(e.date) > now && e.status === 'Active')
  const pastEvents = events.filter(e => e.status === 'Completed')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <IonPage>
      <IonContent className="ion-padding app-shell">
        <header className="home-greeting home-greeting--compact">
          <p className="eyebrow eyebrow--dark">{greeting()}</p>
          <h1>Hola, {user?.fullName || user?.username || 'Usuario'}</h1>
        </header>

        {/* Stats */}
        <section className="quick-panel quick-panel--compact">
          <p className="quick-panel__title">Resumen</p>
          <p className="quick-panel__subtitle">Vista general del sistema</p>

          {loading ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: 80 }}><IonSpinner name="crescent" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => navigate('/events')}
                style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: 'var(--app-bg-soft)', border: '1px solid var(--app-border-solid)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--app-text-main)' }}>{events.length}</div>
                <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>Total</div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/events')}
                style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.16)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{activeEvents.length}</div>
                <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>Activos</div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/events')}
                style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.16)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{upcomingEvents.length}</div>
                <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>Próximos</div>
              </button>
            </div>
          )}
        </section>

        {/* Accesos rápidos */}
        <section className="quick-panel quick-panel--compact" style={{ marginTop: 12 }}>
          <p className="quick-panel__title">Accesos rápidos</p>
          <div className="quick-panel__grid">
            <button className="quick-action" type="button" onClick={() => navigate('/events')}>
              <IonIcon icon={calendarOutline} />
              <span>Eventos</span>
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/profile')}>
              <IonIcon icon={personOutline} />
              <span>Mi perfil</span>
            </button>
            <button className="quick-action" type="button" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
              <IonIcon icon={logOutOutline} />
              <span>Salir</span>
            </button>
          </div>
        </section>

        {/* Próximos eventos */}
        {upcomingEvents.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <div className="section-header section-header--compact">
              <div>
                <h2>Próximos eventos</h2>
                <p>{upcomingEvents.length} evento{upcomingEvents.length !== 1 ? 's' : ''} activo{upcomingEvents.length !== 1 ? 's' : ''}</p>
              </div>
              <button type="button" onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', color: 'var(--app-text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Ver todos
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {upcomingEvents.slice(0, 3).map((event) => (
                <IonCard key={event.id} className="shortcut-card shortcut-card--compact" button onClick={() => navigate(`/events/${event.id}`)}>
                  <IonCardContent>
                    <div className="shortcut-card__row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.name}</strong>
                          <IonBadge color="success" style={{ flexShrink: 0, fontSize: 10 }}>Activo</IonBadge>
                        </div>
                        <div style={{ display: 'flex', gap: 12, color: 'var(--app-text-muted)', fontSize: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={calendarOutline} style={{ fontSize: 13 }} />
                            {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={locationOutline} style={{ fontSize: 13 }} />
                            {event.location?.length > 20 ? event.location.slice(0, 20) + '…' : event.location}
                          </span>
                        </div>
                      </div>
                      <IonIcon icon={chevronForwardOutline} style={{ flexShrink: 0, color: 'var(--app-text-muted)' }} />
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </section>
        )}

        {/* Últimos eventos completados */}
        {pastEvents.length > 0 && (
          <section style={{ marginTop: 16, marginBottom: 80 }}>
            <div className="section-header section-header--compact">
              <div>
                <h2>Eventos pasados</h2>
                <p>{pastEvents.length} evento{pastEvents.length !== 1 ? 's' : ''} completado{pastEvents.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {pastEvents.slice(0, 2).map((event) => (
                <IonCard key={event.id} className="shortcut-card shortcut-card--compact shortcut-card--muted" button onClick={() => navigate(`/events/${event.id}`)}>
                  <IonCardContent>
                    <div className="shortcut-card__row">
                      <div>
                        <strong style={{ fontSize: 14 }}>{event.name}</strong>
                        <p style={{ margin: '2px 0 0', color: 'var(--app-text-muted)', fontSize: 12 }}>
                          {new Date(event.date).toLocaleDateString('es-ES')} · {event.location}
                        </p>
                      </div>
                      <IonBadge color="medium" style={{ fontSize: 10 }}>Completado</IonBadge>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </section>
        )}

        <BottomNav active="Inicio" onNavigate={navigate} />
      </IonContent>
    </IonPage>
  )
}
