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
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
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

// User credentials
const users = {
    'm': { password: 'm', avatar: 'm.jpg', name: 'Aaro' },
    'rinu': { password: 'rinu123', avatar: 'r.jpg', name: 'Rinzzz' }
};

// Current user
let currentUser = null;
let otherUser = null;
let authToken = null;

// Emoji list
const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🫣', '🤗', '🫡', '🤔', '🫢', '🤭', '🤫', '🤥', '😶', '🫠', '😐', '🫤', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🫥', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Generate emoji picker
    generateEmojiPicker();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        currentUser = userData.username;
        otherUser = userData.otherUser;
        authToken = userData.authToken;
        
        // Update UI with user info
        currentUserAvatar.src = users[currentUser].avatar;
        currentUserName.textContent = users[currentUser].name;
        
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
});

// Set up all event listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleMessageKeypress);
    emojiBtn.addEventListener('click', toggleEmojiPicker);
    menuBtn.addEventListener('click', toggleExportMenu);
    exportHtml.addEventListener('click', () => exportChats('html'));
    exportTxt.addEventListener('click', () => exportChats('text'));
    
    // Close emoji picker and export menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.classList.remove('active');
        }
        
        if (!menuBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.classList.remove('active');
        }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (users[username] && users[username].password === password) {
        // For demo purposes, we're using a simple auth token
        // In a real app, you'd get this from your backend after successful login
        authToken = btoa('oursecretplace:sharedpassword123');
        currentUser = username;
        otherUser = username === 'moham' ? 'rina' : 'moham';
        
        // Save user data to localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            username: currentUser,
            otherUser: otherUser,
            authToken: authToken
        }));
        
        // Update UI with user info
        currentUserAvatar.src = users[username].avatar;
        currentUserName.textContent = users[username].name;
        
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

// Generate emoji picker
function generateEmojiPicker() {
    emojiPicker.innerHTML = '';
    emojis.forEach(emoji => {
        const emojiElement = document.createElement('span');
        emojiElement.classList.add('emoji');
        emojiElement.textContent = emoji;
        emojiElement.addEventListener('click', () => {
            messageInput.value += emoji;
            messageInput.focus();
        });
        emojiPicker.appendChild(emojiElement);
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
    }, 1000);
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
    
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (msg.sender === currentUser) {
            messageElement.classList.add('outgoing');
        } else {
            messageElement.classList.add('incoming');
        }
        
        const decryptedText = decryptMessage(msg.text);
        
        messageElement.innerHTML = `
            <div class="message-sender">${msg.sender === 'moham' ? 'Moham' : 'Rina'}</div>
            <div class="message-text">${decryptedText}</div>
            <div class="message-time">${formatTime(new Date(msg.timestamp))} <span class="message-status">${msg.status || '✓✓'}</span></div>
        `;
        
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
            loadMessages(); // Reload messages to include the new one
            
            // Simulate response after a delay
            setTimeout(() => {
                simulateResponse();
            }, 2000);
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

// Toggle emoji picker
function toggleEmojiPicker() {
    emojiPicker.classList.toggle('active');
}

// Toggle export menu
function toggleExportMenu() {
    if (currentUser === 'moham') {
        exportMenu.classList.toggle('active');
    }
}

// Export chats
function exportChats(format) {
    // For demo purposes, we'll use the sample messages
    // In a real app, you would fetch the actual messages from the backend
    const messages = JSON.parse(localStorage.getItem('rina_mel_chat_messages')) || [];
    
    let content = '';
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    
    if (format === 'html') {
        content = `<!DOCTYPE html><html><head><title>Chat Export - ${date}</title><meta charset="UTF-8"></head><body>`;
        content += `<h1>Rina Mel Chat Export - ${date}</h1>`;
        
        messages.forEach(msg => {
            const decryptedText = decryptMessage(msg.text);
            content += `<p><strong>${msg.sender} (${formatTime(new Date(msg.timestamp))}):</strong> ${decryptedText}</p>`;
        });
        
        content += `</body></html>`;
    } else {
        content = `Rina Mel Chat Export - ${date}\n\n`;
        
        messages.forEach(msg => {
            const decryptedText = decryptMessage(msg.text);
            content += `${msg.sender} (${formatTime(new Date(msg.timestamp))}): ${decryptedText}\n`;
        });
    }
    
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rina_mel_chat_export_${date}.${format === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Chats exported as ${format.toUpperCase()}`);
    exportMenu.classList.remove('active');
}

// Start polling for new messages
function startMessagePolling() {
    // Poll for new messages every 5 seconds
    setInterval(() => {
        loadMessages();
    }, 5000);
    
    // Simulate online status changes
    setInterval(() => {
        const isOnline = Math.random() > 0.3; // 70% chance online
        
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