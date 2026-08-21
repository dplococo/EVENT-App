import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonText, IonCard, IonCardContent, IonSpinner } from '@ionic/react'
import { arrowBackOutline, mailOutline, lockClosedOutline, personCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
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

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
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
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            <div className="event-hero event-hero--compact">
              <div className="event-hero__content">
                <p className="eyebrow eyebrow--dark">Perfil</p>
                <h1>{profile?.fullName || profile?.username || 'Usuario'}</h1>
                <div className="event-meta event-meta--dark">
                  <span><IonIcon icon={personCircleOutline} /> {profile?.role || 'Sin rol'}</span>
                  {profile?.email ? <span><IonIcon icon={mailOutline} /> {profile.email}</span> : null}
                </div>
              </div>
            </div>

            <div className="profile-grid">
              <IonCard className="soft-card form-card profile-card">
                <IonCardContent>
                  <div className="profile-card__header">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <div>
                      <strong>Datos de cuenta</strong>
                      <p>Información básica del usuario autenticado.</p>
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
                    <div>
                      <span>Rol</span>
                      <strong>{profile?.role || '-'}</strong>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard className="soft-card form-card profile-card">
                <IonCardContent>
                  <div className="profile-card__header">
                    <IonIcon icon={lockClosedOutline} />
                    <div>
                      <strong>Cambiar contraseña</strong>
                      <p>Ingresá tu contraseña actual y elegí una nueva.</p>
                    </div>
                  </div>

                  <form className="profile-form" onSubmit={handleChangePassword}>
                    <IonItem className="field-card">
                      <IonLabel position="stacked">Contraseña actual</IonLabel>
                      <IonIcon icon={lockClosedOutline} slot="start" />
                      <IonInput
                        type="password"
                        value={currentPassword}
                        onIonInput={(e) => setCurrentPassword(e.detail.value || '')}
                        placeholder="Contraseña actual"
                      />
                    </IonItem>

                    <IonItem className="field-card">
                      <IonLabel position="stacked">Nueva contraseña</IonLabel>
                      <IonIcon icon={lockClosedOutline} slot="start" />
                      <IonInput
                        type="password"
                        value={newPassword}
                        onIonInput={(e) => setNewPassword(e.detail.value || '')}
                        placeholder="Nueva contraseña"
                      />
                    </IonItem>

                    <IonItem className="field-card">
                      <IonLabel position="stacked">Confirmar nueva contraseña</IonLabel>
                      <IonIcon icon={lockClosedOutline} slot="start" />
                      <IonInput
                        type="password"
                        value={confirmPassword}
                        onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                        placeholder="Repetí la contraseña"
                      />
                    </IonItem>

                    {error ? <IonText color="danger"><p>{error}</p></IonText> : null}
                    {success ? <IonText color="success"><p>{success}</p></IonText> : null}

                    <IonButton expand="block" type="submit" disabled={saving} className="hero-cta">
                      {saving ? 'Actualizando...' : 'Actualizar contraseña'}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            </div>

            <div className="profile-actions">
              <IonButton expand="block" fill="outline" color="medium" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
                Cerrar sesión
              </IonButton>
            </div>

            <BottomNav active="Perfil" onNavigate={navigate} />
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
