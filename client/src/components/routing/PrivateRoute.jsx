import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
