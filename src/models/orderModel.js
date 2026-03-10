const { readDB, writeDB } = require('../config/database');

/**
 * Mapeia o corpo da requisição (campos em PT-BR) para o schema interno do banco (campos em inglês)
 * Entrada:  { numeroPedido, valorTotal, dataCriacao, items: [{ idItem, quantidadeItem, valorItem }] }
 * Saída: { orderId, value, creationDate, items: [{ productId, quantity, price }] }
 *
 * @param {Object} body - Corpo bruto da requisição
 * @returns {Object} Objeto do pedido mapeado
 */
function mapRequestToOrder(body) {
  const { numeroPedido, valorTotal, dataCriacao, items = [] } = body;

  // Normaliza a dataCriacao: remove o offset de fuso horário e garante o formato ISO com 'Z'
  let creationDate = dataCriacao;
  if (creationDate) {
    creationDate = new Date(creationDate).toISOString();
  }

  return {
    orderId: numeroPedido,
    value: valorTotal,
    creationDate,
    items: items.map(item => ({
      productId: parseInt(item.idItem, 10),
      quantity: item.quantidadeItem,
      price: item.valorItem,
    })),
  };
}

/**
 * Insere um novo pedido e seus itens no banco de dados
 * @param {Object} orderData - Objeto do pedido já mapeado
 * @returns {Object} Pedido salvo
 */
function createOrder(orderData) {
  const db = readDB();

  // Verifica se já existe um pedido com o mesmo orderId
  const exists = db.orders.find(o => o.orderId === orderData.orderId);
  if (exists) {
    throw new Error(`Pedido com ID "${orderData.orderId}" já existe.`);
  }

  // Salva a linha do pedido (sem os itens — armazenados separadamente, simulando tabelas relacionais)
  const orderRow = {
    orderId: orderData.orderId,
    value: orderData.value,
    creationDate: orderData.creationDate,
  };
  db.orders.push(orderRow);

  // Salva as linhas dos itens vinculadas pelo orderId
  const itemRows = orderData.items.map(item => ({
    orderId: orderData.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
  }));
  db.items.push(...itemRows);

  writeDB(db);

  // Retorna o objeto completo como foi salvo
  return { ...orderRow, items: itemRows.map(({ orderId, ...rest }) => rest) };
}

/**
 * Busca um único pedido pelo seu orderId, incluindo seus itens
 * @param {string} orderId
 * @returns {Object|null}
 */
function findOrderById(orderId) {
  const db = readDB();
  const order = db.orders.find(o => o.orderId === orderId);
  if (!order) return null;

  const items = db.items
    .filter(i => i.orderId === orderId)
    .map(({ orderId, ...rest }) => rest); // remove a FK da resposta

  return { ...order, items };
}

/**
 * Retorna todos os pedidos com seus respectivos itens
 * @returns {Array}
 */
function findAllOrders() {
  const db = readDB();
  return db.orders.map(order => {
    const items = db.items
      .filter(i => i.orderId === order.orderId)
      .map(({ orderId, ...rest }) => rest);
    return { ...order, items };
  });
}

/**
 * Atualiza um pedido existente (substitui value, creationDate e todos os itens)
 * @param {string} orderId
 * @param {Object} updateData - Campos mapeados a serem atualizados
 * @returns {Object|null} Pedido atualizado ou null se não encontrado
 */
function updateOrder(orderId, updateData) {
  const db = readDB();
  const index = db.orders.findIndex(o => o.orderId === orderId);
  if (index === -1) return null;

  // Atualiza os campos do pedido
  if (updateData.value !== undefined) db.orders[index].value = updateData.value;
  if (updateData.creationDate !== undefined) db.orders[index].creationDate = updateData.creationDate;

  // Substitui os itens se fornecidos
  if (updateData.items && updateData.items.length > 0) {
    db.items = db.items.filter(i => i.orderId !== orderId); // remove os itens antigos
    const newItems = updateData.items.map(item => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
    db.items.push(...newItems);
  }

  writeDB(db);

  const items = db.items
    .filter(i => i.orderId === orderId)
    .map(({ orderId, ...rest }) => rest);

  return { ...db.orders[index], items };
}

/**
 * Deleta um pedido e todos os seus itens
 * @param {string} orderId
 * @returns {boolean} true se deletado, false se não encontrado
 */
function deleteOrder(orderId) {
  const db = readDB();
  const initialLength = db.orders.length;

  db.orders = db.orders.filter(o => o.orderId !== orderId);
  if (db.orders.length === initialLength) return false;

  db.items = db.items.filter(i => i.orderId !== orderId);
  writeDB(db);
  return true;
}

module.exports = {
  mapRequestToOrder,
  createOrder,
  findOrderById,
  findAllOrders,
  updateOrder,
  deleteOrder,
};