import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const NotFoundContainer = styled.div`
  text-align: center;
  padding: 3rem 0;
  
  h1 {
    font-size: 4rem;
    color: var(--accent-color);
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
  
  .icon {
    font-size: 5rem;
    margin-bottom: 2rem;
    color: var(--accent-color);
  }
`;

const NotFound = () => {
  return (
    <NotFoundContainer>
      <FaExclamationTriangle className="icon" />
      <h1>404</h1>
      <p>Oups ! La page que vous recherchez n'existe pas.</p>
      <Link to="/" className="btn btn-primary">
        <FaHome /> Retour à l'accueil
      </Link>
    </NotFoundContainer>
  );
};

export default NotFound;
