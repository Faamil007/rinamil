import React, { useState, useEffect, useRef } from 'react';
import { client, DB_ID, PRESENCE_ID } from '../App';

const TypingIndicator = ({ roomId, currentUser, onTypingChange }) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const realtimeSubscription = useRef(null);

  useEffect(() => {
    if (roomId) {
      subscribeToTyping();
    }

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current();
      }
    };
  }, [roomId]);

  const subscribeToTyping = () => {
    realtimeSubscription.current = client.subscribe(
      `databases.${DB_ID}.collections.${PRESENCE_ID}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const presence = response.payload;
          if (presence.roomId === roomId && presence.userId !== currentUser.$id) {
            if (presence.typing) {
              setTypingUsers(prev => [...prev.filter(id => id !== presence.userId), presence.userId]);
            } else {
              setTypingUsers(prev => prev.filter(id => id !== presence.userId));
            }
          }
        }
      }
    );
  };

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className="typing-indicator">
      <span>{typingUsers.length > 1 ? 'Several people are' : 'Someone is'} typing...</span>
    </div>
  );
};

export default TypingIndicator;