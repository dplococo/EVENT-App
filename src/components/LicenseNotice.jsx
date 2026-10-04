import { IonIcon } from '@ionic/react'
import { alertCircleOutline, sparklesOutline } from 'ionicons/icons'
import { useAuth } from '../context/AuthContext'

const days = (n) => `${n} ${n === 1 ? 'día' : 'días'}`

// Aviso de vencimiento: desde 15 días antes, igual que los correos.
export default function LicenseNotice() {
  const { license } = useAuth()
  if (!license || license.blocked) return null

  let tone, title, text
  if (license.status === 'GRACIA') {
    tone = 'danger'
    title = 'La licencia de tu empresa venció'
    text = `Quedan ${days(license.graceDaysLeft)} de gracia. Avisale a tu administrador.`
  } else if (license.daysLeft != null && license.daysLeft <= 15) {
    tone = license.status === 'PRUEBA' ? 'info' : 'warning'
    const when = license.daysLeft === 0 ? 'hoy' : `en ${days(license.daysLeft)}`
    title = license.status === 'PRUEBA' ? `La prueba gratuita termina ${when}` : `La licencia vence ${when}`
    text = 'El administrador la renueva desde la consola web.'
  } else {
    return null
  }

  return (
    <div className={`notice notice--${tone}`} role="status">
      <IonIcon icon={tone === 'info' ? sparklesOutline : alertCircleOutline} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  )
}
