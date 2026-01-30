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
    try {
        const response = await fetch('/history');
        const history = await response.json();
        
        // Clear existing default list
        historyList.innerHTML = '';

        history.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'history-item';
            // Add an icon and the user message
            item.innerHTML = `<i class="far fa-message"></i> ${chat.user_message}`;
            
            // When clicked, load that specific chat into the main view
            item.onclick = () => {
                chatBox.innerHTML = ''; // Clear current screen
                appendMessage(chat.user_message, 'user');
                appendMessage(chat.ai_response, 'ai');
            };
            historyList.appendChild(item);
        });
    } catch (error) {
        console.error("Failed to load history:", error);
    }
});

// 3. Handle Form Submit (STREAMING LOGIC)
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const questionInput = document.getElementById('question');
    const question = questionInput.value;

    // Validation: Require file if it's the very first message
    if (!fileInput.files[0] && document.querySelectorAll('.message.user').length === 0) {
        alert("Please attach a PDF document to start!");
        return;
    }

    // UI: Show User Message immediately
    appendMessage(question, 'user');
    questionInput.value = ''; // Clear input

    // UI: Show "Thinking..." indicator
    const loadingId = appendLoading();

    // Prepare data to send
    const formData = new FormData();
    formData.append('question', question);
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }

    try {
        // Send request to backend
        const response = await fetch('/ask-pdf', {
            method: 'POST',
            body: formData
        });

        // --- KEY CHANGE: STREAMING HANDLER ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Remove the "Thinking..." bubble
        document.getElementById(loadingId).remove();

        // Create a new empty bubble for the AI response
        const aiMsgId = `ai-msg-${Date.now()}`;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai';
        msgDiv.id = aiMsgId;
        msgDiv.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content"></div> 
        `;
        chatBox.appendChild(msgDiv);
        const contentDiv = msgDiv.querySelector('.message-content');

        // Loop to read the stream chunk-by-chunk
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode raw bytes to text
            const text = decoder.decode(value, { stream: true });
            
            // Append new text to the bubble (convert newlines to HTML breaks)
            contentDiv.innerHTML += text.replace(/\n/g, '<br>');
            
            // Auto Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

    } catch (error) {
        // If error, remove loading and show error message
        if(document.getElementById(loadingId)) {
            document.getElementById(loadingId).remove();
        }
        console.error(error);
        appendMessage("Error: Could not connect to server.", 'ai');
    }
});

// Helper: Append a Static Message (User or History)
function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const avatar = sender === 'user' ? '<i class="far fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    // Safety check: ensure text is not null
    const formattedText = text ? text.replace(/\n/g, '<br>') : "";

    msgDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="message-content">${formattedText}</div>
    `;
    
    chatBox.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto scroll
}

// Helper: Create the "Thinking..." Animation
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