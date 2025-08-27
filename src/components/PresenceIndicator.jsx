import React, { useState, useEffect } from 'react';
import { supabase } from '../App.jsx';

const PresenceIndicator = ({ roomId, userId, currentUser }) => {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (roomId && userId) {
      loadPresence();
      subscribeToPresence();
    }
  }, [roomId, userId]);

  const loadPresence = async () => {
    try {
      const { data, error } = await supabase
        .from('presence')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .single();

      if (data) {
        setPresence(data);
      }
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  };

  const subscribeToPresence = () => {
    supabase
      .channel('presence-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presence',
          filter: `user_id=eq.${userId},room_id=eq.${roomId}`
        },
        (payload) => {
          setPresence(payload.new);
        }
      )
      .subscribe();
  };

  const getStatus = () => {
    if (!presence) return 'Offline';
    
    const lastSeen = new Date(presence.last_seen_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeen) / 60000);
    
    if (diffMinutes < 1) return 'Online';
    if (diffMinutes < 5) return 'Recently online';
    
    return `Last seen at ${lastSeen.toLocaleTimeString()}`;
  };

  return (
    <div className="presence-indicator">
      <span className={`status-dot ${getStatus() === 'Online' ? 'online' : 'offline'}`}></span>
      <span className="status-text">{getStatus()}</span>
    </div>
  );
};

export default PresenceIndicator;