import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { MainPage } from './pages/MainPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ProfilePage } from './components/mainPage/ProfilePage';
import MemeDetailPage from './pages/MemeDetailPage';
import { ForgotPasswordForm } from './pages/ForgotPasswordForm';
import PasswordResetPage from './pages/password-reset';
import { Layout } from './components/layout/Layout';
import { ExplorePage } from './pages/ExplorePage';
import { CreatePage } from './pages/CreatePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WebSocketManager } from './components/websocket/WebSocketManager';
import { UserProfileInitializer } from './components/auth/UserProfileInitializer';
import './styles/notifications.css';

const RedirectToProfile = () => {
  const { username } = useParams<{ username: string }>();
  return <Navigate to={`/profile/${username}`} replace />;
};

// Wrapper component for protected routes with layout
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <>
      {/* WebSocketManager to establish and maintain WebSocket connection at app level */}
      <WebSocketManager />
      
      {/* UserProfileInitializer to fetch user profile once on app load */}
      <UserProfileInitializer />
      
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/reset-password/:id" element={<PasswordResetPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected routes with layout */}
        <Route path="/" element={
          <ProtectedLayout>
            <MainPage />
          </ProtectedLayout>
        } />
        <Route path="/meme/:id" element={
          <ProtectedLayout>
            <MemeDetailPage />
          </ProtectedLayout>
        } />
        <Route path="/explore" element={
          <ProtectedLayout>
            <ExplorePage />
          </ProtectedLayout>
        } />
        <Route path="/create" element={
          <ProtectedLayout>
            <CreatePage />
          </ProtectedLayout>
        } />
        <Route path="/notifications/:username" element={
          <ProtectedLayout>
            <NotificationsPage />
          </ProtectedLayout>
        } />
        <Route path="/settings" element={
          <ProtectedLayout>
            <SettingsPage />
          </ProtectedLayout>
        } />
        
        {/* Profile routes */}
        <Route path="/api/profile/:username" element={<RedirectToProfile />} />
        <Route path="/profile/:username" element={
          <ProtectedLayout>
            <ProfilePage />
          </ProtectedLayout>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App