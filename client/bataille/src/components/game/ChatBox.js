'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
// Removed: import { getSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';

// Receive messages, userId, and onSendMessage handler as props
export default function ChatBox({ gameId, userId, messages, onSendMessage }) {
  const [newMessage, setNewMessage] = useState('');
  const [predefinedMessages, setPredefinedMessages] = useState([]);
  const [showPredefined, setShowPredefined] = useState(false);
  const messagesEndRef = useRef(null);
  // Removed internal state: messages, loading

  // Fetch predefined messages on mount
  useEffect(() => {
    fetchPredefinedMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Removed: setupChatListeners
  // Removed: fetchMessages

  const fetchPredefinedMessages = async () => {
    try {
      const response = await axios.get('/messages/predefined');
      setPredefinedMessages(response.data);
    } catch (error) {
      console.error('Error fetching predefined messages:', error);
    }
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
        <h3 className="text-lg font-semibold">Chat</h3>
      </div>

      {/* Render messages received via props */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Aucun message</div>
        ) : (
          messages.map((message) => (
            <div
              // Use message._id if available and unique, otherwise combine fields for key
              key={message._id || `${message.sender._id}-${message.timestamp}-${message.content.substring(0, 10)}`}
              className={`${
                message.sender._id === userId
                  ? 'ml-auto bg-blue-500 text-white'
                  : 'mr-auto bg-gray-200 text-gray-800'
              } rounded-lg px-3 py-2 max-w-[80%] break-words`} // Added break-words
            >
              <div className="font-medium text-sm">
                {/* Ensure sender info is present */}
                {message.sender?._id === userId ? 'Vous' : message.sender?.username || 'Adversaire'}
              </div>
              <div>{message.content}</div>
              <div className="text-xs opacity-70 mt-1 text-right"> {/* Adjusted style */}
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showPredefined && (
        <div className="p-2 border-t grid grid-cols-2 gap-2 max-h-32 overflow-y-auto"> {/* Added max-h and overflow */}
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
          maxLength={200} // Added max length
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
