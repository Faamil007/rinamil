import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

// Initialize Supabase client
const supabaseUrl = 'https://yaltykomnxhonobpxuhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbHR5a29tbnhob25vYnB4dWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzA0NzYsImV4cCI6MjA3MTkwNjQ3Nn0.R-AHIWlMZeoA-8W3TkxpOog4PYkyQloH0RTuVaXzWxk';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Default room ID (matches the SQL above)
const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(DEFAULT_ROOM_ID);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          ensureUserInRoom(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { user: userData }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (userData) {
        setUser(userData);
        ensureUserInRoom(userData.id);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureUserInRoom = async (userId) => {
    try {
      // Check if user is already in the room
      const { data: existingMember, error: checkError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', userId)
        .eq('room_id', DEFAULT_ROOM_ID)
        .single();

      if (checkError || !existingMember) {
        // User not in room, add them
        const { error: insertError } = await supabase
          .from('room_members')
          .insert([{ room_id: DEFAULT_ROOM_ID, user_id: userId }]);

        if (insertError) {
          console.error('Error adding user to room:', insertError);
        }
      }
    } catch (error) {
      console.error('Error ensuring user in room:', error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      setError(null);
      const email = `${username}@chat.local`;
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      
      setUser(data.user);
      ensureUserInRoom(data.user.id);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleRegister = async (username, password) => {
    try {
      setError(null);
      
      // Validate password length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const email = `${username}@chat.local`;
      
      // Register user with username in metadata
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username } // Store username in user metadata
        }
      });
  
      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message.includes('password')) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (signUpError.message.includes('already registered')) {
          throw new Error('Username already exists. Please try logging in instead.');
        }
        throw signUpError;
      }
  
      // Auto-login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (loginError) throw loginError;
  
      // Add user to default room
      const { error: roomError } = await supabase
        .from('room_members')
        .insert([{ 
          room_id: DEFAULT_ROOM_ID, 
          user_id: loginData.user.id,
          joined_at: new Date().toISOString()
        }]);
  
      if (roomError) {
        console.warn('Could not add user to room (might already exist):', roomError);
        // Don't throw error - user can still use the app
      }
  
      // Update presence
      const { error: presenceError } = await supabase
        .from('presence')
        .upsert({
          user_id: loginData.user.id,
          room_id: DEFAULT_ROOM_ID,
          last_seen_at: new Date().toISOString(),
          typing: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,room_id' });
  
      if (presenceError) {
        console.warn('Could not update presence:', presenceError);
      }
  
      setUser(loginData.user);
      return { success: true, message: 'Registration successful!' };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // User-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('User already registered')) {
        errorMessage = 'Username already exists. Please try logging in instead.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  return (
    <div className="app">
      {user ? (
        <Chat user={user} roomId={roomId} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}

export default App;