import { IonContent, IonIcon, IonPage } from '@ionic/react'
import { lockClosedOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Licencia vencida (pasada la gracia) o cuenta suspendida. En el celular no se
 * renueva: lo hace el administrador desde la consola web. Los datos quedan
 * intactos y vuelven apenas se habilita.
 */
export default function BlockedPage() {
  const { license, logout } = useAuth()
  const navigate = useNavigate()
  const suspended = license?.status === 'SUSPENDIDA' || license?.status === 'BAJA'

  return (
    <IonPage>
      <IonContent fullscreen className="login-wrapper">
        <div className="login-container">
          <div className="blocked-icon"><IonIcon icon={lockClosedOutline} /></div>
          <div className="login-brand">
            <h1 className="login-brand__name">Acceso pausado</h1>
            <p className="login-brand__tagline blocked-text">
              {suspended
                ? 'La cuenta de tu empresa está suspendida.'
                : 'La licencia de tu empresa venció y terminaron los días de gracia.'}
              {' '}Tus datos están intactos: vuelven apenas el administrador la renueve desde la consola web.
            </p>
          </div>
          <button type="button" className="login-btn login-btn--secondary" onClick={() => window.location.reload()}>
            Volver a intentar
          </button>
          <button type="button" className="login-forgot" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
            Cerrar sesión
          </button>
        </div>
      </IonContent>
    </IonPage>
  )
}
