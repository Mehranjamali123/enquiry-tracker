import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "./data/enquiries.db";


// Reuse one connection (Next.js dev mode reloads modules often)
function getDb() {
  if (!globalThis.__enquiryDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id                   TEXT PRIMARY KEY,
        name                 TEXT NOT NULL,
        email                TEXT NOT NULL,
        message              TEXT NOT NULL,
        created_at           TEXT NOT NULL,
        status               TEXT NOT NULL DEFAULT 'New'
          CHECK (status IN ('New','In Progress','Resolved')),
        category             TEXT
          CHECK (category IS NULL OR category IN ('Sales','Support','Billing','Other')),
        categorization_state TEXT NOT NULL DEFAULT 'Pending'
          CHECK (categorization_state IN ('Pending','Completed','Failed'))
      );
      CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
    `);
    globalThis.__enquiryDb = db;
  }
  return globalThis.__enquiryDb;
}


// DB row (snake_case, null-prototype object) -> plain API object (camelCase)
function toEnquiry(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
    status: row.status,
    category: row.category,
    categorizationState: row.categorization_state,
  };
}

export function createEnquiry({ name, email, message }) {
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO enquiries (id, name, email, message, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, name, email, message, new Date().toISOString());
  return getEnquiry(id); // defaults give status=New, state=Pending, category=null
}

export function getEnquiry(id) {
  const row = getDb().prepare("SELECT * FROM enquiries WHERE id = ?").get(id);
  return toEnquiry(row);
}

export function listEnquiries(status) {
  const db = getDb();
  const rows = status
    ? db.prepare("SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC").all(status)
    : db.prepare("SELECT * FROM enquiries ORDER BY created_at DESC").all();
  return rows.map(toEnquiry);
}

export function updateStatus(id, status) {
  const result = getDb()
    .prepare("UPDATE enquiries SET status = ? WHERE id = ?")
    .run(status, id);
  return result.changes > 0 ? getEnquiry(id) : null; // null = not found
}

export function markCategorized(id, category) {
  getDb()
    .prepare(
      `UPDATE enquiries SET category = ?, categorization_state = 'Completed' WHERE id = ?`
    )
    .run(category, id);
  return getEnquiry(id);
}

export function markCategorizationFailed(id) {
  getDb()
    .prepare(
      `UPDATE enquiries SET category = NULL, categorization_state = 'Failed' WHERE id = ?`
    )
    .run(id);
  return getEnquiry(id);
}