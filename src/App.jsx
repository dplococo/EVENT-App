import { Navigate, Route, Routes } from 'react-router-dom'
import { IonSpinner, IonContent, IonPage } from '@ionic/react'
import { useAuth, AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import ReservationPage from './pages/ReservationPage'
import ProfilePage from './pages/ProfilePage'
import BlockedPage from './pages/BlockedPage'

const ProtectedRoute = ({ children }) => {
  const { user, license, loading } = useAuth()
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="center-fill">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  // Licencia bloqueada: una sola pantalla, sin importar la ruta.
  if (license?.blocked) return <BlockedPage />
  return children
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
      <Route path="/events/:id/reserve/:tableId" element={<ProtectedRoute><ReservationPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
