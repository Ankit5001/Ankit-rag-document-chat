const chatBox = document.getElementById('chat-box');
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const fileInput = document.getElementById('file-upload');
const fileNameBadge = document.getElementById('file-name');
const historyList = document.getElementById('history-list');

// 1. Show filename when selected
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameBadge.textContent = fileInput.files[0].name;
        fileNameBadge.style.display = "inline-block";
    }
});

// 2. Load History on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    loadHistory();
});

async function loadHistory() {
    try {
        const response = await fetch('/history');
        const history = await response.json();
        
        historyList.innerHTML = '';

        history.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            // Safety: Handle null or empty messages
            let safeUserMsg = "New Chat";
            if (chat.user_message) {
                safeUserMsg = chat.user_message.substring(0, 25);
            }
            
            item.innerHTML = `
                <div class="history-text">
                    <i class="far fa-message"></i> 
                    <span>${safeUserMsg}...</span>
                </div>
                <i class="fas fa-trash delete-btn" data-id="${chat.id}"></i>
            `;

            // Click Item -> Load Chat
            item.onclick = () => {
                chatBox.innerHTML = '';
                // Safety: Ensure no "null" is passed to appendMessage
                const safeAiResponse = chat.ai_response || "";
                const safeUserMsg = chat.user_message || "";
                
                appendMessage(safeUserMsg, 'user');
                appendMessage(safeAiResponse, 'ai');
            };

            // Click Trash -> Delete Chat
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.onclick = async (e) => {
                e.stopPropagation(); // Prevent loading the chat
                if(confirm("Delete this chat permanently?")) {
                    await deleteChat(chat.id);
                    loadHistory();
                }
            };

            historyList.appendChild(item);
        });
    } catch (error) {
        console.error("Failed to load history:", error);
    }
}

async function deleteChat(chatId) {
    try {
        await fetch(`/delete/${chatId}`, { method: 'DELETE' });
    } catch (error) {
        console.error("Error deleting chat:", error);
    }
}

// 3. Handle Form Submit
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const questionInput = document.getElementById('question');
    const question = questionInput.value;

    if (!fileInput.files[0] && document.querySelectorAll('.message.user').length === 0) {
        alert("Please attach a PDF document to start!");
        return;
    }

    appendMessage(question, 'user');
    questionInput.value = '';

    const loadingId = appendLoading();

    const formData = new FormData();
    formData.append('question', question);
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }

    try {
        const response = await fetch('/ask-pdf', {
            method: 'POST',
            body: formData
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Remove Loading Bubble
        if(document.getElementById(loadingId)) {
            document.getElementById(loadingId).remove();
        }

        // Create AI Bubble
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai';
        msgDiv.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content"></div> 
        `;
        chatBox.appendChild(msgDiv);
        const contentDiv = msgDiv.querySelector('.message-content');

        // Stream Loop
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            if (text) {
                contentDiv.innerHTML += text.replace(/\n/g, '<br>');
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
        
        loadHistory(); // Refresh sidebar to show new chat

    } catch (error) {
        if(document.getElementById(loadingId)) {
            document.getElementById(loadingId).remove();
        }
        console.error(error);
        appendMessage("Error: Could not connect to server.", 'ai');
    }
});

// Helper: Append Message
function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const avatar = sender === 'user' ? '<i class="far fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    // Safety: Convert null/undefined to empty string
    const safeText = text ? text : ""; 
    const formattedText = safeText.replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="message-content">${formattedText}</div>
    `;
    
    chatBox.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Helper: Loading Animation
function appendLoading() {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ai`;
    const id = `loading-${Date.now()}`;
    msgDiv.id = id;
    msgDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    chatBox.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
}