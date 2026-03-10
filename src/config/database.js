const fs = require('fs');
const path = require('path');

/**
 * Banco de dados simples baseado em arquivo JSON (simula as tabelas SQL: Order + Items)
 * Schema:
 *   Order: { orderId, value, creationDate }
 *   Items: [{ orderId, productId, quantity, price }]
 */
const DB_PATH = path.join(__dirname, '../../data/db.json');

// Garante que o diretório de dados existe
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Inicializa o banco de dados com tabelas vazias caso não exista
 */
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const emptyDb = { orders: [], items: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2));
    console.log('📦 Banco de dados inicializado em:', DB_PATH);
  } else {
    console.log('📦 Banco de dados carregado de:', DB_PATH);
  }
}

/**
 * Lê o banco de dados completo
 * @returns {{ orders: Array, items: Array }}
 */
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { orders: [], items: [] };
  }
}

/**
 * Persiste o banco de dados completo no disco
 * @param {{ orders: Array, items: Array }} db
 */
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { initDatabase, readDB, writeDB };