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

  // Add this function to your App.jsx
const handleRegister = async (username, password) => {
  try {
    console.log('Registering user:', username);
    
    // Convert username to email format
    const email = `${username}@chat.local`;
    
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
      throw loginError;
    }

    setUser(loginData.user);
    return { success: true, message: 'Registration successful!' };
    
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

  // In App.jsx, modify the handleLogin function:
  const handleLogin = async (username, password) => {
    try {
      console.log('Trying to login with:', username, password); // Debug log
      
      // Convert username to email format
      const email = `${username}@chat.local`;
      console.log('Converted email:', email); // Debug log
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email, // Use the constructed email
        password,
      });
  
      if (loginError) {
        console.error('Login error details:', loginError); // More detailed error
        throw loginError;
      }
      
      console.log('Login successful!', data.user); // Debug log
      setUser(data.user);
      getRoomForUser(data.user.id);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }

    // In your App.jsx render method
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