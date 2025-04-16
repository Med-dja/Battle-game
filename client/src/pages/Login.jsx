import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaSignInAlt } from 'react-icons/fa';
import styled from 'styled-components';
import { login, reset } from '../features/auth/authSlice';

const FormContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: var(--primary-color);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .btn-block {
    width: 100%;
    padding: 0.75rem;
    font-size: 1.1rem;
  }
  
  .links {
    margin-top: 1.5rem;
    text-align: center;
  }
`;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const { email, password } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  
  useEffect(() => {
    document.title = 'Bataille Navale - Connexion';
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    dispatch(login({ email, password }));
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/games');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <FormContainer>
      <h2>
        <FaSignInAlt /> Connexion
      </h2>
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={email}
            placeholder="Entrez votre email"
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={password}
            placeholder="Entrez votre mot de passe"
            onChange={onChange}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Chargement...' : 'Se connecter'}
        </button>
      </form>
      
      <div className="links">
        <p>
          Pas de compte ? <Link to="/register">S'inscrire</Link>
        </p>
        <p>
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </p>
      </div>
    </FormContainer>
  );
};

export default Login;
