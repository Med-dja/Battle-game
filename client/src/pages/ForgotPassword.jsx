import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaKey } from 'react-icons/fa';
import styled from 'styled-components';
import { requestPasswordReset, reset } from '../features/auth/authSlice';

const FormContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  h2 {
    text-align: center;
    margin-bottom: 1rem;
    color: var(--primary-color);
  }
  
  p {
    margin-bottom: 2rem;
    text-align: center;
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const dispatch = useDispatch();
  const { loading, success } = useSelector((state) => state.auth);
  
  useEffect(() => {
    document.title = 'Bataille Navale - Récupération de mot de passe';
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre adresse e-mail');
      return;
    }
    
    dispatch(requestPasswordReset(email));
    setSubmitted(true);
  };
  
  return (
    <FormContainer>
      <h2>
        <FaKey /> Récupération de mot de passe
      </h2>
      
      {(success || submitted) ? (
        <>
          <p>
            Un e-mail de réinitialisation de mot de passe a été envoyé à l'adresse {email} si un compte existe avec cette adresse.
          </p>
          <p>
            Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.
          </p>
          <div className="links">
            <Link to="/login">Retour à la page de connexion</Link>
          </div>
        </>
      ) : (
        <>
          <p>
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
          
          <div className="links">
            <p>
              <Link to="/login">Retour à la page de connexion</Link>
            </p>
          </div>
        </>
      )}
    </FormContainer>
  );
};

export default ForgotPassword;
