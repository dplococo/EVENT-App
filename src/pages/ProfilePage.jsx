import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/react'
import { arrowBackOutline, businessOutline, logOutOutline, mailOutline, lockClosedOutline, personCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

const ROLE_LABELS = { Admin: 'Administrador', Operator: 'Operador', EventStaff: 'Staff de evento' }

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, license, logout } = useAuth()
  const [profile, setProfile] = useState(user)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    let mounted = true
    authService.getProfile()
      .then((response) => {
        if (mounted) setProfile(response.data)
      })
      .catch(() => {
        if (mounted) setProfile(user)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [user])

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completá la contraseña actual y la nueva.')
      return
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide.')
      return
    }

    setSaving(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setSuccess('Contraseña actualizada correctamente.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <IonPage>
      <IonContent className="ion-padding app-shell">
        <div className="page-top page-top--split">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Volver">
            <IonIcon icon={arrowBackOutline} />
          </button>
        </div>

        {loading ? (
          <div className="center-fill">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <div className="event-hero event-hero--compact">
              <div className="event-hero__content">
                <p className="eyebrow">Perfil</p>
                <h1>{profile?.fullName || profile?.username || 'Usuario'}</h1>
                <div className="event-meta">
                  <span><IonIcon icon={personCircleOutline} /> {ROLE_LABELS[profile?.role] || profile?.role || 'Sin rol'}</span>
                  {profile?.email ? <span><IonIcon icon={mailOutline} /> {profile.email}</span> : null}
                  {(license?.tenantName || user?.tenantName) ? <span><IonIcon icon={businessOutline} /> {license?.tenantName || user?.tenantName}</span> : null}
                </div>
              </div>
            </div>

            <div className="profile-grid">
              <section className="soft-card form-card profile-card">
                <div className="profile-card__header">
                  <IonIcon icon={shieldCheckmarkOutline} />
                  <div>
                    <strong>Datos de cuenta</strong>
                    <p>Para cambiarlos, pedíselo a un administrador.</p>
                  </div>
                </div>

                <div className="profile-details">
                  <div>
                    <span>Usuario</span>
                    <strong>{profile?.username || '-'}</strong>
                  </div>
                  <div>
                    <span>Nombre completo</span>
                    <strong>{profile?.fullName || '-'}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{profile?.email || '-'}</strong>
                  </div>
                </div>
              </section>

              <section className="soft-card form-card profile-card">
                <div className="profile-card__header">
                  <IonIcon icon={lockClosedOutline} />
                  <div>
                    <strong>Cambiar contraseña</strong>
                    <p>Ingresá tu contraseña actual y elegí una nueva.</p>
                  </div>
                </div>

                <form className="profile-form" onSubmit={handleChangePassword}>
                  {[
                    ['current', 'Contraseña actual', currentPassword, setCurrentPassword, 'current-password'],
                    ['new', 'Nueva contraseña', newPassword, setNewPassword, 'new-password'],
                    ['confirm', 'Confirmar nueva contraseña', confirmPassword, setConfirmPassword, 'new-password'],
                  ].map(([id, label, value, setValue, autoComplete]) => (
                    <div className="field" key={id}>
                      <label className="field__label" htmlFor={`pwd-${id}`}>{label}</label>
                      <div className="field__wrap">
                        <IonIcon icon={lockClosedOutline} className="field__icon" />
                        <input
                          id={`pwd-${id}`}
                          type="password"
                          className="field__input"
                          value={value}
                          autoComplete={autoComplete}
                          onChange={(e) => setValue(e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="field__hint">Mínimo 8 caracteres.</p>

                  {error ? <div className="error-banner" role="alert">{error}</div> : null}
                  {success ? <div className="success-banner" role="status">{success}</div> : null}

                  <button type="submit" className="login-btn" disabled={saving}>
                    {saving ? <IonSpinner name="crescent" /> : 'Actualizar contraseña'}
                  </button>
                </form>
              </section>
            </div>

            <div className="profile-actions">
              <button type="button" className="login-btn login-btn--secondary login-btn--block" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
                <span className="btn-with-icon"><IonIcon icon={logOutOutline} />Cerrar sesión</span>
              </button>
            </div>

            <BottomNav active="Perfil" onNavigate={navigate} />
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
