import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../App.jsx';

const TypingIndicator = ({ roomId, currentUser }) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const realtimeSubscription = useRef(null);

  useEffect(() => {
    if (roomId) {
      subscribeToTyping();
    }

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [roomId]);

  const subscribeToTyping = () => {
    realtimeSubscription.current = supabase
      .channel('typing-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presence',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const presence = payload.new;
          if (presence.user_id !== currentUser.id) {
            if (presence.typing) {
              setTypingUsers(prev => [...prev.filter(id => id !== presence.user_id), presence.user_id]);
            } else {
              setTypingUsers(prev => prev.filter(id => id !== presence.user_id));
            }
          }
        }
      )
      .subscribe();
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