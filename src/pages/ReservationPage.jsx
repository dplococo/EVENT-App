import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar
} from '@ionic/react'
import { arrowBackOutline, callOutline, mailOutline, personOutline, pricetagOutline } from 'ionicons/icons'
import { eventService, reservationService, tableService } from '../services/api'
import BottomNav from '../components/BottomNav'

export default function ReservationPage() {
  const { id, tableId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [event, setEvent] = useState(null)
  const [table, setTable] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    seatCount: 1,
    notes: ''
  })

  useEffect(() => {
    Promise.all([eventService.getById(id), tableService.getByEventId(id)])
      .then(([eventRes, tablesRes]) => {
        setEvent(eventRes.data)
        const found = (tablesRes.data || []).find((t) => String(t.id) === String(tableId))
        setTable(found || null)
      })
      .finally(() => setLoading(false))
  }, [id, tableId])

  const unitPrice = Number(table?.price || event?.ticketPrice || 0)
  const totalAmount = useMemo(() => unitPrice * Number(form.seatCount || 1), [unitPrice, form.seatCount])
  const availableSeats = Math.max(0, Number(table?.availableSeats || 0))
  const isFull = availableSeats <= 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!table) {
      setError('No se encontró la mesa seleccionada.')
      return
    }

    if (isFull) {
      setError('Esta mesa ya está completa y no admite nuevas reservas.')
      return
    }

    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }

    const clampedSeatCount = Math.min(Math.max(1, Number(form.seatCount || 1)), availableSeats)

    const payload = new FormData()
    payload.append('tableId', table.id)
    payload.append('eventId', id)
    payload.append('customerName', form.customerName.trim())
    payload.append('customerPhone', form.customerPhone.trim())
    payload.append('customerEmail', form.customerEmail.trim())
    payload.append('seatCount', String(clampedSeatCount))
    payload.append('notes', form.notes.trim())
    payload.append('unitPrice', String(unitPrice))
    payload.append('totalAmount', String(unitPrice * clampedSeatCount))
    payload.append('status', 'Reserved')
    if (receiptFile) payload.append('receipt', receiptFile)

    try {
      setSubmitting(true)
      await reservationService.create(payload)
      navigate(`/events/${id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la reserva')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <IonPage>
      <IonHeader className="mobile-sticky-header" translucent={false}>
        <IonToolbar className="mobile-sticky-header__toolbar">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="mobile-sticky-header__title">Nueva reserva</h1>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-shell app-shell--detail">
        <div className="detail-page" style={{ padding: '0 16px' }}>
          <div className="detail-page__body detail-page__body--centered">
            {loading ? (
              <div style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}><IonSpinner /></div>
            ) : (
              <>
                <div className="event-hero event-hero--compact">
                  <div className="event-hero__content">
                    <p className="eyebrow eyebrow--dark">Crear reserva</p>
                    <h1>{event?.name}</h1>
                    <div className="event-meta event-meta--dark">
                      <span>Mesa {table?.label}</span>
                      <span>{availableSeats}/{table?.capacity} disponibles</span>
                    </div>
                  </div>
                  <div className="reservation-summary">
                    <div className="reservation-summary__chip">{table?.label}</div>
                    <div>
                      <p>Disponibles</p>
                      <strong>{availableSeats}</strong>
                    </div>
                    <div>
                      <p>Total</p>
                      <strong>${totalAmount || 0}</strong>
                    </div>
                  </div>
                </div>

                {isFull ? (
                  <div className="empty-state">
                    <strong>Esta mesa está completa</strong>
                    <p>No hay asientos disponibles para reservar.</p>
                  </div>
                ) : (
                  <div className="reservation-card">
                    <form onSubmit={handleSubmit} className="reservation-form">
                      <div className="field">
                        <label className="field__label">Nombre *</label>
                        <div className="field__wrap">
                          <IonIcon icon={personOutline} className="field__icon" />
                          <input
                            type="text"
                            value={form.customerName}
                            onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                            placeholder="Nombre y apellido"
                            className="field__input"
                            required
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label className="field__label">Teléfono *</label>
                        <div className="field__wrap">
                          <IonIcon icon={callOutline} className="field__icon" />
                          <input
                            type="tel"
                            value={form.customerPhone}
                            onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                            placeholder="70000000"
                            className="field__input"
                            required
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label className="field__label">Email</label>
                        <div className="field__wrap">
                          <IonIcon icon={mailOutline} className="field__icon" />
                          <input
                            type="email"
                            value={form.customerEmail}
                            onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                            placeholder="cliente@email.com"
                            className="field__input"
                          />
                        </div>
                      </div>

                      <div className="two-col">
                        <div className="field">
                          <label className="field__label">Asientos</label>
                          <div className="field__wrap">
                            <IonIcon icon={pricetagOutline} className="field__icon" />
                            <input
                              type="number"
                              min="1"
                              max={availableSeats}
                              value={form.seatCount}
                              onChange={(e) => {
                                const nextValue = Number(e.target.value || 1)
                                const clamped = Math.min(Math.max(1, nextValue), availableSeats)
                                setForm((prev) => ({ ...prev, seatCount: clamped }))
                              }}
                              className="field__input"
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label className="field__label">Precio unitario</label>
                          <div className="field__wrap">
                            <input value={unitPrice || ''} readOnly className="field__input field__input--readonly" />
                          </div>
                        </div>
                      </div>

                      <div className="field">
                        <label className="field__label">Notas</label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Observaciones opcionales"
                          className="field__textarea"
                          rows={3}
                        />
                      </div>

                      <div className="file-box">
                        <label className="file-label">
                          <span>Comprobante opcional</span>
                          <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                        </label>
                        {receiptFile ? <p className="file-name">{receiptFile.name}</p> : <p className="file-hint">JPG o PNG.</p>}
                      </div>

                      {error ? <div className="error-banner">{error}</div> : null}

                      <button type="submit" className="login-btn" disabled={submitting}>
                        {submitting ? <IonSpinner name="crescent" /> : 'Confirmar reserva'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            <BottomNav active="Eventos" onNavigate={navigate} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
