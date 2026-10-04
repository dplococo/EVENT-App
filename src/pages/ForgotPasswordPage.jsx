import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/react'
import { keyOutline, lockClosedOutline, mailOutline, personOutline } from 'ionicons/icons'
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

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
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

  const Field = ({ id, label, icon, ...input }) => (
    <div className="login-field">
      <label className="login-field__label" htmlFor={id}>{label}</label>
      <div className="login-field__input-wrap">
        <IonIcon icon={icon} className="login-field__icon" />
        <input id={id} className="login-field__input" required {...input} />
      </div>
    </div>
  )

  return (
    <IonPage>
      <IonContent fullscreen className="login-wrapper">
        <div className="login-container">
          <div className="login-brand">
            <div className="login-brand__icon">
              <IonIcon icon={keyOutline} />
            </div>
            <h1 className="login-brand__name">{step === 1 ? 'Recuperá tu acceso' : 'Nueva contraseña'}</h1>
            <p className="login-brand__tagline">
              {step === 1 ? 'Verificá tu identidad con tu usuario y email.' : 'Elegí una contraseña de al menos 8 caracteres.'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleVerify} className="login-card">
              {Field({ id: 'username', label: 'Usuario', icon: personOutline, value: username, onChange: (e) => setUsername(e.target.value), placeholder: 'Tu usuario', autoComplete: 'username' })}
              {Field({ id: 'email', label: 'Email registrado', icon: mailOutline, type: 'email', value: email, onChange: (e) => setEmail(e.target.value), placeholder: 'tu@correo.com' })}
              {error && <div className="login-error" role="alert">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <IonSpinner name="crescent" /> : 'Verificar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="login-card">
              {Field({ id: 'newPassword', label: 'Nueva contraseña', icon: lockClosedOutline, type: 'password', value: newPassword, onChange: (e) => setNewPassword(e.target.value), autoComplete: 'new-password' })}
              {Field({ id: 'confirmPassword', label: 'Confirmar contraseña', icon: lockClosedOutline, type: 'password', value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), autoComplete: 'new-password' })}
              {error && <div className="login-error" role="alert">{error}</div>}
              {message && <div className="success-banner" role="status">{message}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <IonSpinner name="crescent" /> : 'Guardar contraseña'}
              </button>
            </form>
          )}

          <Link to="/login" className="login-forgot">Volver al inicio de sesión</Link>
        </div>
      </IonContent>
    </IonPage>
  )
}
