// Backend API URL
const API_BASE_URL = 'https://rinamil-5a961b6d4ed7.herokuapp.com';
let usingBackend = false;

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
    'https://media.giphy.com/media/l0HlG8vJXW0X5yX4s/giphy.gif'
];

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
    
    // Populate GIF picker
    populateGifPicker();
}

// Test backend connection
async function testBackendConnection() {
    try {
        connectionStatus.textContent = "Testing connection...";
        connectionStatus.style.display = "block";
        
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            connectionStatus.textContent = "Connected to backend";
            connectionStatus.style.backgroundColor = "rgba(34, 197, 94, 0.7)";
            usingBackend = true;
            
            setTimeout(() => {
                connectionStatus.style.display = "none";
            }, 2000);
        } else {
            throw new Error('Backend not available');
        }
    } catch (error) {
        console.error("Backend connection failed:", error);
        connectionStatus.textContent = "Using local storage only";
        connectionStatus.style.backgroundColor = "rgba(245, 158, 11, 0.7)";
        usingBackend = false;
        
        setTimeout(() => {
            connectionStatus.style.display = "none";
        }, 2000);
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

// Load messages from backend or local storage
async function loadMessages() {
    try {
        if (usingBackend) {
            const response = await fetch(`${API_BASE_URL}/messages`, {
                headers: {
                    'Authorization': `Basic ${authToken}`
                }
            });
            
            if (response.ok) {
                const serverMessages = await response.json();
                messages = serverMessages;
                // Save to localStorage as backup
                localStorage.setItem('chatMessages', JSON.stringify(messages));
            } else {
                throw new Error('Failed to load messages from server');
            }
        } else {
            // Fallback to localStorage
            const savedMessages = localStorage.getItem('chatMessages');
            if (savedMessages) {
                messages = JSON.parse(savedMessages);
            }
        }
        
        renderMessages(messages);
        
        // Check for new messages to show notifications
        checkForNewMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        
        // Fallback to localStorage
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            messages = JSON.parse(savedMessages);
            renderMessages(messages);
        }
        
        showNotification('Using offline mode. Messages stored locally.');
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
                <div class="message-sender">${users[msg.sender].name}</div>
                <img src="${gifUrl}" alt="GIF">
                <div class="message-time">${formatTime(new Date(msg.timestamp))} <span class="message-status">${msg.status || '✓✓'}</span></div>
            `;
        } else {
            const decryptedText = decryptMessage(msg.text);
            messageElement.innerHTML = `
                <div class="message-sender">${users[msg.sender].name}</div>
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
        timestamp: now.getTime(),
        status: '✓✓' // Delivered status
    };
    
    try {
        if (usingBackend) {
            const response = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${authToken}`
                },
                body: JSON.stringify(message)
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message to server');
            }
        }
        
        // Add message to local array
        messages.push(message);
        
        // Save to localStorage
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        
        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Render messages
        renderMessages(messages);
        
        // Simulate response after a delay
        simulateResponse();
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Fallback to local storage
        messages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        
        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Render messages
        renderMessages(messages);
        
        // Simulate response after a delay
        simulateResponse();
        
        showNotification('Message saved locally (offline mode)');
    }
}

// Simulate response from other user
function simulateResponse() {
    // Only simulate if the other user is Rinu
    if (otherUser === 'rinu') {
        setTimeout(() => {
            const responses = [
                "Hey there! How are you?",
                "I'm doing great! Thanks for asking.",
                "What have you been up to?",
                "That sounds interesting!",
                "I miss you too!",
                "Can't wait to see you again!",
                "Thanks for the message!",
                "You're the best! 💖"
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            const encryptedText = encryptMessage(randomResponse);
            const now = new Date();
            
            const message = {
                sender: otherUser,
                text: encryptedText,
                timestamp: now.getTime(),
                status: '✓✓✓' // Read status
            };
            
            // Add message to array
            messages.push(message);
            
            // Save to localStorage
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            
            // Render messages
            renderMessages(messages);
            
            // Show notification
            showNotification(`New message from ${users[otherUser].name}`);
            
        }, 2000 + Math.random() * 5000); // Random delay between 2-7 seconds
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
        renderMessages(messages);
    }
}

// Handle search
function handleSearch() {
    renderMessages(messages);
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

// Populate GIF picker
function populateGifPicker() {
    if (!gifPicker) return;
    
    gifPicker.innerHTML = '';
    
    popularGifs.forEach(gifUrl => {
        const gifItem = document.createElement('div');
        gifItem.classList.add('gif-item');
        gifItem.innerHTML = `<img src="${gifUrl}" alt="GIF">`;
        gifItem.addEventListener('click', () => sendGif(gifUrl));
        gifPicker.appendChild(gifItem);
    });
}

// Send GIF
function sendGif(gifUrl) {
    const now = new Date();
    
    const message = {
        sender: currentUser,
        text: `GIF:${gifUrl}`,
        timestamp: now.getTime(),
        status: '✓✓' // Delivered status
    };
    
    // Add message to array
    messages.push(message);
    
    // Save to localStorage
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // Render messages
    renderMessages(messages);
    
    // Hide GIF picker
    gifPicker.classList.remove('active');
    
    // Try to send to backend
    if (usingBackend) {
        fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`
            },
            body: JSON.stringify(message)
        }).catch(error => {
            console.error('Failed to send GIF to server:', error);
        });
    }
    
    // Simulate response after a delay
    simulateGifResponse();
}

