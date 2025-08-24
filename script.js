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
const notificationSound = document.getElementById('notification-sound');
const connectionStatus = document.getElementById('connection-status');

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
let lastMessageTimestamp = 0;
let messages = [];

// Popular GIFs
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
    // Check which page we're on
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // Login page logic
        setupLoginPage();
    } else if (window.location.pathname.endsWith('chat.html')) {
        // Chat page logic
        setupChatPage();
    }
});

// Setup login page
function setupLoginPage() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        // Redirect to chat page if already logged in
        window.location.href = 'chat.html';
        return;
    }
    
    // Set up login form event listener
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Setup chat page
function setupChatPage() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(savedUser);
    currentUser = userData.username;
    otherUser = userData.otherUser;
    authToken = userData.authToken;
    
    // Update UI with user info
    updateUserInfo();
    
    // Load messages
    loadMessages();
    
    // Start polling for new messages
    startMessagePolling();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Set up event listeners
    setupEventListeners();
    
    // Test backend connection
    testBackendConnection();
}

// Test backend connection
async function testBackendConnection() {
    try {
        connectionStatus.textContent = "Testing connection...";
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            connectionStatus.textContent = "Connected to backend";
            setTimeout(() => {
                connectionStatus.style.display = "none";
            }, 2000);
        } else {
            connectionStatus.textContent = "Backend connection failed";
            connectionStatus.style.backgroundColor = "rgba(220, 50, 50, 0.7)";
        }
    } catch (error) {
        console.error("Backend connection failed:", error);
        connectionStatus.textContent = "Backend connection failed";
        connectionStatus.style.backgroundColor = "rgba(220, 50, 50, 0.7)";
    }
}

// Set up all event listeners
function setupEventListeners() {
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) messageInput.addEventListener('keypress', handleMessageKeypress);
    if (searchBtn) searchBtn.addEventListener('click', toggleSearch);
    if (closeSearch) closeSearch.addEventListener('click', toggleSearch);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (menuBtn) menuBtn.addEventListener('click', toggleExportMenu);
    if (exportHtml) exportHtml.addEventListener('click', () => exportChats('html'));
    if (exportTxt) exportTxt.addEventListener('click', () => exportChats('text'));
    if (gifBtn) gifBtn.addEventListener('click', toggleGifPicker);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Close menus when clicking outside
    document.addEventListener('click', function(e) {
        if (menuBtn && exportMenu && !menuBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.classList.remove('active');
        }
        
        if (gifBtn && gifPicker && !gifBtn.contains(e.target) && !gifPicker.contains(e.target)) {
            gifPicker.classList.remove('active');
        }
    });
    
    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
}

// Update user info in UI
function updateUserInfo() {
    if (currentUserAvatar) currentUserAvatar.src = users[currentUser].avatar;
    if (currentUserName) currentUserName.textContent = users[currentUser].name;
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
        
        // Redirect to chat page
        window.location.href = 'chat.html';
    } else {
        alert('Invalid username or password. Please try again.');
    }
}

// Show notification
function showNotification(text) {
    if (!notification || !notificationText) return;
    
    notificationText.textContent = text;
    notification.classList.add('active');
    
    // Play notification sound
    if (notificationSound) {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(e => {
            console.log('Audio play failed:', e);
        });
    }
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('RinaMil', { body: text });
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
            const serverMessages = await response.json();
            messages = serverMessages;
            renderMessages(messages);
            
            // Check for new messages to show notifications
            checkForNewMessages(messages);
        } else {
            console.error('Failed to load messages from server:', response.status);
            showNotification('Failed to load messages. Please check your connection.');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Failed to load messages. Please check your connection.');
    }
}

// Check for new messages and show notifications
function checkForNewMessages(messages) {
    if (messages.length === 0) return;
    
    // Find the latest message
    const latestMessage = messages.reduce((latest, message) => {
        return message.timestamp > latest.timestamp ? message : latest;
    }, messages[0]);
    
    // If this is a new message from the other user, show notification
    if (latestMessage.sender === otherUser && latestMessage.timestamp > lastMessageTimestamp) {
        // Update last message timestamp
        lastMessageTimestamp = latestMessage.timestamp;
        
        // Show notification if not the initial load
        if (lastMessageTimestamp !== 0) {
            showNotification(`New message from ${users[otherUser].name}`);
        }
    }
}

// Render messages
function renderMessages(messagesToRender) {
    if (!chatContainer) return;
    
    // Store scroll position before rendering
    const wasScrolledToBottom = isScrolledToBottom();
    
    chatContainer.innerHTML = '';
    
    // Filter messages if search is active
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchText) {
        messagesToRender = messagesToRender.filter(msg => {
            // Skip GIF messages in search
            if (msg.text.startsWith('GIF:')) return false;
            
            const decryptedText = decryptMessage(msg.text);
            return decryptedText.toLowerCase().includes(searchText);
        });
    }
    
    messagesToRender.forEach(msg => {
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
    
    // Restore scroll position
    if (wasScrolledToBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Check if chat container is scrolled to bottom
function isScrolledToBottom() {
    if (!chatContainer) return false;
    return chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 10;
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

// Handle message input keypress
function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Toggle search
function toggleSearch() {
    if (!searchContainer) return;
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
    if (!exportMenu) return;
    exportMenu.classList.toggle('active');
}

// Toggle GIF picker
function toggleGifPicker() {
    if (!gifPicker) return;
    gifPicker.classList.toggle('active');
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
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}