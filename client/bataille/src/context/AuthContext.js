'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { initializeSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const router = useRouter();

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
    
    // Check for auth token expiration
    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          if (tokenData.exp * 1000 < Date.now()) {
            toast.error('Votre session a expiré. Veuillez vous reconnecter.');
            logout();
          }
        } catch (e) {
          console.error('Error checking token expiration:', e);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkTokenInterval);
  }, []);

  const fetchUser = async (token) => {
    try {
      setAuthError(null);
      const res = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data);
      initializeSocket(token);
    } catch (err) {
      console.error('Error fetching user:', err);
      setAuthError('Impossible de récupérer les données utilisateur');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/users/login`, 
        { email, password },
        { headers: { 'Content-Type': 'application/json' }}
      );
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      initializeSocket(res.data.token);
      toast.success('Connexion réussie');
      router.push('/dashboard');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Erreur de connexion';
      setAuthError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/users/register`, 
        { username, email, password },
        { headers: { 'Content-Type': 'application/json' }}
      );
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      initializeSocket(res.data.token);
      toast.success('Inscription réussie');
      router.push('/dashboard');
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setAuthError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email) => {
    setLoading(true);
    setAuthError(null);
    try {
      await axios.post(`${API_BASE_URL}/users/request-reset`, 
        { email },
        { headers: { 'Content-Type': 'application/json' }}
      );
      toast.success('Instructions de réinitialisation envoyées par email');
      return true;
    } catch (err) {
      console.error('Password reset request error:', err);
      const message = err.response?.data?.message || 'Erreur lors de la demande de réinitialisation';
      setAuthError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      await axios.post(`${API_BASE_URL}/users/reset-password`, 
        { token, password },
        { headers: { 'Content-Type': 'application/json' }}
      );
      toast.success('Mot de passe réinitialisé avec succès');
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      const message = err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe';
      setAuthError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/users/profile`, userData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data);
      toast.success('Profil mis à jour avec succès');
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour du profil';
      setAuthError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
    disconnectSocket();
    router.push('/login');
  };

  const hasAuthError = () => authError !== null;
  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        updateProfile,
        authError,
        hasAuthError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