// Simulate GIF response from other user
function simulateGifResponse() {
    // Only simulate if the other user is Rinu
    if (otherUser === 'rinu') {
        setTimeout(() => {
            const responseGifs = [
                'https://media.giphy.com/media/3o7aTskHEUdgCQAXde/giphy.gif',
                'https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif',
                'https://media.giphy.com/media/3o7aTskHEUdgCQAXde/giphy.gif',
                'https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif',
                'https://media.giphy.com/media/3o7TKtbdpC5MnaYz8A/giphy.gif'
            ];
            
            const randomGif = responseGifs[Math.floor(Math.random() * responseGifs.length)];
            const now = new Date();
            
            const message = {
                sender: otherUser,
                text: `GIF:${randomGif}`,
                timestamp: now.getTime(),
                status: '✓✓✓' // Read status
            };
            
            // Add message to array
            messages.push(message);
            
            // Save to localStorage
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            
            // Render messages
            renderMessages(messages);
            
            // Show notification
            showNotification(`${users[otherUser].name} sent a GIF`);
            
            // Try to send to backend
            if (usingBackend) {
                fetch(`${API_BASE_URL}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${authToken}`
                    },
                    body: JSON.stringify(message)
                }).catch(error => {
                    console.error('Failed to send GIF response to server:', error);
                });
            }
            
        }, 3000 + Math.random() * 4000); // Random delay between 3-7 seconds
    }
}

