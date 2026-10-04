import { useEffect, useState } from 'react'
import { IonContent, IonIcon, IonPage } from '@ionic/react'
import { chevronForwardOutline, locationOutline, timeOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventService } from '../services/api'
import BottomNav from '../components/BottomNav'
import LicenseNotice from '../components/LicenseNotice'
import UserAvatar from '../components/UserAvatar'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const EventRow = ({ event, muted, onOpen }) => {
  const date = new Date(event.date)
  return (
    <button type="button" className={`event-row ${muted ? 'event-row--muted' : ''}`} onClick={onOpen}>
      <span className="date-tile" aria-hidden="true">
        <span className="date-tile__month">{date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
        <span className="date-tile__day">{date.getDate()}</span>
      </span>
      <span className="event-row__body">
        <span className="event-row__title">{event.name}</span>
        <span className="event-row__meta">
          <IonIcon icon={timeOutline} />
          {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          {event.location && <><span aria-hidden="true">·</span><IonIcon icon={locationOutline} />{event.location}</>}
        </span>
      </span>
      <IonIcon icon={chevronForwardOutline} />
    </button>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventService.getAll()
      .then((res) => setEvents(res.data || []))
      // Un 402 (licencia bloqueada) ya lo resuelve la pantalla de bloqueo.
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const activeEvents = events.filter((e) => e.status === 'Active')
  const upcomingEvents = activeEvents
    .filter((e) => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const pastEvents = events.filter((e) => e.status === 'Completed')

  const firstName = (user?.fullName || user?.username || 'Usuario').split(' ')[0]

  return (
    <IonPage>
      <IonContent className="ion-padding app-shell">
        <header className="home-greeting">
          <p className="eyebrow">{greeting()}</p>
          <h1 className="user-name-row"><UserAvatar imageUrl={user?.imageUrl} />Hola, {firstName}</h1>
        </header>

        <LicenseNotice />

        {loading ? (
          <div className="stat-row" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton skeleton--stat" />)}
          </div>
        ) : (
          <div className="stat-row">
            <button type="button" className="stat-chip" onClick={() => navigate('/events')}>
              <span className="stat-chip__value">{events.length}</span>
              <span className="stat-chip__label"><span className="stat-chip__dot" />Total</span>
            </button>
            <button type="button" className="stat-chip stat-chip--success" onClick={() => navigate('/events?vista=activos')}>
              <span className="stat-chip__value">{activeEvents.length}</span>
              <span className="stat-chip__label"><span className="stat-chip__dot" />Activos</span>
            </button>
            <button type="button" className="stat-chip stat-chip--primary" onClick={() => navigate('/events?vista=proximos')}>
              <span className="stat-chip__value">{upcomingEvents.length}</span>
              <span className="stat-chip__label"><span className="stat-chip__dot" />Próximos</span>
            </button>
          </div>
        )}

        <section className="home-section">
          <div className="section-header section-header--compact">
            <div>
              <h2>Próximos eventos</h2>
              <p>{loading ? 'Cargando…' : upcomingEvents.length ? plural(upcomingEvents.length, 'evento') + ' por delante' : 'No hay eventos próximos'}</p>
            </div>
            {upcomingEvents.length > 3 && (
              <button type="button" className="link-button" onClick={() => navigate('/events?vista=proximos')}>Ver todos</button>
            )}
          </div>

          {loading ? (
            [0, 1].map((i) => <div key={i} className="skeleton skeleton--card" />)
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.slice(0, 3).map((event) => (
              <EventRow key={event.id} event={event} onOpen={() => navigate(`/events/${event.id}`)} />
            ))
          ) : (
            <div className="empty-state">
              <strong>Sin eventos por delante</strong>
              <p>Cuando se cree un evento con fecha futura aparece acá.</p>
            </div>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section className="home-section">
            <div className="section-header section-header--compact">
              <div>
                <h2>Eventos pasados</h2>
                <p>{plural(pastEvents.length, 'evento')} completado{pastEvents.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            {pastEvents.slice(0, 2).map((event) => (
              <EventRow key={event.id} event={event} muted onOpen={() => navigate(`/events/${event.id}`)} />
            ))}
          </section>
        )}

        <BottomNav active="Inicio" onNavigate={navigate} />
      </IonContent>
    </IonPage>
  )
}
