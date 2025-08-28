import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

// Initialize Supabase client
const supabaseUrl = 'https://yaltykomnxhonobpxuhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbHR5a29tbnhob25vYnB4dWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzA0NzYsImV4cCI6MjA3MTkwNjQ3Nn0.R-AHIWlMZeoA-8W3TkxpOog4PYkyQloH0RTuVaXzWxk';
export const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
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
      console.log('Checking auth status...');
      const { data: { user: userData }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        return;
      }
      
      if (userData) {
        console.log('User found:', userData);
        setUser(userData);
        getRoomForUser(userData.id);
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoomForUser = async (userId) => {
    try {
      console.log('Getting room for user:', userId);
      const { data, error: roomError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', userId)
        .single();

      if (roomError) {
        console.error('Room error:', roomError);
        return;
      }

      if (data) {
        console.log('Room found:', data.room_id);
        setRoomId(data.room_id);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      setError(null);
      console.log('Trying to login with:', username, password);
      
      // Convert username to email format
      const email = `${username}@chat.local`;
      console.log('Converted email:', email);
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Login error:', loginError);
        setError(loginError.message);
        throw loginError;
      }
      
      console.log('Login successful!', data.user);
      setUser(data.user);
      getRoomForUser(data.user.id);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleRegister = async (username, password) => {
    try {
      setError(null);
      console.log('Registering user:', username);
      
      // Convert username to email format
      const email = `${username}@chat.local`;
      console.log('Converted email:', email);
      
      // Register the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Disable email confirmation
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        console.error('Registration error:', signUpError);
        setError(signUpError.message);
        throw signUpError;
      }

      console.log('Registration successful!', data);
      
      // Auto-login after registration
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Auto-login error:', loginError);
        setError(loginError.message);
        throw loginError;
      }

      console.log('Auto-login successful!', loginData.user);
      setUser(loginData.user);
      getRoomForUser(loginData.user.id);
      
      return { success: true, message: 'Registration successful!' };
      
    } catch (error) {
      console.error('Registration failed:', error);
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
      setError(error.message);
    }
  };

  // Debug: Check if functions are properly defined
  console.log('App functions:', {
    handleLogin: typeof handleLogin,
    handleRegister: typeof handleRegister,
    handleLogout: typeof handleLogout
  });

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
        <Chat 
          user={user} 
          roomId={roomId} 
          onLogout={handleLogout} 
        />
      ) : (
        <Login onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}

export default App;