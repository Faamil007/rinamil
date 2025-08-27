import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../App.jsx';
import MessageList from './MessageList';
import Composer from './Composer';
import TypingIndicator from './TypingIndicator';
import PresenceIndicator from './PresenceIndicator';

const Chat = ({ user, roomId, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const realtimeSubscription = useRef(null);

  useEffect(() => {
    if (roomId) {
      loadMessages();
      subscribeToRealtime();
      loadOtherUser();
      updatePresence();
    }

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [roomId]);

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
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,room_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const loadOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', user.id)
        .single();

      if (data) {
        // In a real app, you'd fetch user details from a users table
        setOtherUser({ id: data.user_id, name: data.user_id === 'USER1_ID' ? 'Rina' : 'Faamil' });
      }
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
          updated_at: new Date().toISOString()
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
        <div className="chat-info">
          <h3>{otherUser ? otherUser.name : 'Chat'}</h3>
          <PresenceIndicator 
            roomId={roomId} 
            userId={otherUser?.id} 
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
      />
      
      <Composer 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping} 
      />
    </div>
  );
};

export default Chat;