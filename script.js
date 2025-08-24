// Backend API URL
const API_BASE_URL = 'https://rinamil-5a961b6d4ed7.herokuapp.com';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');
const closeSearch = document.getElementById('close-search');
const menuBtn = document.getElementById('menu-btn');
const exportMenu = document.getElementById('export-menu');
const exportHtml = document.getElementById('export-html');
const exportTxt = document.getElementById('export-txt');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');
const currentUserAvatar = document.getElementById('current-user-avatar');
const currentUserName = document.getElementById('current-user-name');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const gifBtn = document.getElementById('gif-btn');
const gifPicker = document.getElementById('gif-picker');
const logoutBtn = document.getElementById('logout-btn');

// User credentials
const users = {
    'moham': { password: 'moham123', avatar: 'm.jpg', name: 'Moham' },
    'rinu': { password: 'rinu123', avatar: 'r.jpg', name: 'Rinu' }
};

// Current user
let currentUser = null;
let otherUser = null;
let authToken = null;
let messagePollingInterval = null;
let statusPollingInterval = null;

// Popular GIFs for demo
const popularGifs = [
    'https://media.giphy.com/media/26uf758UnUIJTIEDq/giphy.gif',
    'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    'https://media.giphy.com/media/3o7TKsQ8UQ4l4LhGz6/giphy.gif',
    'https://media.giphy.com/media/3o7aD2d7hy9ktXNDP2/giphy.gif',
    'https://media.giphy.com/media/3o7TKwxYkeW0ZvTqsU/giphy.gif',
    'https://media.giphy.com/media/3o7TKsQ8UQ4l4LhGz6/giphy.gif',
    'https://media.giphy.com/media/l0HlG8vJXW0X5yX4s/giphy.gif'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        currentUser = userData.username;
        otherUser = userData.otherUser;
        authToken = userData.authToken;
        
        // Update UI with user info
        updateUserInfo();
        
        // Show chat screen
        loginScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        
        // Load messages
        loadMessages();
        
        // Start polling for new messages
        startMessagePolling();
        
        // Request notification permission
        requestNotificationPermission();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Generate GIF picker
    generateGifPicker();
});

// Set up all event listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleMessageKeypress);
    searchBtn.addEventListener('click', toggleSearch);
    closeSearch.addEventListener('click', toggleSearch);
    searchInput.addEventListener('input', handleSearch);
    menuBtn.addEventListener('click', toggleExportMenu);
    exportHtml.addEventListener('click', () => exportChats('html'));
    exportTxt.addEventListener('click', () => exportChats('text'));
    gifBtn.addEventListener('click', toggleGifPicker);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Close menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.classList.remove('active');
        }
        
        if (!gifBtn.contains(e.target) && !gifPicker.contains(e.target)) {
            gifPicker.classList.remove('active');
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// Update user info in UI
function updateUserInfo() {
    currentUserAvatar.src = users[currentUser].avatar;
    currentUserName.textContent = users[currentUser].name;
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (users[username] && users[username].password === password) {
        // For demo purposes, we're using a simple auth token
        authToken = btoa('oursecretplace:sharedpassword123');
        currentUser = username;
        otherUser = username === 'moham' ? 'rinu' : 'moham';
        
        // Save user data to localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            username: currentUser,
            otherUser: otherUser,
            authToken: authToken
        }));
        
        // Update UI with user info
        updateUserInfo();
        
        // Show chat screen
        loginScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        
        // Load messages
        loadMessages();
        
        // Start polling for new messages
        startMessagePolling();
        
        // Request notification permission
        requestNotificationPermission();
        
        // Show welcome notification
        showNotification(`Welcome back, ${users[username].name}!`);
    } else {
        alert('Invalid username or password. Please try again.');
    }
}

