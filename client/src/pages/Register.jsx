import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUserPlus } from 'react-icons/fa';
import styled from 'styled-components';
import { register, reset } from '../features/auth/authSlice';

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

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  
  const { username, email, password, password2 } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  useEffect(() => {
    document.title = 'Bataille Navale - Inscription';
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
    
    if (!username || !email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== password2) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    dispatch(register({ username, email, password }));
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/games');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <FormContainer>
      <h2>
        <FaUserPlus /> Inscription
      </h2>
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            type="text"
            className="form-control"
            id="username"
            name="username"
            value={username}
            placeholder="Entrez votre nom d'utilisateur"
            onChange={onChange}
            required
          />
        </div>
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
        <div className="form-group">
          <label htmlFor="password2">Confirmer le mot de passe</label>
          <input
            type="password"
            className="form-control"
            id="password2"
            name="password2"
            value={password2}
            placeholder="Confirmez votre mot de passe"
            onChange={onChange}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Chargement...' : 'S\'inscrire'}
        </button>
      </form>
      
      <div className="links">
        <p>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </FormContainer>
  );
};

export default Register;