// Export chats
function exportChats(format) {
    let exportData = '';
    
    if (format === 'html') {
        exportData = '<!DOCTYPE html><html><head><title>Chat Export</title><style>body{font-family: Arial, sans-serif; margin: 20px; background: #0f172a; color: #f1f5f9;} .message{margin-bottom: 15px; padding: 10px; border-radius: 10px; max-width: 70%;} .outgoing{background: linear-gradient(135deg, #6e8efb, #a777e3); margin-left: auto; color: white; text-align: right;} .incoming{background: #334155; color: #f1f5f9;} .time{font-size: 12px; color: #94a3b8; margin-top: 5px;} .sender{font-weight: bold; margin-bottom: 5px;} .gif-container{max-width: 250px;}</style></head><body>';
        exportData += `<h1 style="color: #f1f5f9;">Chat between ${users[currentUser].name} and ${users[otherUser].name}</h1>`;
        
        messages.forEach(msg => {
            const time = formatTime(new Date(msg.timestamp));
            const isOutgoing = msg.sender === currentUser;
            
            if (msg.text.startsWith('GIF:')) {
                const gifUrl = msg.text.substring(4);
                exportData += `
                    <div class="message ${isOutgoing ? 'outgoing' : 'incoming'}">
                        <div class="sender">${users[msg.sender].name}</div>
                        <div class="gif-container">
                            <img src="${gifUrl}" alt="GIF" style="max-width: 100%; border-radius: 8px;">
                        </div>
                        <div class="time">${time}</div>
                    </div>
                `;
            } else {
                const decryptedText = decryptMessage(msg.text);
                exportData += `
                    <div class="message ${isOutgoing ? 'outgoing' : 'incoming'}">
                        <div class="sender">${users[msg.sender].name}</div>
                        <div class="text">${decryptedText}</div>
                        <div class="time">${time}</div>
                    </div>
                `;
            }
        });
        
        exportData += '</body></html>';
    } else if (format === 'text') {
        exportData = `Chat between ${users[currentUser].name} and ${users[otherUser].name}\n\n`;
        
        messages.forEach(msg => {
            const time = formatTime(new Date(msg.timestamp));
            const sender = users[msg.sender].name;
            
            if (msg.text.startsWith('GIF:')) {
                exportData += `[${time}] ${sender}: [Sent a GIF]\n`;
            } else {
                const decryptedText = decryptMessage(msg.text);
                exportData += `[${time}] ${sender}: ${decryptedText}\n`;
            }
        });
    }
    
    // Create download link
    const blob = new Blob([exportData], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rinamil_chat_${new Date().toISOString().split('T')[0]}.${format === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Hide export menu
    exportMenu.classList.remove('active');
    
    showNotification(`Chat exported as ${format.toUpperCase()}`);
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
        
        if (statusIndicator && statusText) {
            if (isOnline) {
                statusIndicator.classList.remove('offline');
                statusIndicator.classList.add('online');
                statusText.textContent = 'Online';
            } else {
                statusIndicator.classList.remove('online');
                statusIndicator.classList.add('offline');
                statusText.textContent = 'Offline';
            }
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

// Handle file attachment
if (document.getElementById('attachment-btn')) {
    document.getElementById('attachment-btn').addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '*/*';
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    alert('File size too large. Maximum size is 10MB.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    const now = new Date();
                    const message = {
                        sender: currentUser,
                        text: `FILE:${file.name}:${event.target.result}`,
                        timestamp: now.getTime(),
                        status: '✓✓',
                        file: {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: event.target.result
                        }
                    };
                    
                    // Add message to array
                    messages.push(message);
                    
                    // Save to localStorage
                    localStorage.setItem('chatMessages', JSON.stringify(messages));
                    
                    // Render messages
                    renderMessages(messages);
                    
                    // Try to send to backend
                    if (usingBackend) {
                        fetch(`${API_BASE_URL}/messages`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Basic ${authToken}`
                            },
                            body: JSON.stringify(message)
                        }).catch(error => {
                            console.error('Failed to send file to server:', error);
                        });
                    }
                    
                    showNotification('File sent');
                    
                    // Simulate file response
                    simulateFileResponse();
                };
                reader.readAsDataURL(file);
            }
        });
        fileInput.click();
    });
}

// Simulate file response from other user
function simulateFileResponse() {
    // Only simulate if the other user is Rinu
    if (otherUser === 'rinu') {
        setTimeout(() => {
            const responses = [
                "Thanks for the file!",
                "I got your file, thank you!",
                "This file is great, thanks!",
                "I'll check out this file later.",
                "Appreciate you sending this over!"
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            const encryptedText = encryptMessage(randomResponse);
            const now = new Date();
            
            const message = {
                sender: otherUser,
                text: encryptedText,
                timestamp: now.getTime(),
                status: '✓✓✓' // Read status
            };
            
            // Add message to array
            messages.push(message);
            
            // Save to localStorage
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            
            // Render messages
            renderMessages(messages);
            
            // Try to send to backend
            if (usingBackend) {
                fetch(`${API_BASE_URL}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${authToken}`
                    },
                    body: JSON.stringify(message)
                }).catch(error => {
                    console.error('Failed to send response to server:', error);
                });
            }
            
            // Show notification
            showNotification(`New message from ${users[otherUser].name}`);
            
        }, 3000 + Math.random() * 4000); // Random delay between 3-7 seconds
    }
}

// Handle profile picture editing (if elements exist)
if (document.getElementById('edit-avatar-btn')) {
    document.getElementById('edit-avatar-btn').addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Update avatar preview
                    if (currentUserAvatar) {
                        currentUserAvatar.src = event.target.result;
                    }
                    
                    // Save to localStorage
                    localStorage.setItem(`${currentUser}-avatar`, event.target.result);
                    
                    showNotification('Profile picture updated');
                };
                reader.readAsDataURL(file);
            }
        });
        fileInput.click();
    });
}