// Generate GIF picker
function generateGifPicker() {
    gifPicker.innerHTML = '';
    popularGifs.forEach(gifUrl => {
        const gifElement = document.createElement('div');
        gifElement.classList.add('gif-item');
        gifElement.innerHTML = `<img src="${gifUrl}" alt="GIF">`;
        gifElement.addEventListener('click', () => {
            sendGifMessage(gifUrl);
            gifPicker.classList.remove('active');
        });
        gifPicker.appendChild(gifElement);
    });
}

// Show notification
function showNotification(text) {
    notificationText.textContent = text;
    notification.classList.add('active');
    
    // Play notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRl4QAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToQAACBgIF/gn6DgIR8hX2GfId6iHmJeot5jHeNeI54j3eQd5F2knaTdZV0lnOXc5hymXKacZtwnHCdb55un26gbKFroWqia6Jpo2ikZ6VmpmWnZadiqGGpYKpfql2qXKpaq1irVqtUq1OrUqtRq0+rTqtMq0urSatHq0arRKs=');
    audio.play().catch(() => {});
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rinamil', { body: text });
    }
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Encrypt message
function encryptMessage(text) {
    // Simple encryption for demonstration (not secure for production)
    return btoa(unescape(encodeURIComponent(text)));
}

// Decrypt message
function decryptMessage(encryptedText) {
    try {
        // Simple decryption for demonstration
        return decodeURIComponent(escape(atob(encryptedText)));
    } catch (e) {
        return encryptedText; // Return as-is if decryption fails
    }
}

// Format message time
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Load messages from backend
async function loadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            headers: {
                'Authorization': `Basic ${authToken}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        } else {
            console.error('Failed to load messages:', response.status);
            // For demo purposes, show some sample messages if API fails
            renderSampleMessages();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        // For demo purposes, show some sample messages if API fails
        renderSampleMessages();
    }
}

// Render messages
function renderMessages(messages) {
    chatContainer.innerHTML = '';
    
    // Filter messages if search is active
    const searchText = searchInput.value.toLowerCase();
    if (searchText) {
        messages = messages.filter(msg => {
            const decryptedText = decryptMessage(msg.text);
            return decryptedText.toLowerCase().includes(searchText);
        });
    }
    
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (msg.sender === currentUser) {
            messageElement.classList.add('outgoing');
        } else {
            messageElement.classList.add('incoming');
        }
        
        // Check if message is a GIF
        if (msg.text.startsWith('GIF:')) {
            messageElement.classList.add('gif-message');
            const gifUrl = msg.text.substring(4);
            messageElement.innerHTML = `
                <div class="message-sender">${msg.sender === 'moham' ? 'Moham' : 'Rinu'}</div>
                <img src="${gifUrl}" alt="GIF">
                <div class="message-time">${formatTime(new Date(msg.timestamp))} <span class="message-status">${msg.status || '✓✓'}</span></div>
            `;
        } else {
            const decryptedText = decryptMessage(msg.text);
            messageElement.innerHTML = `
                <div class="message-sender">${msg.sender === 'moham' ? 'Moham' : 'Rinu'}</div>
                <div class="message-text">${decryptedText}</div>
                <div class="message-time">${formatTime(new Date(msg.timestamp))} <span class="message-status">${msg.status || '✓✓'}</span></div>
            `;
        }
        
        chatContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}



// Send message
async function sendMessage() {
    const text = messageInput.value.trim();
    
    if (text === '') return;
    
    const encryptedText = encryptMessage(text);
    const now = new Date();
    
    const message = {
        sender: currentUser,
        text: encryptedText,
        timestamp: now.getTime()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`
            },
            body: JSON.stringify(message)
        });
        
        if (response.ok) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            loadMessages(); // Reload messages to include the new one
        } else {
            console.error('Failed to send message:', response.status);
            showNotification('Failed to send message. Please try again.');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message. Please check your connection.');
    }
}

