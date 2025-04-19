'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import Button from '@/components/ui/Button';

export default function ChatBox({ gameId, userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [predefinedMessages, setPredefinedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPredefined, setShowPredefined] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchPredefinedMessages();
    setupChatListeners();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('chat:message');
      }
    };
  }, [gameId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupChatListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('chat:message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/messages/games/${gameId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredefinedMessages = async () => {
    try {
      const response = await axios.get('/messages/predefined');
      setPredefinedMessages(response.data);
    } catch (error) {
      console.error('Error fetching predefined messages:', error);
    }
  };

  const sendMessage = async (content, isPredefined = false) => {
    if (!content.trim()) return;

    try {
      const response = await axios.post(`/messages/games/${gameId}`, {
        content,
        isPredefined
      });

      // Real-time message delivery is handled by socket.io
      // The server will emit to both players
      setNewMessage('');
      setShowPredefined(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Impossible d\'envoyer le message');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const sendPredefinedMessage = (message) => {
    sendMessage(message, true);
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <h3 className="text-lg font-semibold">Chat</h3>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Aucun message</div>
        ) : (
          messages.map((message) => (
            <div 
              key={message._id} 
              className={`${
                message.sender._id === userId 
                  ? 'ml-auto bg-blue-500 text-white' 
                  : 'mr-auto bg-gray-200 text-gray-800'
              } rounded-lg px-3 py-2 max-w-[80%]`}
            >
              <div className="font-medium text-sm">
                {message.sender._id === userId ? 'Vous' : message.sender.username}
              </div>
              <div>{message.content}</div>
              <div className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showPredefined && (
        <div className="p-2 border-t grid grid-cols-2 gap-2">
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
          className="p-2 bg-gray-100 rounded-l"
          onClick={() => setShowPredefined(!showPredefined)}
        >
          ⚡
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="flex-grow border p-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r"
          disabled={!newMessage.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
