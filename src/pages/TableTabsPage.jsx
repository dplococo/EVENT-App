import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonToolbar } from '@ionic/react'
import { arrowBackOutline, chevronForwardOutline, peopleOutline, receiptOutline } from 'ionicons/icons'
import { apiError, tabService, tableService } from '../services/api'
import SectionHeader from '../components/SectionHeader'
import BottomNav from '../components/BottomNav'
import { eventWindowLabel, money } from '../utils/money'

const TabRow = ({ title, subtitle, tab, onOpen, onGo, busy, canOpen = true }) => (
  <button type="button" className="tab-row" onClick={tab ? () => onGo(tab) : onOpen} disabled={busy || (!tab && !canOpen)}>
    <div className="tab-row__body">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </div>
    {busy ? (
      <IonSpinner name="crescent" />
    ) : tab ? (
      <div className="tab-row__amount">
        <strong>{money(tab.runningSubtotal)}</strong>
        <span>{tab.itemCount} ítems</span>
      </div>
    ) : canOpen ? (
      <span className="tab-row__cta">Abrir cuenta</span>
    ) : (
      <span className="tab-row__cta tab-row__cta--off">Sin cuenta</span>
    )}
    <IonIcon icon={chevronForwardOutline} className="tab-row__chevron" />
  </button>
)

/**
 * Cuentas de una mesa: la de la mesa entera y una por reserva, para cuando
 * cada grupo paga lo suyo. Se usa la que corresponda; pueden convivir.
 */
export default function TableTabsPage() {
  const { id, tableId } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = useState(null)
  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(null)
  const [error, setError] = useState('')
  const [live, setLive] = useState(null)

  useEffect(() => {
    Promise.all([tableService.getWithReservations(tableId), tabService.getByEvent(id, 'Open'), tabService.getLive(id)])
      .then(([tableRes, tabsRes, liveRes]) => {
        setTable(tableRes.data)
        setLive(liveRes.data)
        setTabs((tabsRes.data || []).filter((t) => String(t.tableId) === String(tableId)))
      })
      .catch((err) => setError(apiError(err, 'No se pudo cargar la mesa')))
      .finally(() => setLoading(false))
  }, [id, tableId])

  const reservations = (table?.reservations || []).filter((r) => r.status !== 'Cancelled')
  const tableTab = tabs.find((t) => !t.reservationId)
  const tabForReservation = (reservationId) => tabs.find((t) => t.reservationId === reservationId)

  const goToTab = (tab) => navigate(`/events/${id}/tabs/${tab.id}`)

  // Abre la cuenta (o recupera la que ya abrió otro mozo) y entra.
  const openTab = async (reservationId = null) => {
    setError('')
    setOpening(reservationId ?? 'table')
    try {
      const res = await tabService.open(id, Number(tableId), reservationId)
      goToTab(res.data)
    } catch (err) {
      setError(apiError(err, 'No se pudo abrir la cuenta'))
    } finally {
      setOpening(null)
    }
  }

  return (
    <IonPage>
      <IonHeader className="mobile-sticky-header" translucent={false}>
        <IonToolbar className="mobile-sticky-header__toolbar">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="mobile-sticky-header__title">Mesa {table?.label || ''}</h1>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding app-shell app-shell--detail">
        <div className="detail-page">
          <div className="detail-page__body">
            {loading ? (
              <div className="center-fill"><IonSpinner name="crescent" /></div>
            ) : (
              <>
                {error ? <div className="error-banner">{error}</div> : null}
                {live && !live.isLive && (
                  <div className="notice notice--warning">
                    <div>
                      <strong>{live.reason}</strong>
                      <p>No se abren cuentas nuevas fuera del horario del evento ({eventWindowLabel(live)}).</p>
                    </div>
                  </div>
                )}

                <SectionHeader title="Cuenta de la mesa" subtitle="Todo lo que se consume en la mesa va a una sola cuenta." />
                <TabRow
                  title={<><IonIcon icon={receiptOutline} /> Mesa {table?.label}</>}
                  subtitle={tableTab ? `Abierta por ${tableTab.openedBy || '—'}` : 'Sin cuenta abierta'}
                  tab={tableTab}
                  onOpen={() => openTab(null)}
                  onGo={goToTab}
                  canOpen={live?.isLive}
                  busy={opening === 'table'}
                />

                <SectionHeader title="Por reserva" subtitle="Cuando cada grupo de la mesa paga lo suyo." />
                {reservations.length === 0 ? (
                  <div className="empty-state">
                    <strong>Sin reservas</strong>
                    <p>Esta mesa no tiene reservas: usá la cuenta de la mesa.</p>
                  </div>
                ) : (
                  <div className="tab-list">
                    {reservations.map((r) => (
                      <TabRow
                        key={r.id}
                        title={<><IonIcon icon={peopleOutline} /> {r.customerName}</>}
                        subtitle={`${r.seatCount} ${r.seatCount === 1 ? 'lugar' : 'lugares'}`}
                        tab={tabForReservation(r.id)}
                        onOpen={() => openTab(r.id)}
                        onGo={goToTab}
                        canOpen={live?.isLive}
                        busy={opening === r.id}
                      />
                    ))}
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
