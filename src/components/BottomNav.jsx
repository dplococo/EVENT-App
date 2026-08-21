import { IonIcon } from '@ionic/react'
import { homeOutline, calendarOutline, personOutline } from 'ionicons/icons'

const items = [
  { label: 'Inicio', icon: homeOutline, path: '/home' },
  { label: 'Eventos', icon: calendarOutline, path: '/events' },
  { label: 'Perfil', icon: personOutline, path: '/profile' }
]

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`bottom-nav__item ${active === item.label ? 'is-active' : ''}`}
          onClick={() => onNavigate(item.path)}
        >
          <IonIcon icon={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
