const form = document.getElementById('queryForm');
const chatBox = document.getElementById('chatBox');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('pdfFile');
    const questionInput = document.getElementById('question');
    const sendBtn = document.getElementById('sendBtn');

    // Display user message
    const userMsg = questionInput.value;
    appendMessage('user-msg', userMsg);
    
    // Preparation for API call
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('question', userMsg);

    questionInput.value = '';
    sendBtn.disabled = true;
    const loadingMsg = appendMessage('bot-msg', 'Thinking...');

    try {
        const response = await fetch('/ask-pdf', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        loadingMsg.innerText = data.answer;
    } catch (error) {
        loadingMsg.innerText = "Error: Could not reach the server.";
    } finally {
        sendBtn.disabled = false;
    }
});

function appendMessage(className, text) {
    const msgDiv = document.createElement('p');
    msgDiv.className = className;
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}