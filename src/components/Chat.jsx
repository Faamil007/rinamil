import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../App';
import MessageList from './MessageList';
import Composer from './Composer';
import TypingIndicator from './TypingIndicator';
import PresenceIndicator from './PresenceIndicator';

const Chat = ({ user, roomId, onLogout }) => {
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
      // Get ALL users in this room (not just the other one)
      const { data: roomMembers, error } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId);
  
      if (error) throw error;
  
      if (roomMembers && roomMembers.length > 0) {
        // Find the other user (not the current user)
        const otherMember = roomMembers.find(member => member.user_id !== user.id);
        
        if (otherMember) {
          // Get username from auth users table
          const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('raw_user_meta_data')
            .eq('id', otherMember.user_id)
            .single();
  
          if (userData && !userError) {
            const username = userData.raw_user_meta_data?.username || 'Unknown User';
            setChatPartner({ id: otherMember.user_id, name: username });
          } else {
            setChatPartner({ id: otherMember.user_id, name: 'Chat Partner' });
          }
        } else {
          // No other user in room yet
          setChatPartner({ id: null, name: 'Waiting for someone to join...' });
        }
      }
    } catch (error) {
      console.error('Error loading chat partner:', error);
      setChatPartner({ id: 'other-user', name: 'Your Friend' });
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
        <div className="chat-info">
          <h3>{chatPartner ? `Chat with ${chatPartner.name}` : 'Private Chat'}</h3>
          <div className="user-status">
            <span className="current-user">You: {user.email?.split('@')[0]}</span>
            {chatPartner && (
              <PresenceIndicator 
                roomId={roomId} 
                userId={chatPartner.id} 
                currentUser={user} 
              />
            )}
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
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