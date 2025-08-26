import React, { useState, useEffect, useRef } from 'react';
import { databases, client, DB_ID, MESSAGES_ID, PRESENCE_ID } from '../App';
import { Query } from 'appwrite';
import MessageList from './MessageList';
import Composer from './Composer';
import TypingIndicator from './TypingIndicator';
import PresenceIndicator from './PresenceIndicator';

const Chat = ({ user, roomId, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [presence, setPresence] = useState({});
  const realtimeSubscription = useRef(null);

  useEffect(() => {
    if (roomId) {
      loadMessages();
      subscribeToRealtime();
      updatePresence();
      loadOtherUser();
    }

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current();
      }
    };
  }, [roomId]);

  const loadMessages = async () => {
    try {
      const response = await databases.listDocuments(DB_ID, MESSAGES_ID, [
        Query.equal('roomId', roomId),
        Query.orderAsc('createdAt')
      ]);
      setMessages(response.documents);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToRealtime = () => {
    realtimeSubscription.current = client.subscribe(
      `databases.${DB_ID}.collections.${MESSAGES_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const newMessage = response.payload;
          if (newMessage.roomId === roomId) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      }
    );
  };

  const updatePresence = async () => {
    try {
      await databases.updateDocument(DB_ID, PRESENCE_ID, user.$id, {
        userId: user.$id,
        roomId,
        lastSeenAt: Math.floor(Date.now() / 1000),
        typing: false
      });
    } catch (error) {
      await databases.createDocument(DB_ID, PRESENCE_ID, user.$id, {
        userId: user.$id,
        roomId,
        lastSeenAt: Math.floor(Date.now() / 1000),
        typing: false
      });
    }
  };

  const loadOtherUser = async () => {
    try {
      const members = await databases.listDocuments(DB_ID, 'members', [
        Query.equal('roomId', roomId),
        Query.notEqual('userId', user.$id)
      ]);
      
      if (members.documents.length > 0) {
        const otherUserId = members.documents[0].userId;
        setOtherUser({ $id: otherUserId, name: otherUserId === 'USER1_ID' ? 'Rina' : 'Faamil' });
      }
    } catch (error) {
      console.error('Error loading other user:', error);
    }
  };

  const handleSendMessage = async (text) => {
    try {
      await databases.createDocument(DB_ID, MESSAGES_ID, 'unique()', {
        roomId,
        senderId: user.$id,
        type: 'text',
        text,
        createdAt: Math.floor(Date.now() / 1000)
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = async (isTyping) => {
    try {
      await databases.updateDocument(DB_ID, PRESENCE_ID, user.$id, {
        typing: isTyping,
        lastSeenAt: Math.floor(Date.now() / 1000)
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-info">
          <h3>{otherUser ? otherUser.name : 'Chat'}</h3>
          <PresenceIndicator 
            roomId={roomId} 
            userId={otherUser?.$id} 
            currentUser={user} 
          />
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
      
      <MessageList 
        messages={messages} 
        currentUser={user} 
      />
      
      <TypingIndicator 
        roomId={roomId} 
        currentUser={user} 
        onTypingChange={setIsTyping} 
      />
      
      <Composer 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping} 
      />
    </div>
  );
};

export default Chat;