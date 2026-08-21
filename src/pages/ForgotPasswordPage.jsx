import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText
} from '@ionic/react'
import { calendarOutline, keyOutline, lockClosedOutline, mailOutline, personOutline } from 'ionicons/icons'
import { authService } from '../services/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authService.forgotPassword(username, email)
      setToken(res.data.resetToken)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron verificar las credenciales')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, newPassword)
      setMessage('Contraseña actualizada exitosamente')
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="app-shell login-wrapper">
        <div className="login-screen" style={{ justifyItems: 'center' }}>
          <div className="login-hero">
            <div className="login-mark">
              <IonIcon icon={keyOutline} />
            </div>
            <h1>EventManager</h1>
            <p className="hero-copy hero-copy--dark">
              {step === 1
                ? 'Verificá tu identidad para recuperar tu contraseña.'
                : 'Credenciales verificadas. Definí tu nueva contraseña.'}
            </p>
          </div>

          {error && (
            <IonText color="danger" className="ion-padding-horizontal">
              <p>{error}</p>
            </IonText>
          )}
          {message && (
            <IonText color="success" className="ion-padding-horizontal">
              <p>{message}</p>
            </IonText>
          )}

          {step === 1 && (
            <form onSubmit={handleVerify} className="soft-card login-form">
              <IonItem className="field-card">
                <IonLabel position="stacked">Usuario</IonLabel>
                <IonIcon icon={personOutline} slot="start" />
                <IonInput value={username} onIonInput={(e) => setUsername(e.detail.value || '')} placeholder="Tu usuario" />
              </IonItem>
              <IonItem className="field-card">
                <IonLabel position="stacked">Email registrado</IonLabel>
                <IonIcon icon={mailOutline} slot="start" />
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value || '')}
                  placeholder="tu@correo.com"
                />
              </IonItem>
              <IonButton expand="block" type="submit" disabled={loading} className="hero-cta">
                {loading ? 'Verificando...' : 'Verificar'}
              </IonButton>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="soft-card login-form">
              <IonItem className="field-card">
                <IonLabel position="stacked">Nueva contraseña</IonLabel>
                <IonIcon icon={lockClosedOutline} slot="start" />
                <IonInput
                  type="password"
                  value={newPassword}
                  onIonInput={(e) => setNewPassword(e.detail.value || '')}
                  placeholder="Mínimo 6 caracteres"
                />
              </IonItem>
              <IonItem className="field-card">
                <IonLabel position="stacked">Confirmar contraseña</IonLabel>
                <IonIcon icon={lockClosedOutline} slot="start" />
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                  placeholder="Repetí la nueva contraseña"
                />
              </IonItem>
              <IonButton expand="block" type="submit" disabled={loading} className="hero-cta">
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </IonButton>
            </form>
          )}

          <div className="ion-text-center ion-padding">
            <Link to="/login" className="hero-copy" style={{ fontSize: '14px', textDecoration: 'none' }}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
