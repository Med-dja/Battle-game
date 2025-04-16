import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Game from './pages/Game';
import GamesList from './pages/GamesList';
import Leaderboard from './pages/Leaderboard';
import NotFound from './pages/NotFound';

// Actions
import { checkUserSession } from './features/auth/authSlice';
import { setupSocketConnection, disconnectSocket } from './features/socket/socketService';

function App() {
  const { isAuthenticated, token, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is logged in (from local storage)
    dispatch(checkUserSession());
  }, [dispatch]);

  useEffect(() => {
    // Setup socket connection when authenticated
    if (isAuthenticated && token) {
      setupSocketConnection(token);
    }

    // Cleanup socket on unmount
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/games" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/games" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/games" element={<PrivateRoute><GamesList /></PrivateRoute>} />
          <Route path="/games/:id" element={<PrivateRoute><Game /></PrivateRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
