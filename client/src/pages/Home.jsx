import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const HomeContainer = styled.div`
  text-align: center;
  padding: 2rem 0;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
  }
  
  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .btn-container {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .hero-image {
    max-width: 100%;
    height: auto;
    margin: 2rem 0;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .feature {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .feature h3 {
    color: var(--secondary-color);
  }
`;

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  useEffect(() => {
    document.title = 'Bataille Navale - Accueil';
  }, []);
  
  return (
    <HomeContainer>
      <h1>Bienvenue dans Bataille Navale</h1>
      <p>
        Jouez au classique jeu de stratégie Bataille Navale en ligne contre d'autres joueurs.
        Placez vos navires, tirez des missiles et coulez la flotte ennemie !
      </p>
      
      <div className="btn-container">
        {isAuthenticated ? (
          <Link to="/games" className="btn btn-primary">
            Jouer Maintenant
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary">
              S'inscrire
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Se connecter
            </Link>
          </>
        )}
      </div>
      
      <img 
        src="/assets/battleship-hero.jpg" 
        alt="Bataille Navale" 
        className="hero-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
      
      <div className="features">
        <div className="feature">
          <h3>Matchmaking</h3>
          <p>Trouvez des adversaires de votre niveau grâce à notre système de matchmaking automatique.</p>
        </div>
        <div className="feature">
          <h3>Classement</h3>
          <p>Grimpez dans les classements et montrez votre maîtrise du jeu à la communauté.</p>
        </div>
        <div className="feature">
          <h3>Chat en jeu</h3>
          <p>Communiquez avec vos adversaires pendant les parties grâce à notre système de messagerie.</p>
        </div>
      </div>
    </HomeContainer>
  );
};

export default Home;
