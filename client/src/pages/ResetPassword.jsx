import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { FaKey } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { resetPassword } from '../features/auth/authSlice';
import FormContainer from '../components/FormContainer';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    password2: '',
  });

  const { password, password2 } = formData;

  const dispatch = useDispatch();
  const { token } = useParams();

  const { resetComplete, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (resetComplete) {
      toast.success('Mot de passe réinitialisé avec succès');
    }
  }, [resetComplete]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    dispatch(resetPassword({ token, password }));
  };

  if (resetComplete) {
    return (
      <FormContainer>
        <h2>
          <FaKey /> Réinitialisation réussie
        </h2>
        <div className="success">
          <p>Votre mot de passe a été réinitialisé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        </div>
        <Link to="/login" className="btn btn-primary btn-block">
          Se connecter
        </Link>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <h2>
        <FaKey /> Réinitialisation du mot de passe
      </h2>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="password">Nouveau mot de passe</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Entrez votre nouveau mot de passe"
            required
            minLength="6"
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
            onChange={onChange}
            placeholder="Confirmez votre nouveau mot de passe"
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>

      <div className="links">
        <p>
          <Link to="/login">Retour à la page de connexion</Link>
        </p>
      </div>
    </FormContainer>
  );
};

export default ResetPassword;