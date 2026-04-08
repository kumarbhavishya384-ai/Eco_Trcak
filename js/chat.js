/* EcoTrack AI - Intelligent Carbon Assistant */

class EcoChat {
    constructor() {
        this.isOpen = false;
        this.messages = [
            { role: 'assistant', text: t('chat_welcome_msg', 'Hi! I am your EcoAssistant. You can tell me things like "I drove 15km in a petrol car today" or "I had a chicken biryani" and I will log it for you! 🌿') }
        ];
        this.initUI();
    }

    initUI() {
        const chatHTML = `
            <div id="ecoChatContainer" class="eco-chat-container">
                <div id="ecoChatWindow" class="eco-chat-window hidden">
                    <div class="chat-header">
                        <div class="header-info">
                            <span class="bot-icon">🤖</span>
                            <div>
                                <h4>${t('chat_bot_name', 'EcoAssistant')}</h4>
                                <span class="status-dot"></span> <small>${t('chat_online', 'Online')}</small>
                            </div>
                        </div>
                        <button onclick="ecoAssistant.toggle()" class="close-chat">×</button>
                    </div>
                    <div id="chatMessages" class="chat-messages"></div>
                    <div class="chat-input-area">
                        <input type="text" id="chatInput" placeholder="${t('chat_placeholder', 'How did you travel today?')}" onkeypress="if(event.key==='Enter') ecoAssistant.sendMessage()">
                        <button onclick="ecoAssistant.startVoice()" class="voice-btn" title="Voice Input">🎤</button>
                        <button onclick="ecoAssistant.sendMessage()" class="send-btn">➔</button>
                    </div>
                </div>
                <button id="chatToggleBtn" class="chat-toggle-btn" onclick="ecoAssistant.toggle()">
                    <span class="toggle-icon">💬</span>
                </button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .eco-chat-container { position: fixed; bottom: 8rem; right: 2rem; z-index: 10001; font-family: 'Inter', sans-serif; }
            .chat-toggle-btn { width: 65px; height: 65px; border-radius: 50%; background: var(--primary); border: 2px solid rgba(255,255,255,0.2); cursor: pointer; color: white; font-size: 1.8rem; box-shadow: 0 10px 30px rgba(0,212,170,0.4); transition: 0.3s; display: flex; align-items: center; justify-content: center; }
            .chat-toggle-btn:hover { transform: scale(1.1) rotate(-5deg); filter: brightness(1.1); box-shadow: 0 15px 40px rgba(0,212,170,0.6); }
            
            .eco-chat-window { position: absolute; bottom: 85px; right: 0; width: 370px; height: 550px; background: var(--card-bg); border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 25px 60px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .eco-chat-window.hidden { display: none; }
            
            .chat-header { padding: 1.25rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; justify-content: space-between; align-items: center; color: white; }
            .header-info { display: flex; align-items: center; gap: 0.75rem; }
            .bot-icon { background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 50%; font-size: 1.2rem; }
            .status-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; display: inline-block; margin-right: 4px; }
            .close-chat { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; opacity: 0.7; transition: 0.2s; }
            .close-chat:hover { opacity: 1; }
            
            .chat-messages { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; scroll-behavior: smooth; }
            .message { max-width: 85%; padding: 0.75rem 1rem; border-radius: 15px; font-size: 0.9rem; line-height: 1.4; }
            .message.assistant { align-self: flex-start; background: rgba(255,255,255,0.05); color: var(--text-primary); border-bottom-left-radius: 2px; }
            .message.user { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 2px; }
            
            .chat-input-area { padding: 1rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; background: rgba(255,255,255,0.02); }
            #chatInput { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 10px; padding: 0.6rem 0.8rem; color: white; font-size: 0.9rem; outline: none; }
            #chatInput:focus { border-color: var(--primary); }
            .voice-btn, .send-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; transition: 0.2s; filter: opacity(0.7); }
            .voice-btn:hover, .send-btn:hover { filter: opacity(1); transform: scale(1.1); }
            
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.innerHTML = chatHTML;
        document.body.appendChild(div);
        this.renderMessages();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        document.getElementById('ecoChatWindow').classList.toggle('hidden');
        if (this.isOpen) {
            document.getElementById('chatInput').focus();
            this.scrollToBottom();
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        input.value = '';

        // Add loading bubble
        const loadingId = 'loading-' + Date.now();
        this.addMessage('assistant', '<div class="loading-spinner"></div>', loadingId);

        try {
            const data = await apiFetch('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: text, lang: typeof currentLang !== 'undefined' ? currentLang : 'en' })
            });

            document.getElementById(loadingId).remove();

            if (data.success) {
                this.addMessage('assistant', data.response);
                if (data.autoLog) {
                    showGlobalToast(`✅ ${t('ai_autologged', 'AI Auto-Logged')}: ${data.detail}`);
                    // Trigger custom event for other components if needed
                    window.dispatchEvent(new CustomEvent('aiLogSync'));
                }
            } else {
                this.addMessage('assistant', data.response || data.message || "I'm having a moment! Please try again. 🌿");
            }
        } catch (err) {
            document.getElementById(loadingId)?.remove();
            // Show friendly error and still respond helpfully
            const errMsg = err.message || '';
            if (errMsg.includes('5050') || errMsg.includes('fetch')) {
                this.addMessage('assistant', "⚡ The AI backend is warming up. Please try again in a moment!");
            } else {
                this.addMessage('assistant', "🌿 I'm having a moment! Try asking me again — I'm here to help log your carbon footprint.");
            }
        }
    }

    addMessage(role, text, id = null) {
        const msg = { role, text };
        this.messages.push(msg);
        const div = document.createElement('div');
        div.className = `message ${role}`;
        if (id) div.id = id;
        div.innerHTML = text;
        document.getElementById('chatMessages').appendChild(div);
        this.scrollToBottom();
    }

    renderMessages() {
        const container = document.getElementById('chatMessages');
        container.innerHTML = this.messages.map(m => `
            <div class="message ${m.role}">${m.text}</div>
        `).join('');
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }

    startVoice() {
        if (!('webkitSpeechRecognition' in window)) {
            showGlobalToast(t('voice_not_supported', 'Voice recognition not supported in this browser.'));
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.lang = (typeof currentLang !== 'undefined' && currentLang === 'hi') ? 'hi-IN' : (typeof currentLang !== 'undefined' && currentLang === 'bn') ? 'bn-IN' : (typeof currentLang !== 'undefined' && currentLang === 'ta') ? 'ta-IN' : 'en-IN';
        recognition.onstart = () => {
            document.querySelector('.voice-btn').style.color = 'var(--primary)';
            showGlobalToast(t('listening', 'Listening...') + ' 🎤');
        };
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('chatInput').value = text;
            this.sendMessage();
        };
        recognition.onend = () => {
            document.querySelector('.voice-btn').style.color = '';
        };
        recognition.start();
    }
}

let ecoAssistant;
document.addEventListener('DOMContentLoaded', () => {
    ecoAssistant = new EcoChat();
});