// Send GIF message
async function sendGifMessage(gifUrl) {
    const now = new Date();
    
    const message = {
        sender: currentUser,
        text: 'GIF:' + gifUrl,
        timestamp: now.getTime()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`
            },
            body: JSON.stringify(message)
        });
        
        if (response.ok) {
            loadMessages(); // Reload messages to include the new one
        } else {
            console.error('Failed to send GIF message:', response.status);
            showNotification('Failed to send GIF. Please try again.');
        }
    } catch (error) {
        console.error('Error sending GIF message:', error);
        showNotification('Failed to send GIF. Please check your connection.');
    }
}

// Handle message input keypress
function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Toggle search
function toggleSearch() {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        loadMessages();
    }
}

// Handle search
function handleSearch() {
    loadMessages();
}

// Toggle export menu
function toggleExportMenu() {
    exportMenu.classList.toggle('active');
}

// Toggle GIF picker
function toggleGifPicker() {
    gifPicker.classList.toggle('active');
}

// Export chats
function exportChats(format) {
    // For demo purposes, we'll use the sample messages
    // In a real app, you would fetch the actual messages from the backend
    const messages = JSON.parse(localStorage.getItem('rinamil_chat_messages')) || [];
    
    let content = '';
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    
    if (format === 'html') {
        content = `<!DOCTYPE html><html><head><title>Chat Export - ${date}</title><meta charset="UTF-8"></head><body>`;
        content += `<h1>Rinamil Export - ${date}</h1>`;
        
        messages.forEach(msg => {
            if (msg.text.startsWith('GIF:')) {
                const gifUrl = msg.text.substring(4);
                content += `<p><strong>${msg.sender} (${formatTime(new Date(msg.timestamp))}):</strong> <img src="${gifUrl}" alt="GIF" style="max-width: 200px;"></p>`;
            } else {
                const decryptedText = decryptMessage(msg.text);
                content += `<p><strong>${msg.sender} (${formatTime(new Date(msg.timestamp))}):</strong> ${decryptedText}</p>`;
            }
        });
        
        content += `</body></html>`;
    } else {
        content = `Rinamil Chat Export - ${date}\n\n`;
        
        messages.forEach(msg => {
            if (msg.text.startsWith('GIF:')) {
                const gifUrl = msg.text.substring(4);
                content += `${msg.sender} (${formatTime(new Date(msg.timestamp))}): [GIF] ${gifUrl}\n`;
            } else {
                const decryptedText = decryptMessage(msg.text);
                content += `${msg.sender} (${formatTime(new Date(msg.timestamp))}): ${decryptedText}\n`;
            }
        });
    }
    
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rinamil_chat_export_${date}.${format === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Chats exported as ${format.toUpperCase()}`);
    exportMenu.classList.remove('active');
}

// Start polling for new messages
function startMessagePolling() {
    // Clear any existing interval
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    
    // Poll for new messages every 3 seconds
    messagePollingInterval = setInterval(() => {
        loadMessages();
    }, 3000);
    
    // Simulate online status changes
    if (statusPollingInterval) clearInterval(statusPollingInterval);
    statusPollingInterval = setInterval(() => {
        const isOnline = Math.random() > 0.2; // 80% chance online
        
        if (isOnline) {
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            statusText.textContent = 'Online';
        } else {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusText.textContent = 'Offline';
        }
    }, 10000);
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear intervals
        if (messagePollingInterval) clearInterval(messagePollingInterval);
        if (statusPollingInterval) clearInterval(statusPollingInterval);
        
        // Clear local storage
        localStorage.removeItem('currentUser');
        
        // Reset UI
        messageInput.value = '';
        chatContainer.innerHTML = '';
        searchInput.value = '';
        searchContainer.classList.remove('active');
        
        // Show login screen, hide chat screen
        loginScreen.style.display = 'flex';
        chatScreen.style.display = 'none';
        
        // Reset form fields
        usernameInput.value = '';
        passwordInput.value = '';
        
        // Show logout notification
        showNotification('You have been logged out successfully');
    }
}