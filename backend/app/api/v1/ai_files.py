import os
import tempfile
import sqlite3
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.main import get_current_user, _rag_vector, DANILO_AI_INDEX_PATH, init_rag_index
from app.core.document_parser import extract_text_from_file, chunk_text

ai_files_router = APIRouter(prefix='/api/ai/files', tags=['ai-files'])

@ai_files_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Save the uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Extract text using document_parser
        text = extract_text_from_file(temp_file_path, file.content_type)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from the provided file.")

        # Chunk the text
        chunks = chunk_text(text, words_per_chunk=300, overlap_words=50)
        if not chunks:
            raise HTTPException(status_code=400, detail="File appears to be empty or unreadable.")

        now = datetime.now(timezone.utc).isoformat()
        
        # Insert into SQLite DB
        if not os.path.exists(DANILO_AI_INDEX_PATH):
            init_rag_index()
        with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
            cursor = conn.cursor()
            # 1. Insert file metadata
            cursor.execute('''
                INSERT INTO user_files (user_id, filename, file_size, mime_type, uploaded_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (current_user.id, file.filename, len(content), file.content_type, now))
            
            file_id = cursor.lastrowid
            
            # 2. Vectorize and insert chunks
            for idx, chunk in enumerate(chunks):
                vector = _rag_vector(chunk)
                cursor.execute('''
                    INSERT INTO user_file_chunks (file_id, chunk_index, content, vector_json)
                    VALUES (?, ?, ?, ?)
                ''', (file_id, idx, chunk, json.dumps(vector)))
                
        return {"id": file_id, "filename": file.filename, "status": "success", "chunks": len(chunks)}
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@ai_files_router.get("/")
def get_user_files(current_user: User = Depends(get_current_user)):
    if not os.path.exists(DANILO_AI_INDEX_PATH):
        return []
        
    with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT id, filename, file_size, mime_type, uploaded_at FROM user_files WHERE user_id = ? ORDER BY id DESC', (current_user.id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@ai_files_router.delete("/{file_id}")
def delete_user_file(file_id: str, current_user: User = Depends(get_current_user)):
    if not os.path.exists(DANILO_AI_INDEX_PATH):
        raise HTTPException(status_code=404, detail="File not found")
        
    with sqlite3.connect(DANILO_AI_INDEX_PATH) as conn:
        cursor = conn.cursor()
        # Verify ownership
        cursor.execute('SELECT id FROM user_files WHERE id = ? AND user_id = ?', (file_id, current_user.id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="File not found or unauthorized")
            
        # Explicitly delete chunks since SQLite foreign_keys might be OFF by default
        cursor.execute('DELETE FROM user_file_chunks WHERE file_id = ?', (file_id,))
        cursor.execute('DELETE FROM user_files WHERE id = ?', (file_id,))
        
    return {"status": "success", "message": "File deleted"}
