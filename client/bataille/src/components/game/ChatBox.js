'use client';

import { useState, useEffect, useRef } from 'react';
import axios from '@/lib/axios'; // Use the configured axios instance

// Receive messages, userId, onSendMessage handler, and loading state as props
export default function ChatBox({ gameId, userId, messages, onSendMessage, loading }) {
  const [newMessage, setNewMessage] = useState('');
  const [predefinedMessages, setPredefinedMessages] = useState([]);
  const [showPredefined, setShowPredefined] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch predefined messages on mount
  useEffect(() => {
    const fetchPredefinedMessages = async () => {
      try {
        const response = await axios.get('/messages/predefined');
        setPredefinedMessages(response.data);
      } catch (error) {
        console.error('Error fetching predefined messages:', error);
        // Toast handled by interceptor
      }
    };
    fetchPredefinedMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Use the passed-in onSendMessage prop
  const handleSendMessageInternal = (content, isPredefined = false) => {
    if (!content.trim()) return;
    onSendMessage(content, isPredefined); // Call the handler from GamePage
    setNewMessage(''); // Clear input after sending
    setShowPredefined(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessageInternal(newMessage);
  };

  const sendPredefinedMessage = (message) => {
    handleSendMessageInternal(message, true);
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Chat</h3>
      </div>

      {/* Render messages received via props */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 relative">
        {loading && ( // Show loading indicator
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {!loading && messages.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Aucun message</div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id} // Use message._id as key
              className={`${
                message.sender?._id === userId
                  ? 'ml-auto bg-blue-500 text-white'
                  : 'mr-auto bg-gray-200 text-gray-800'
              } rounded-lg px-3 py-2 max-w-[80%] break-words`}
            >
              <div className="font-medium text-sm">
                {/* Ensure sender info is present */}
                {message.sender?._id === userId ? 'Vous' : message.sender?.username || 'Adversaire'}
              </div>
              <div>{message.content}</div>
              <div className="text-xs opacity-80 mt-1 text-right"> {/* Increased opacity */}
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Predefined messages toggle and list */}
      {showPredefined && (
        <div className="p-2 border-t grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {' '}
          {/* Added space */}
          {predefinedMessages.map((message, index) => (
            <button
              key={index}
              className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-sm text-left"
              onClick={() => sendPredefinedMessage(message)}
            >
              {message}
            </button>
          ))}
        </div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSubmit} className="p-2 border-t flex">
        <button
          type="button"
          title="Messages prédéfinis" // Added title for accessibility
          className="p-2 bg-gray-100 rounded-l hover:bg-gray-200" // Added hover state
          onClick={() => setShowPredefined(!showPredefined)}
        >
          ⚡
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="flex-grow border border-gray-300 p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" // Improved focus style
          maxLength={200}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:opacity-50" // Added hover and disabled styles
          disabled={!newMessage.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
