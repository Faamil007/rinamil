import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

// Initialize Supabase client
const supabaseUrl = 'https://yaltykomnxhonobpxuhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbHR5a29tbnhob25vYnB4dWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzA0NzYsImV4cCI6MjA3MTkwNjQ3Nn0.R-AHIWlMZeoA-8W3TkxpOog4PYkyQloH0RTuVaXzWxk';
export const supabase = createClient(supabaseUrl, supabaseKey); // ADD 'export' HERE

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [error, setError] = useState(null); // Add this line


  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          getRoomForUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRoomId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (userData) {
        setUser(userData);
        getRoomForUser(userData.id);
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const getRoomForUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', userId)
        .single();

      if (data) {
        setRoomId(data.room_id);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  // In App.jsx, modify the handleLogin function:
const handleLogin = async (username, password) => {
  try {
    // Treat username as email by adding a domain
    const email = `${username}@yourdomain.com`; // Or use a fake domain
    
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email, // Use the constructed email
      password,
    });

    if (loginError) {
      console.error('Login error:', loginError);
      setError(loginError.message);
      throw loginError;
    }
    
    setUser(data.user);
    getRoomForUser(data.user.id);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRoomId(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {user ? (
        <Chat 
          user={user} 
          roomId={roomId} 
          onLogout={handleLogout} 
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;