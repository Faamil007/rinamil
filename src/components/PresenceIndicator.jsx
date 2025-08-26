import React, { useState, useEffect } from 'react';
import { databases, client, DB_ID, PRESENCE_ID } from '../App';

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
      const userPresence = await databases.getDocument(DB_ID, PRESENCE_ID, userId);
      setPresence(userPresence);
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  };

  const subscribeToPresence = () => {
    client.subscribe(
      `databases.${DB_ID}.collections.${PRESENCE_ID}.documents`,
      (response) => {
        if (response.payload.userId === userId) {
          setPresence(response.payload);
        }
      }
    );
  };

  const getStatus = () => {
    if (!presence) return 'Offline';
    
    const now = Math.floor(Date.now() / 1000);
    const lastSeen = presence.lastSeenAt;
    
    if (now - lastSeen < 60) return 'Online';
    if (now - lastSeen < 300) return 'Recently online';
    
    return `Last seen at ${new Date(lastSeen * 1000).toLocaleTimeString()}`;
  };

  return (
    <div className="presence-indicator">
      <span className={`status-dot ${getStatus() === 'Online' ? 'online' : 'offline'}`}></span>
      <span className="status-text">{getStatus()}</span>
    </div>
  );
};

export default PresenceIndicator;