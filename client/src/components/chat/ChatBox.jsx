import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { sendMessage, getPredefinedMessages } from '../../features/chat/chatSlice';
import { sendChatMessage } from '../../features/socket/socketService';

const ChatContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px;
`;

const ChatHeader = styled.div`
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  font-weight: bold;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Message = styled.div`
  padding: 0.75rem;
  border-radius: 10px;
  max-width: 80%;
  word-break: break-word;
  
  ${({ isMine }) => isMine 
    ? `
      align-self: flex-end;
      background-color: var(--secondary-color);
      color: white;
    `
    : `
      align-self: flex-start;
      background-color: #f1f1f1;
      color: var(--dark-color);
    `
  }
`;

const Sender = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const Time = styled.div`
  font-size: 0.7rem;
  margin-top: 0.25rem;
  opacity: 0.7;
  text-align: right;
`;

const ChatInput = styled.div`
  display: flex;
  padding: 0.75rem;
  border-top: 1px solid #eee;
  
  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-right: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
  }
`;

const PredefinedMessages = styled.div`
  padding: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-top: 1px solid #eee;
  max-height: 100px;
  overflow-y: auto;
  
  button {
    background-color: #f1f1f1;
    border: none;
    border-radius: 15px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    
    &:hover {
      background-color: #e0e0e0;
    }
  }
`;

const ChatBox = ({ gameId, messages }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { predefinedMessages } = useSelector((state) => state.chat);
  
  useEffect(() => {
    dispatch(getPredefinedMessages());
  }, [dispatch]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    // Dispatch action to send message
    dispatch(sendMessage({ gameId, content: messageText }));
    
    // Also send through socket for real-time updates
    sendChatMessage(gameId, messageText);
    
    // Clear input
    setMessageText('');
  };
  
  const handlePredefinedMessage = (message) => {
    // Send predefined message
    dispatch(sendMessage({ gameId, content: message, isPredefined: true }));
    sendChatMessage(gameId, message);
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <ChatContainer>
      <ChatHeader>Chat</ChatHeader>
      
      <MessagesContainer>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.7 }}>
            Aucun message. Commencez à discuter !
          </div>
        )}
        
        {messages.map((message) => (
          <Message 
            key={message._id || message.timestamp} 
            isMine={message.sender._id === user._id || message.sender === user._id}
          >
            <Sender>
              {message.sender._id === user._id || message.sender === user._id ? 'Vous' : message.sender.username}
            </Sender>
            {message.content}
            <Time>{formatTime(message.timestamp)}</Time>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <PredefinedMessages>
        {predefinedMessages.map((message, index) => (
          <button 
            key={index} 
            onClick={() => handlePredefinedMessage(message)}
          >
            {message}
          </button>
        ))}
      </PredefinedMessages>
      
      <ChatInput>
        <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Écrivez votre message..."
          />
          <button type="submit" className="btn btn-primary">Envoyer</button>
        </form>
      </ChatInput>
    </ChatContainer>
  );
};

ChatBox.propTypes = {
  gameId: PropTypes.string.isRequired,
  messages: PropTypes.array.isRequired
};

export default ChatBox;
