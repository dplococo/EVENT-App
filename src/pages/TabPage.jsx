import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonToolbar, useIonAlert } from '@ionic/react'
import { addOutline, arrowBackOutline, closeOutline, removeOutline, searchOutline } from 'ionicons/icons'
import { apiError, productService, tabService } from '../services/api'
import SectionHeader from '../components/SectionHeader'
import { usePolling } from '../hooks/usePolling'
import { eventWindowLabel, money, PAYMENT_METHODS, paymentLabel } from '../utils/money'

const Sheet = ({ title, onClose, children }) => (
  <div className="sheet-backdrop" onClick={onClose}>
    <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <div className="sheet__header">
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
          <IonIcon icon={closeOutline} />
        </button>
      </div>
      {children}
    </div>
  </div>
)

const Stepper = ({ value, onChange, max }) => (
  <div className="stepper">
    <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Menos"><IonIcon icon={removeOutline} /></button>
    <strong>{value}</strong>
    <button type="button" onClick={() => onChange(Math.min(max ?? 999, value + 1))} aria-label="Más"><IonIcon icon={addOutline} /></button>
  </div>
)

/** Carga de productos: buscador, filtro por categoría y cantidad. */
function AddItemSheet({ onClose, onAdd }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    productService.getActive()
      .then((res) => setProducts(res.data || []))
      .catch((err) => setError(apiError(err, 'No se pudo cargar la carta')))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products])
  const visible = products.filter((p) =>
    (!category || p.category === category) &&
    (!query || p.name.toLowerCase().includes(query.trim().toLowerCase()))
  )
  const outOfStock = (p) => p.trackStock && p.stock <= 0

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      await onAdd(selected.id, quantity)
      onClose()
    } catch (err) {
      setError(apiError(err, 'No se pudo cargar el consumo'))
    } finally {
      setSaving(false)
    }
  }

  if (selected) {
    return (
      <Sheet title={selected.name} onClose={onClose}>
        <div className="sheet__body">
          <p className="sheet__hint">
            {money(selected.price)} c/u{selected.trackStock ? ` · quedan ${selected.stock}` : ''}
          </p>
          <Stepper value={quantity} onChange={setQuantity} max={selected.trackStock ? selected.stock : undefined} />
          {error ? <div className="error-banner">{error}</div> : null}
          <button type="button" className="login-btn" onClick={submit} disabled={saving}>
            {saving ? <IonSpinner name="crescent" /> : `Agregar ${quantity} · ${money(selected.price * quantity)}`}
          </button>
          <button type="button" className="link-button" onClick={() => { setSelected(null); setQuantity(1); setError('') }}>
            Elegir otro producto
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Agregar consumo" onClose={onClose}>
      <div className="sheet__body">
        <div className="search-bar__field">
          <IonIcon icon={searchOutline} />
          <input
            className="search-bar__input"
            placeholder="Buscar producto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        {categories.length > 0 && (
          <div className="category-chips">
            <button type="button" className={`category-chip ${!category ? 'category-chip--active' : ''}`} onClick={() => setCategory('')}>Todo</button>
            {categories.map((c) => (
              <button key={c} type="button" className={`category-chip ${category === c ? 'category-chip--active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        )}
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? (
          <div className="sheet__loading"><IonSpinner name="crescent" /></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <strong>{products.length === 0 ? 'La carta está vacía' : 'Sin resultados'}</strong>
            <p>{products.length === 0 ? 'Cargá productos desde el panel web, en Productos e inventario.' : 'Probá con otro nombre.'}</p>
          </div>
        ) : (
          <div className="product-list">
            {visible.map((p) => (
              <button key={p.id} type="button" className="product-row" disabled={outOfStock(p)} onClick={() => setSelected(p)}>
                <div>
                  <strong>{p.name}</strong>
                  <span className={p.lowStock ? 'is-low' : ''}>
                    {p.trackStock ? (outOfStock(p) ? 'Sin stock' : `Stock ${p.stock}`) : p.category || ''}
                  </span>
                </div>
                <strong>{money(p.price)}</strong>
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}

/** Cierre: forma de pago, descuento y propina. Solo se registra, no se cobra acá. */
function CloseSheet({ tab, onClose, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [discount, setDiscount] = useState('')
  const [tip, setTip] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = tab.runningSubtotal - Number(discount || 0) + Number(tip || 0)

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      await onConfirm({ paymentMethod, discount: Number(discount || 0), tip: Number(tip || 0), notes })
      onClose()
    } catch (err) {
      setError(apiError(err, 'No se pudo cerrar la cuenta'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet title="Cobrar y cerrar" onClose={onClose}>
      <div className="sheet__body">
        <div>
          <label className="field__label">Forma de pago</label>
          <div className="category-chips">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`category-chip ${paymentMethod === m.value ? 'category-chip--active' : ''}`}
                onClick={() => setPaymentMethod(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="two-col">
          <div className="field">
            <label className="field__label">Descuento</label>
            <div className="field__wrap">
              <input type="number" inputMode="decimal" min="0" className="field__input" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Propina</label>
            <div className="field__wrap">
              <input type="number" inputMode="decimal" min="0" className="field__input" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>
        <div className="field">
          <label className="field__label">Notas</label>
          <textarea className="field__textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="tab-totals">
          <div><span>Consumo</span><span>{money(tab.runningSubtotal)}</span></div>
          {Number(discount) > 0 && <div><span>Descuento</span><span>-{money(discount)}</span></div>}
          {Number(tip) > 0 && <div><span>Propina</span><span>{money(tip)}</span></div>}
          <div className="tab-totals__grand"><span>Total</span><span>{money(total)}</span></div>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
        <button type="button" className="login-btn" onClick={submit} disabled={saving}>
          {saving ? <IonSpinner name="crescent" /> : `Registrar cobro · ${money(total)}`}
        </button>
      </div>
    </Sheet>
  )
}

export default function TabPage() {
  const { id, tabId } = useParams()
  const navigate = useNavigate()
  const [presentAlert] = useIonAlert()
  const [tab, setTab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState(null) // 'add' | 'close'
  const [live, setLive] = useState(null)

  const load = () =>
    Promise.all([tabService.getById(id, tabId), tabService.getLive(id)])
      .then(([res, liveRes]) => {
        setTab(res.data)
        setLive(liveRes.data)
      })
      .catch((err) => setError(apiError(err, 'No se pudo cargar la cuenta')))
      .finally(() => setLoading(false))

  // Otro mozo puede estar cargando en la misma cuenta.
  usePolling(() => { if (!sheet) load() }, 15000, [id, tabId, sheet])

  const isOpen = tab?.status === 'Open'
  const activeItems = tab?.items.filter((i) => !i.voided) || []
  const voidedItems = tab?.items.filter((i) => i.voided) || []

  const addItem = async (productId, quantity) => {
    const res = await tabService.addItem(id, tabId, productId, quantity)
    setTab(res.data)
  }

  const closeTab = async (data) => {
    const res = await tabService.close(id, tabId, data)
    setTab(res.data)
  }

  const askVoid = (item) => {
    presentAlert({
      header: 'Anular consumo',
      message: `${item.quantity} × ${item.productName}. El stock vuelve al inventario.`,
      inputs: [{ name: 'reason', type: 'text', placeholder: 'Motivo (opcional)' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: ({ reason }) => {
            tabService.voidItem(id, tabId, item.id, reason)
              .then((res) => setTab(res.data))
              .catch((err) => setError(apiError(err, 'No se pudo anular')))
          }
        }
      ]
    })
  }

  const title = tab ? `Mesa ${tab.tableLabel}${tab.customerName ? ` · ${tab.customerName}` : ''}` : 'Cuenta'

  return (
    <IonPage>
      <IonHeader className="mobile-sticky-header" translucent={false}>
        <IonToolbar className="mobile-sticky-header__toolbar">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="mobile-sticky-header__title">{title}</h1>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding app-shell app-shell--detail">
        <div className="detail-page">
          <div className="detail-page__body">
            {loading ? (
              <div className="center-fill"><IonSpinner name="crescent" /></div>
            ) : !tab ? (
              <div className="error-banner">{error || 'Cuenta no encontrada'}</div>
            ) : (
              <>
                <div className="metric-row">
                  <div className="metric-card metric-card--primary">
                    <p className="metric-label">{isOpen ? 'Consumido' : 'Cobrado'}</p>
                    <div className="metric-value">{money(isOpen ? tab.runningSubtotal : tab.total)}</div>
                  </div>
                  <div className={`metric-card ${isOpen ? 'metric-card--warning' : 'metric-card--success'}`}>
                    <p className="metric-label">Estado</p>
                    <div className="metric-value">{isOpen ? 'Abierta' : 'Cerrada'}</div>
                  </div>
                </div>

                {error ? <div className="error-banner">{error}</div> : null}
                {isOpen && live && !live.isLive && (
                  <div className="notice notice--warning">
                    <div>
                      <strong>{live.reason}</strong>
                      <p>Fuera del horario del evento ({eventWindowLabel(live)}) no se cargan consumos: solo se puede anular y cobrar.</p>
                    </div>
                  </div>
                )}

                <SectionHeader title="Consumos" subtitle={isOpen ? 'Tocá un consumo para anularlo.' : undefined} />
                {activeItems.length === 0 ? (
                  <div className="empty-state">
                    <strong>Sin consumos todavía</strong>
                    <p>{isOpen ? 'Agregá lo que pidió la mesa.' : 'La cuenta se cerró sin consumos.'}</p>
                  </div>
                ) : (
                  <div className="tab-items">
                    {activeItems.map((item) => (
                      <button key={item.id} type="button" className="tab-item" disabled={!isOpen} onClick={() => askVoid(item)}>
                        <span className="tab-item__qty">{item.quantity}×</span>
                        <div className="tab-item__body">
                          <strong>{item.productName}</strong>
                          <span>{item.createdBy || '—'} · {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <strong>{money(item.amount)}</strong>
                      </button>
                    ))}
                  </div>
                )}

                {voidedItems.length > 0 && (
                  <div className="tab-items tab-items--voided">
                    {voidedItems.map((item) => (
                      <div key={item.id} className="tab-item">
                        <span className="tab-item__qty">{item.quantity}×</span>
                        <div className="tab-item__body">
                          <strong>{item.productName}</strong>
                          <span>Anulado{item.voidReason ? `: ${item.voidReason}` : ''}</span>
                        </div>
                        <strong>{money(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {!isOpen && (
                  <div className="tab-totals">
                    <div><span>Consumo</span><span>{money(tab.subtotal)}</span></div>
                    {tab.discount > 0 && <div><span>Descuento</span><span>-{money(tab.discount)}</span></div>}
                    {tab.tip > 0 && <div><span>Propina</span><span>{money(tab.tip)}</span></div>}
                    <div className="tab-totals__grand"><span>Total</span><span>{money(tab.total)}</span></div>
                    <div><span>Forma de pago</span><span>{paymentLabel(tab.paymentMethod)}</span></div>
                    <div><span>Cerró</span><span>{tab.closedBy || '—'}</span></div>
                  </div>
                )}
              </>
            )}
          </div>

          {isOpen && (
            <div className={`tab-actions ${live?.isLive ? '' : 'tab-actions--single'}`}>
              <button type="button" className={`login-btn ${live?.isLive ? 'login-btn--secondary' : ''}`} onClick={() => setSheet('close')}>
                Cobrar
              </button>
              {live?.isLive && (
                <button type="button" className="login-btn" onClick={() => setSheet('add')}>
                  + Agregar
                </button>
              )}
            </div>
          )}
        </div>

        {sheet === 'add' && <AddItemSheet onClose={() => setSheet(null)} onAdd={addItem} />}
        {sheet === 'close' && tab && <CloseSheet tab={tab} onClose={() => setSheet(null)} onConfirm={closeTab} />}
      </IonContent>
    </IonPage>
  )
}
