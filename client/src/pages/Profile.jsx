import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaUser, FaTrophy, FaGamepad, FaEdit } from 'react-icons/fa';
import { getPlayerHistory } from '../features/leaderboard/leaderboardSlice';
import authService from '../features/auth/authService';

const ProfileContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 992px) {
    grid-template-columns: 300px 1fr;
  }
`;

const ProfileSidebar = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  text-align: center;
  
  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 1.5rem;
    object-fit: cover;
  }
  
  h3 {
    margin-bottom: 0.5rem;
  }
  
  .email {
    color: #777;
    margin-bottom: 1.5rem;
  }
  
  .stats {
    margin-top: 1.5rem;
    
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
  }
`;

const ProfileContent = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  
  .tab-buttons {
    display: flex;
    border-bottom: 1px solid #eee;
    margin-bottom: 1.5rem;
  }
  
  .tab-button {
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    
    &.active {
      border-bottom-color: var(--secondary-color);
      font-weight: bold;
    }
  }
  
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 1rem;
    
    .result {
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-weight: bold;
      
      &.win {
        background-color: #d8f3dc;
        color: #2d6a4f;
      }
      
      &.loss {
        background-color: #ffccd5;
        color: #9d0208;
      }
    }
  }
`;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { playerHistory, loading } = useSelector((state) => state.leaderboard);
  const [activeTab, setActiveTab] = useState('history');
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    document.title = 'Bataille Navale - Profil';
    
    // Fetch player history
    dispatch(getPlayerHistory());
    
    // Fetch detailed profile
    const fetchProfile = async () => {
      try {
        const token = user?.token;
        if (token) {
          const profileData = await authService.getProfile(token);
          setProfile(profileData);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement du profil');
      }
    };
    
    fetchProfile();
  }, [dispatch, user]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  if (!user || loading) {
    return <div>Chargement...</div>;
  }
  
  const renderHistory = () => {
    if (!playerHistory || playerHistory.length === 0) {
      return <p>Aucun historique de partie disponible.</p>;
    }
    
    return playerHistory.map((game) => (
      <div key={game.gameId} className="history-item">
        <div>
          <div><strong>Adversaire:</strong> {game.opponent}</div>
          <div><strong>Date:</strong> {formatDate(game.date)}</div>
        </div>
        <div className={`result ${game.result}`}>
          {game.result === 'win' ? 'Victoire' : 'Défaite'}
        </div>
      </div>
    ));
  };
  
  const renderSettings = () => {
    return (
      <div>
        <p>Cette fonctionnalité sera disponible prochainement.</p>
        <p>Vous pourrez modifier votre profil, changer votre mot de passe, et personnaliser vos paramètres de jeu.</p>
      </div>
    );
  };
  
  return (
    <ProfileContainer>
      <ProfileSidebar>
        <img 
          src={profile?.avatar || "/assets/default-avatar.png"} 
          alt="Avatar" 
          className="avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/assets/default-avatar.png";
          }}
        />
        
        <h3>{user.username}</h3>
        <div className="email">{user.email}</div>
        
        <div className="stats">
          <h4><FaTrophy /> Statistiques</h4>
          <div className="stat-item">
            <span>Parties jouées:</span>
            <span>{profile?.stats?.gamesPlayed || user?.stats?.gamesPlayed || 0}</span>
          </div>
          <div className="stat-item">
            <span>Victoires:</span>
            <span>{profile?.stats?.wins || user?.stats?.wins || 0}</span>
          </div>
          <div className="stat-item">
            <span>Défaites:</span>
            <span>{profile?.stats?.losses || user?.stats?.losses || 0}</span>
          </div>
          <div className="stat-item">
            <span>Points:</span>
            <span>{profile?.stats?.points || user?.stats?.points || 0}</span>
          </div>
          <div className="stat-item">
            <span>Classement:</span>
            <span>#{profile?.stats?.rank || user?.stats?.rank || '?'}</span>
          </div>
        </div>
      </ProfileSidebar>
      
      <ProfileContent>
        <div className="tab-buttons">
          <div 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaGamepad /> Historique des parties
          </div>
          <div 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaEdit /> Paramètres du compte
          </div>
        </div>
        
        <div>
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </ProfileContent>
    </ProfileContainer>
  );
};

export default Profile;
