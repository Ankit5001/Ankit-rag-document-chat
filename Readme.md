# 📄 Intelligent AI Document Assistant

A full-stack **RAG (Retrieval-Augmented Generation)** application that allows users to upload PDF documents and chat with them in real-time. Built with **FastAPI**, **LangChain**, **PostgreSQL**, and a modern **WhatsApp-style UI**.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Features

- **📄 PDF Analysis**: Upload any PDF and instantly ask questions about its content.
- **💬 Real-Time Streaming**: AI responses type out token-by-token (Typewriter effect) using Server-Sent Events (SSE).
- **💾 Chat History**: All conversations are saved persistently in a **PostgreSQL** database.
- **🎨 Modern UI**: Fully responsive, WhatsApp-style interface with distinct user/AI bubbles.
- **🧠 Advanced RAG**: Uses **FAISS** vector store and **OpenAI GPT-4o-mini** for accurate, context-aware answers.

---

## 🛠️ Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- LangChain
- FAISS
- OpenAI API (GPT-4o-mini)

### Frontend
- HTML5 / CSS3
- Vanilla JavaScript

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Ankit5001/Ankit-rag-document-chat.git
cd AI-Document-Classifier
```

### 2. Set Up Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install fastapi "uvicorn[standard]" python-multipart sqlalchemy psycopg2-binary \
langchain langchain-community langchain-openai faiss-cpu pypdf python-dotenv jinja2
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:yourpassword@localhost/rag_db
```

### 5. Database Setup
```sql
CREATE DATABASE rag_db;
```

Tables are created automatically by SQLAlchemy at runtime.

---

## 🏃‍♂️ Running the Application
```bash
uvicorn main:app --reload
```

If that fails:
```bash
python -m uvicorn main:app --reload
```

Open: http://127.0.0.1:8000

---

## 📂 Project Structure
```text
AI-Document-Classifier/
│
├── static/
│   ├── style.css
│   └── script.js
│
├── templates/
│   └── index.html
│
├── database.py
├── models.py
├── main.py
├── requirements.txt
├── .env
└── README.md
```

---

## 📸 Usage

1. Upload a PDF using the 📎 icon
2. Ask questions in the chat bar
3. Watch responses stream in real-time
4. Refresh to view saved chat history

---

## 🤝 Contributing

1. Fork the repository  
2. Create a feature branch  
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes  
   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push to branch  
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request
