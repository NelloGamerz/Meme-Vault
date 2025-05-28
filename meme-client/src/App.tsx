import { Routes, Route, Navigate,useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { MainPage } from './pages/MainPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ProfilePage } from './components/mainPage/ProfilePage';
import MemeDetailPage  from './pages/MemeDetailPage'; 
import { ForgotPasswordForm } from './pages/ForgotPasswordForm';
import PasswordResetPage from './pages/password-reset';

const RedirectToProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  return <Navigate to={`/profile/${userId}`} replace />;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/reset-password/:id" element={<PasswordResetPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        } />
        <Route path="/meme/:id" element={
          <ProtectedRoute>
            <MemeDetailPage />
          </ProtectedRoute>} />  // Added route for meme detail page
          <Route path="/api/profile/:userId" element={<RedirectToProfile />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App