// src/script.js
import { CHATGPT_AI } from './ai/chatgpt.js';
import { GEMINI_AI } from './ai/gemini.js';
import { GROK_AI } from './ai/grok.js';

// ===============================================
// CORE CONFIGURATION & STATE
// ===============================================

const LS_KEY_USER = 'lyntrixUser';
const LS_KEY_CHATS = 'lyntrixChatHistory';
const LS_KEY_THEME = 'lyntrixTheme';

const ALL_AIS = [CHATGPT_AI, GEMINI_AI, GROK_AI];
const CORRECTION_THRESHOLD = 0.8; // Koreksi jika perbedaan kata > 80%

let currentUser = null;
let chatHistory = [];
let isProcessing = false;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const usernameInput = document.getElementById('username-input');
const startChatBtn = document.getElementById('start-chat-btn');
const messagesContainer = document.getElementById('messages-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
const currentUsernameEl = document.getElementById('current-username');
const aiListContainer = document.getElementById('ai-list');
const arenaStatusEl = document.getElementById('arena-status');
const notifSound = document.getElementById('notif-sound');
const clearChatBtn = document.getElementById('clear-chat-btn');
const toggleThemeBtn = document.getElementById('toggle-theme-btn');

// ===============================================
// HELPER FUNCTIONS (LocalStorage & Time)
// ===============================================

function getFromLS(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
}

function saveToLS(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        if (key === LS_KEY_CHATS) {
            // Trigger storage event for cross-tab sync
            window.dispatchEvent(new Event('storage')); 
        }
    } catch (e) { console.error("Error saving to localStorage", e); }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

function getInitials(username) {
    return username ? username[0].toUpperCase() : 'U';
}

// Simple Text Similarity Check (Jaccard Index)
function checkSimilarity(text1, text2) {
    const set1 = new Set(text1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
    const set2 = new Set(text2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
    
    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

// ===============================================
// RENDERING & UI LOGIC
// ===============================================

function loadAndRenderMessages() {
    chatHistory = getFromLS(LS_KEY_CHATS) || [];
    messagesContainer.innerHTML = '';
    if (chatHistory.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>Selamat Datang di Lyntrix Multi-AI Arena!</h3>
                <p>Kirim satu pesan, dan saksikan perdebatan seru antara ChatGPT, Gemini, dan Grok.</p>
            </div>
        `;
    } else {
        chatHistory.forEach(msg => {
            messagesContainer.appendChild(createMessageBubble(msg));
        });
    }
    
    renderAIList();
    scrollToBottom();
}

function renderAIList() {
    aiListContainer.innerHTML = '';
    ALL_AIS.forEach(ai => {
        const item = document.createElement('div');
        item.classList.add('ai-item');
        item.innerHTML = `
            <div class="user-avatar" style="background-color: ${ai.color};">${ai.getInitials()}</div>
            <div class="ai-info">
                <div class="ai-name">${ai.name}</div>
                <div class="ai-status">
                    <span class="status-dot idle" data-status-id="${ai.id}"></span> 
                    <span data-status-text-id="${ai.id}">Idle</span>
                </div>
            </div>
        `;
        aiListContainer.appendChild(item);
    });
}

function createMessageBubble(message) {
    const isSelf = message.sender === currentUser;
    const aiDetails = ALL_AIS.find(a => a.name === message.sender);
    
    const row = document.createElement('div');
    row.classList.add('message-row', isSelf ? 'self' : 'ai');
    row.dataset.sender = message.sender;

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');

    if (!isSelf) {
        // AI Name
        const senderName = document.createElement('div');
        senderName.classList.add('message-sender');
        senderName.textContent = message.sender;
        bubble.appendChild(senderName);
    }
    
    // Main Text
    const textContent = document.createElement('div');
    textContent.classList.add('message-text');
    textContent.innerHTML = message.text;
    bubble.appendChild(textContent);
    
    // Correction/Debate
    if (message.correction) {
        const correctionEl = document.createElement('div');
        correctionEl.classList.add('correction-message');
        correctionEl.innerHTML = `<strong>DEBATE:</strong> ${message.correction}`;
        bubble.appendChild(correctionEl);
    }

    // Time
    const time = document.createElement('span');
    time.classList.add('message-time');
    time.textContent = formatTime(message.timestamp);
    bubble.appendChild(time);
    
    row.appendChild(bubble);

    if (message.isNew && !isSelf) {
        playSound(); // Play sound for new AI messages
    }
    
    return row;
}

function updateAIStatus(id, status) {
    const dot = document.querySelector(`.status-dot[data-status-id="${id}"]`);
    const text = document.querySelector(`span[data-status-text-id="${id}"]`);
    const arena = document.getElementById('arena-status');

    if (dot && text) {
        dot.classList.remove('idle', 'thinking');
        if (status === 'thinking') {
            dot.classList.add('thinking');
            text.textContent = 'Menjawab...';
            arena.textContent = 'AI Sedang Bekerja...';
            arena.classList.add('working');
        } else {
            dot.classList.add('idle');
            text.textContent = 'Idle';
            arena.textContent = 'Siap bertarung 🥊';
            arena.classList.remove('working');
        }
    }
}

function playSound() {
    if (notifSound) {
        notifSound.currentTime = 0;
        notifSound.play().catch(e => console.log('Autoplay blocked (expected).', e));
    }
}

// ===============================================
// MAIN APPLICATION LOGIC
// ===============================================

function initializeApp() {
    currentUser = getFromLS(LS_KEY_USER);
    const savedTheme = getFromLS(LS_KEY_THEME) || 'dark';

    if (currentUser) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        currentUsernameEl.textContent = currentUser;
        sidebarUserAvatar.textContent = getInitials(currentUser);
        setTheme(savedTheme);
        loadAndRenderMessages();
    } else {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }

    // Event Listeners
    startChatBtn.addEventListener('click', handleLogin);
    sendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
    window.addEventListener('storage', loadAndRenderMessages);
    clearChatBtn.addEventListener('click', clearChatHistory);
    toggleThemeBtn.addEventListener('click', toggleTheme);
}

function handleLogin() {
    const inputVal = usernameInput.value.trim();
    if (inputVal && inputVal.length >= 2) {
        currentUser = inputVal;
        saveToLS(LS_KEY_USER, currentUser);
        initializeApp(); 
    } else {
        alert("Nama pengguna minimal 2 karakter!");
    }
}

async function handleSendMessage() {
    if (isProcessing) return;

    const text = chatInput.value.trim();
    if (!text) return;
    
    isProcessing = true;
    sendBtn.disabled = true;
    chatInput.value = '';

    // 1. Tambahkan pesan User
    const userMessage = {
        id: Date.now().toString() + "-user",
        sender: currentUser,
        text: text,
        timestamp: Date.now(),
        isNew: false
    };
    
    chatHistory.push(userMessage);
    saveToLS(LS_KEY_CHATS, chatHistory);
    loadAndRenderMessages();

    // 2. Kirim ke semua AI secara paralel
    const promises = ALL_AIS.map(ai => {
        updateAIStatus(ai.id, 'thinking');
        return ai.fetchResponse(text, chatHistory);
    });

    const results = await Promise.all(promises);

    // 3. Tambahkan pesan AI ke history
    const aiResponses = [];
    results.forEach((response, index) => {
        const ai = ALL_AIS[index];
        updateAIStatus(ai.id, 'idle');
        
        const aiMessage = {
            id: Date.now().toString() + "-" + ai.id,
            sender: ai.name,
            text: response,
            timestamp: Date.now() + index, // Sedikit perbedaan waktu untuk ordering
            isNew: true,
            correction: null 
        };
        aiResponses.push(aiMessage);
        chatHistory.push(aiMessage);
    });
    
    // 4. Proses Koreksi/Debat
    processCorrections(aiResponses);

    saveToLS(LS_KEY_CHATS, chatHistory);
    loadAndRenderMessages(); 

    isProcessing = false;
    sendBtn.disabled = false;
    arenaStatusEl.textContent = 'Siap bertarung 🥊';
}

function processCorrections(responses) {
    // Hanya proses koreksi jika ada lebih dari 1 AI
    if (responses.length < 2) return;

    for (let i = 0; i < responses.length; i++) {
        const currentMsg = responses[i];
        
        for (let j = 0; j < responses.length; j++) {
            if (i === j) continue;
            
            const otherMsg = responses[j];
            const similarity = checkSimilarity(currentMsg.text, otherMsg.text);

            // Jika ada perbedaan signifikan (> 80% kata berbeda)
            if (similarity < CORRECTION_THRESHOLD) {
                // Tambahkan pesan koreksi ke pesan yang berbeda (currentMsg)
                const correctionText = `AI ${otherMsg.sender} memberikan jawaban yang berbeda. Periksa kembali jawaban ini dengan detail AI ${otherMsg.sender}.`;

                const historyIndex = chatHistory.findIndex(m => m.id === currentMsg.id);
                if (historyIndex !== -1 && !chatHistory[historyIndex].correction) {
                    chatHistory[historyIndex].correction = correctionText;
                    // Hanya butuh satu koreksi per pesan
                    break; 
                }
            }
        }
    }
}

function clearChatHistory() {
    if (confirm("Yakin ingin menghapus SEMUA riwayat chat di Arena?")) {
        chatHistory = [];
        saveToLS(LS_KEY_CHATS, chatHistory);
        loadAndRenderMessages();
    }
}

function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    saveToLS(LS_KEY_THEME, theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    setTheme(isDark ? 'light' : 'dark');
}

// START UP
initializeApp();
