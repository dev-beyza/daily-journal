from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect("journal.db")
    cursor = conn.cursor()
    # Tabloya is_completed özelliğini (0 veya 1) ekledik
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            is_completed BOOLEAN DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

init_db()

class Note(BaseModel):
    content: str

@app.get("/api/notes")
def get_notes():
    conn = sqlite3.connect("journal.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, content, is_completed FROM notes")
    # is_completed durumunu da frontend'e yolluyoruz
    notes = [{"id": row[0], "content": row[1], "is_completed": bool(row[2])} for row in cursor.fetchall()]
    conn.close()
    return notes

@app.post("/api/notes")
def add_note(note: Note):
    conn = sqlite3.connect("journal.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO notes (content) VALUES (?)", (note.content,))
    conn.commit()
    conn.close()
    return {"message": "Not eklendi"}

# YENİ: Görevin üzerini çizmek (durumunu değiştirmek) için UPDATE (PUT) işlemi
@app.put("/api/notes/{note_id}")
def toggle_note(note_id: int):
    conn = sqlite3.connect("journal.db")
    cursor = conn.cursor()
    # Durumu tersine çevir (0 ise 1, 1 ise 0 yap)
    cursor.execute("UPDATE notes SET is_completed = NOT is_completed WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"message": "Durum güncellendi"}

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int):
    conn = sqlite3.connect("journal.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"message": "Not silindi"}