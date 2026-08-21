import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonContent, IonHeader, IonToolbar, IonIcon, IonPage, IonSpinner, IonRefresher, IonRefresherContent } from '@ionic/react'
import { chevronForwardOutline, filterOutline, searchOutline, arrowBackOutline, closeOutline, calendarOutline } from 'ionicons/icons'
import { eventService, categoryService } from '../services/api'
import BottomNav from '../components/BottomNav'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState('date-asc')
  const [categoryFilter, setCategoryFilter] = useState('')
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const [eventsRes, catsRes] = await Promise.all([
        eventService.getAll(),
        categoryService.getAll().catch(() => ({ data: [] }))
      ])
      setEvents(eventsRes.data)
      setCategories(catsRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = async (e) => {
    await loadData()
    e.detail.complete()
  }

  const getCategoryById = (categoryId) => {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId) || null
  }

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = events.filter((event) => {
      const matchesQuery = !normalizedQuery || [
        event.name, event.location, event.address
      ].some(v => v && String(v).toLowerCase().includes(normalizedQuery))

      const matchesCategory = !categoryFilter || String(event.categoryId) === categoryFilter

      return matchesQuery && matchesCategory
    })

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortMode === 'date-desc' ? dateB - dateA : dateA - dateB
    })
  }, [events, query, sortMode, categoryFilter])

  return (
    <IonPage>
      <IonHeader className="mobile-sticky-header" translucent={false}>
        <IonToolbar className="mobile-sticky-header__toolbar">
          <button className="icon-button" type="button" onClick={() => navigate('/home')} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="mobile-sticky-header__title">Eventos</h1>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-shell app-shell--events">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Deslizá para actualizar" refreshingText="Actualizando..." />
        </IonRefresher>

        <div className="events-page" style={{ padding: '0 16px' }}>
          <div className="events-page__header">
            <div className="search-bar">
              <label className="search-bar__field" aria-label="Buscar evento">
                <IonIcon icon={searchOutline} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar evento..."
                  className="search-bar__input"
                />
                {query ? (
                  <button type="button" className="search-bar__clear" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
                    <IonIcon icon={closeOutline} />
                  </button>
                ) : null}
              </label>
              <button
                className={`icon-button icon-button--soft ${sortMode === 'date-desc' ? 'is-active' : ''}`}
                type="button"
                aria-label="Ordenar por fecha"
                onClick={() => setSortMode((c) => c === 'date-asc' ? 'date-desc' : 'date-asc')}
              >
                <IonIcon icon={filterOutline} />
              </button>
            </div>

            {categories.length > 0 && (
              <div className="category-select-wrap">
                <select
                  className="category-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="search-meta">
              <span className="search-meta__sort">
                <IonIcon icon={calendarOutline} />
                {sortMode === 'date-asc' ? 'Más próximos primero' : 'Más lejanos primero'}
              </span>
              <span>{visibleEvents.length} resultado{visibleEvents.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          {loading ? <div className="events-loading"><IonSpinner /></div> : (
            <div className="events-grid">
              {visibleEvents.map((event) => {
                const cat = getCategoryById(event.categoryId)
                return (
                  <button key={event.id} className="event-card" type="button" onClick={() => navigate(`/events/${event.id}`)}>
                    {cat && (
                      <div className="event-card__accent" style={{ background: cat.color }} />
                    )}
                    <div className="event-card__body">
                      <div className="event-card__top">
                        <div>
                          <h2>{event.name}</h2>
                          <p className="event-card__meta">
                            {new Date(event.date).toLocaleDateString('es-ES')} · {event.location}
                          </p>
                        </div>
                        <span className={`event-badge event-badge--${event.status === 'Active' ? 'success' : 'muted'}`}>
                          {event.status === 'Active' ? 'Activo' : event.status}
                        </span>
                      </div>
                      {cat && (
                        <span className="event-card__category" style={{ background: cat.color + '18', color: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                      <div className="event-card__footer">
                        <span className="event-card__cta">Ver mapa y reservar</span>
                        <IonIcon icon={chevronForwardOutline} />
                      </div>
                    </div>
                  </button>
                )
              })}
              {visibleEvents.length === 0 ? (
                <div className="empty-state">
                  <strong>No hay eventos con ese criterio.</strong>
                  <p>Probá otro nombre, lugar o fecha.</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <BottomNav active="Eventos" onNavigate={navigate} />
      </IonContent>
    </IonPage>
  )
}
