import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../App';
import MessageList from './MessageList';
import Composer from './Composer';
import TypingIndicator from './TypingIndicator';
import PresenceIndicator from './PresenceIndicator';

const Chat = ({ user, roomId, onLogout, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const realtimeSubscription = useRef(null);

  useEffect(() => {
    if (roomId && user) {
      loadMessages();
      subscribeToRealtime();
      loadChatPartner();
      updatePresence();
    }

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [roomId, user]);

  const loadChatPartner = async () => {
    try {
      // Get ALL users in the room
      const { data: allUsers, error } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId);
  
      if (error) throw error;
  
      // Find the other user
      if (allUsers && allUsers.length > 1) {
        const otherUser = allUsers.find(member => member.user_id !== user.id);
        
        if (otherUser) {
          // Get username from profiles table (NOT auth.users)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', otherUser.user_id)
            .single();
  
          const partnerName = profile?.username || 'My Love';
          setChatPartner({ id: otherUser.user_id, name: partnerName });
          return;
        }
      }
      
      setChatPartner({ id: null, name: 'My Love' });
      
    } catch (error) {
      console.error('Error loading chat partner:', error);
      setChatPartner({ id: 'partner', name: 'My Love' });
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToRealtime = () => {
    realtimeSubscription.current = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
  };

  const updatePresence = async () => {
    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          user_id: user.id,
          room_id: roomId,
          last_seen_at: new Date().toISOString(),
          typing: false,
        }, { onConflict: 'user_id,room_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const loadOtherUser = async () => {
    try {
      // For now, we'll just set a placeholder
      // In a real app, you'd fetch the other user from room_members
      setOtherUser({ id: 'other-user', name: 'Chat Partner' });
    } catch (error) {
      console.error('Error loading other user:', error);
    }
  };

  const handleSendMessage = async (text) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          type: 'text',
          text: text,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = async (isTyping) => {
    try {
      const { error } = await supabase
        .from('presence')
        .update({
          typing: isTyping,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('room_id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };
  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>←</button>
        <div className="chat-partner-info">
          <div className="chat-partner-name">{chatPartner?.name || 'Loading...'}</div>
          <div className="chat-partner-status">
            <PresenceIndicator 
              roomId={roomId} 
              userId={chatPartner?.id} 
              currentUser={user} 
            />
          </div>
        </div>
        <div className="chat-header-icons">
          <span>📞</span>
          <span>📹</span>
          <span>⋮</span>
        </div>
      </div>
      
      <MessageList 
        messages={messages} 
        currentUser={user} 
        otherUser={chatPartner}
      />
      
      <TypingIndicator 
        roomId={roomId} 
        currentUser={user} 
        otherUser={chatPartner}
      />
      
      <Composer 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping} 
      />
    </div>

  );
};

export default Chat;