import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner
} from '@ionic/react'
import { eyeOutline, eyeOffOutline, lockClosedOutline, mailOutline, personOutline, ticketOutline } from 'ionicons/icons'
import { useAuth } from '../context/AuthContext'
import { consumeIdleLogoutNotice } from '../hooks/useIdleLogout'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [idleNotice] = useState(consumeIdleLogoutNotice)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // El correo de la empresa se pide solo si ese usuario existe en más de una cuenta.
  const [tenantEmail, setTenantEmail] = useState('')
  const [needsTenant, setNeedsTenant] = useState(false)

  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [navigate, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password, needsTenant ? tenantEmail : undefined)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err.response?.data?.code === 'AMBIGUOUS_USER') setNeedsTenant(true)
      setError(err.response?.data?.error || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="login-wrapper">
        <div className="login-container">
          <div className="login-brand">
            <div className="login-brand__icon">
              <IonIcon icon={ticketOutline} />
            </div>
            <h1 className="login-brand__name">EventManager</h1>
            <p className="login-brand__tagline">Gestioná eventos y reservas</p>
          </div>

          <form onSubmit={handleSubmit} className="login-card">
            <div className="login-field">
              <label className="login-field__label">Usuario</label>
              <div className="login-field__input-wrap">
                <IonIcon icon={personOutline} className="login-field__icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresá tu usuario"
                  className="login-field__input"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-field__label">Contraseña</label>
              <div className="login-field__input-wrap">
                <IonIcon icon={lockClosedOutline} className="login-field__icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-field__input"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-field__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            {needsTenant && (
              <div className="login-field">
                <label className="login-field__label" htmlFor="tenantEmail">Correo de tu empresa</label>
                <div className="login-field__input-wrap">
                  <IonIcon icon={mailOutline} className="login-field__icon" />
                  <input
                    id="tenantEmail"
                    type="email"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    placeholder="empresa@correo.com"
                    className="login-field__input"
                    autoFocus
                    required
                  />
                </div>
              </div>
            )}

            {idleNotice && !error && (
              <div className="notice notice--info" role="status">{idleNotice}</div>
            )}

            {error && (
              <div className={needsTenant ? 'notice notice--info' : 'login-error'} role="alert">{error}</div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : 'Entrar'}
            </button>
          </form>

          <Link to="/forgot-password" className="login-forgot">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </IonContent>
    </IonPage>
  )
}
