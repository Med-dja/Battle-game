import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaSignOutAlt, FaUser, FaGamepad, FaTrophy, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import styled from 'styled-components';
import { logout } from '../../features/auth/authSlice';

const StyledNav = styled.nav`
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  
  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
  }
  
  ul {
    display: flex;
    list-style: none;
  }
  
  li {
    margin-left: 1rem;
  }
  
  a {
    color: white;
    display: flex;
    align-items: center;
  }
  
  svg {
    margin-right: 0.5rem;
  }
  
  .btn-logout {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
  }
`;

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const onLogout = () => {
    dispatch(logout());
    navigate('/');
  };
  
  const authLinks = (
    <ul>
      <li>
        <Link to="/games">
          <FaGamepad /> Parties
        </Link>
      </li>
      <li>
        <Link to="/leaderboard">
          <FaTrophy /> Classement
        </Link>
      </li>
      <li>
        <Link to="/profile">
          <FaUser /> {user ? user.username : 'Profil'}
        </Link>
      </li>
      <li>
        <button className="btn-logout" onClick={onLogout}>
          <FaSignOutAlt /> Déconnexion
        </button>
      </li>
    </ul>
  );
  
  const guestLinks = (
    <ul>
      <li>
        <Link to="/leaderboard">
          <FaTrophy /> Classement
        </Link>
      </li>
      <li>
        <Link to="/login">
          <FaSignInAlt /> Connexion
        </Link>
      </li>
      <li>
        <Link to="/register">
          <FaUserPlus /> Inscription
        </Link>
      </li>
    </ul>
  );
  
  return (
    <StyledNav>
      <Link to="/" className="logo">
        Bataille Navale
      </Link>
      {isAuthenticated ? authLinks : guestLinks}
    </StyledNav>
  );
};

export default Navbar;
