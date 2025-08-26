import React, { useState, useEffect } from 'react';
import { Client, Account, Databases, Query } from 'appwrite';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Replace with your endpoint
  .setProject('68ae28cb000b9e55f763'); // Replace with your project ID

export const account = new Account(client);
export const databases = new Databases(client);
// Realtime is accessed differently in newer Appwrite versions
export { client }; // Export client to use for realtime subscriptions

// Collection and database IDs (replace with your actual IDs)
export const DB_ID = 'chat_db';
export const MESSAGES_ID = 'messages';
export const MEMBERS_ID = 'members';
export const PRESENCE_ID = 'presence';
export const PUSH_SUBS_ID = 'push_subscriptions';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      
      // Get the user's room
      const room = await getRoomForUser(userData.$id);
      setRoomId(room?.roomId || null);
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const getRoomForUser = async (userId) => {
    try {
      const response = await databases.listDocuments(DB_ID, MEMBERS_ID, [
        Query.equal('userId', userId)
      ]);
      return response.documents[0] || null;
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      // Create session
      await account.createEmailSession(email, password);
      
      // Get user data
      const userData = await account.get();
      setUser(userData);
      
      // Get the user's room
      const room = await getRoomForUser(userData.$id);
      setRoomId(room?.roomId || null);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
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