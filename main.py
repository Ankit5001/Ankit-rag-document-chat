import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv

# ---- LANGCHAIN (STABLE CLASSIC PATH) ----
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS

from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# ----------------------------------------

load_dotenv()

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/ask-pdf")
async def ask_pdf(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        # Load PDF
        loader = PyPDFLoader(temp_path)
        documents = loader.load()

        # Split
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150
        )
        chunks = splitter.split_documents(documents)

        # Vector DB
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vector_db = FAISS.from_documents(chunks, embeddings)

        # LLM
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

        # Prompt
        system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer the question. "
            "If you don't know the answer, just say that you don't know.\n\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])

        # Chains (CLASSIC, STABLE)
        combine_docs_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(
            vector_db.as_retriever(),
            combine_docs_chain
        )

        result = rag_chain.invoke({"input": question})

        return {
            "filename": file.filename,
            "answer": result["answer"]
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
