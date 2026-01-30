import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, Request, Depends
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# ---- DATABASE ----
from database import engine, get_db
import models

# ---- LANGCHAIN CORE & COMMUNITY ----
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS

# LCEL Imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

load_dotenv()

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    chats = db.query(models.ChatHistory).order_by(models.ChatHistory.id.desc()).all()
    return chats

# Helper function to format documents
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

@app.post("/ask-pdf")
async def ask_pdf(
    file: UploadFile = File(...),
    question: str = Form(...),
    db: Session = Depends(get_db)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    async def response_generator():
        try:
            # 1. Load PDF
            loader = PyPDFLoader(temp_path)
            documents = loader.load()

            # 2. Split Text
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
            chunks = splitter.split_documents(documents)

            # 3. Vector Store
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            vector_db = FAISS.from_documents(chunks, embeddings)
            retriever = vector_db.as_retriever()

            # 4. LLM
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

            # 5. Prompt
            template = """You are an assistant for question-answering tasks. 
            Use the following pieces of retrieved context to answer the question. 
            If you don't know the answer, just say that you don't know.

            Context: {context}

            Question: {question}
            """
            prompt = ChatPromptTemplate.from_template(template)

            # 6. Build Chain (LCEL)
            rag_chain = (
                {"context": retriever | format_docs, "question": RunnablePassthrough()}
                | prompt
                | llm
                | StrOutputParser()
            )

            # 7. Stream the answer
            accumulated_answer = ""
            async for chunk in rag_chain.astream(question):
                accumulated_answer += chunk
                yield chunk  # Send word-by-word

            # 8. Save to Database
            new_chat = models.ChatHistory(
                user_message=question,
                ai_response=accumulated_answer
            )
            db.add(new_chat)
            db.commit()

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    return StreamingResponse(response_generator(), media_type="text/plain")

# --- DELETE ENDPOINT (MOVED OUTSIDE) ---
@app.delete("/delete/{chat_id}")
async def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    # Find the chat by ID
    chat = db.query(models.ChatHistory).filter(models.ChatHistory.id == chat_id).first()
    
    if chat:
        db.delete(chat)
        db.commit()
        return {"status": "success", "message": "Chat deleted"}
    
    return {"status": "error", "message": "Chat not found"}