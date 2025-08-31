import React, { useState, useEffect } from 'react';
import { supabase } from '../App';

const ChatList = ({ user, onSelectChat, onCreateNewChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, [user]);

  const loadChats = async () => {
    try {
      // Get rooms the user is member of
      const { data: userRooms, error } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user rooms:', error);
        // Create default chat if no rooms exist
        createDefaultChat();
        return;
      }

      if (userRooms && userRooms.length > 0) {
        // For each room, get room details and the other user
        const chatPromises = userRooms.map(async (userRoom) => {
          // Get room info
          const { data: roomData } = await supabase
            .from('rooms')
            .select('name, created_at')
            .eq('id', userRoom.room_id)
            .single();

          // Get the other user in this room
          const { data: otherUser } = await supabase
            .from('room_members')
            .select('user_id')
            .eq('room_id', userRoom.room_id)
            .eq('user_id', user.id)
            .single();

          let partnerName = 'My Love'; // Default name
          if (otherUser) {
            // Try to get username from auth metadata
            const { data: userData } = await supabase
              .from('auth.users')
              .select('raw_user_meta_data')
              .eq('id', otherUser.user_id)
              .single();
            
            partnerName = userData?.raw_user_meta_data?.username || 'My Love';
          }

          // Get last message for preview
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('text, created_at')
            .eq('room_id', userRoom.room_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: userRoom.room_id,
            name: roomData?.name || partnerName,
            partnerName: partnerName,
            lastMessage: lastMessage?.text || 'Start chatting...',
            lastMessageTime: lastMessage?.created_at || new Date().toISOString(),
            avatar: partnerName.charAt(0).toUpperCase()
          };
        });

        const chatData = await Promise.all(chatPromises);
        setChats(chatData);
      } else {
        // No rooms found, create default chat
        createDefaultChat();
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      createDefaultChat();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultChat = () => {
    // Create a default chat since no rooms exist yet
    const defaultChat = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'My Love',
      partnerName: 'My Love',
      lastMessage: 'Start your conversation 💕',
      lastMessageTime: new Date().toISOString(),
      avatar: 'L'
    };
    setChats([defaultChat]);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="chat-list-container">
        <div className="chat-list-header">
          <h1>WhatsApp</h1>
          <div className="header-icons">
            <span>🔍</span>
            <span>⋮</span>
          </div>
        </div>
        <div className="loading-chats">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h1>WhatsApp</h1>
        <div className="header-icons">
          <span>🔍</span>
          <span>⋮</span>
        </div>
      </div>
      
      <div className="chats-list">
        {chats.map(chat => (
          <div key={chat.id} className="chat-item" onClick={() => onSelectChat(chat.id)}>
            <div className="chat-avatar">
              {chat.avatar}
            </div>
            <div className="chat-info">
              <div className="chat-name">{chat.partnerName}</div>
              <div className="chat-preview">{chat.lastMessage}</div>
            </div>
            <div className="chat-time">{formatTime(chat.lastMessageTime)}</div>
          </div>
        ))}
        
        {chats.length === 0 && (
          <div className="no-chats">
            <p>No chats yet</p>
            <button onClick={onCreateNewChat} className="new-chat-btn">
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;