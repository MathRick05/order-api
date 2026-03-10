const {
  mapRequestToOrder,
  createOrder,
  findOrderById,
  findAllOrders,
  updateOrder,
  deleteOrder,
} = require('../models/orderModel');

/**
 * Valida os campos obrigatórios no corpo da requisição para criação de pedido
 * @param {Object} body
 * @returns {string|null} Mensagem de erro ou null se válido
 */
function validateOrderBody(body) {
  const required = ['numeroPedido', 'valorTotal', 'dataCriacao', 'items'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return `Campo obrigatório ausente: "${field}"`;
    }
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return '"items" deve ser um array não vazio';
  }
  for (const item of body.items) {
    if (!item.idItem || item.quantidadeItem === undefined || item.valorItem === undefined) {
      return 'Cada item deve ter "idItem", "quantidadeItem" e "valorItem"';
    }
  }
  return null;
}

/**
 * POST /order
 * Cria um novo pedido. Mapeia os campos PT-BR para o schema em inglês antes de salvar.
 */
async function createOrderHandler(req, res) {
  const validationError = validateOrderBody(req.body);
  if (validationError) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Bad Request', message: validationError }));
  }

  try {
    const mapped = mapRequestToOrder(req.body);
    const saved = createOrder(mapped);
    res.writeHead(201);
    res.end(JSON.stringify({ message: 'Pedido criado com sucesso', data: saved }));
  } catch (err) {
    // Pedido duplicado
    if (err.message.includes('already exists')) {
      res.writeHead(409);
      return res.end(JSON.stringify({ error: 'Conflict', message: err.message }));
    }
    throw err; // Deixa o servidor tratar erros inesperados
  }
}

/**
 * GET /order/list
 * Retorna todos os pedidos.
 */
async function listOrdersHandler(req, res) {
  const orders = findAllOrders();
  res.writeHead(200);
  res.end(JSON.stringify({ data: orders, total: orders.length }));
}

/**
 * GET /order/:orderId
 * Retorna um único pedido pelo seu ID.
 */
async function getOrderHandler(req, res, orderId) {
  if (!orderId) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Bad Request', message: 'O ID do pedido é obrigatório' }));
  }

  const order = findOrderById(orderId);
  if (!order) {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'Not Found', message: `Pedido "${orderId}" não encontrado` }));
  }

  res.writeHead(200);
  res.end(JSON.stringify({ data: order }));
}

/**
 * PUT /order/:orderId
 * Atualiza um pedido existente. Aceita o mesmo formato de corpo PT-BR.
 */
async function updateOrderHandler(req, res, orderId) {
  if (!orderId) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Bad Request', message: 'O ID do pedido é obrigatório' }));
  }

  const body = req.body;
  if (!body || Object.keys(body).length === 0) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Bad Request', message: 'O corpo da requisição está vazio' }));
  }

  // Mapeia apenas os campos fornecidos (suporte a atualização parcial)
  const updateData = {};
  if (body.valorTotal !== undefined) updateData.value = body.valorTotal;
  if (body.dataCriacao !== undefined) updateData.creationDate = new Date(body.dataCriacao).toISOString();
  if (body.items) {
    updateData.items = body.items.map(item => ({
      productId: parseInt(item.idItem, 10),
      quantity: item.quantidadeItem,
      price: item.valorItem,
    }));
  }

  const updated = updateOrder(orderId, updateData);
  if (!updated) {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'Not Found', message: `Pedido "${orderId}" não encontrado` }));
  }

  res.writeHead(200);
  res.end(JSON.stringify({ message: 'Pedido atualizado com sucesso', data: updated }));
}

/**
 * DELETE /order/:orderId
 * Deleta um pedido e todos os seus itens.
 */
async function deleteOrderHandler(req, res, orderId) {
  if (!orderId) {
    res.writeHead(400);
    return res.end(JSON.stringify({ error: 'Bad Request', message: 'O ID do pedido é obrigatório' }));
  }

  const deleted = deleteOrder(orderId);
  if (!deleted) {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'Not Found', message: `Pedido "${orderId}" não encontrado` }));
  }

  res.writeHead(200);
  res.end(JSON.stringify({ message: `Pedido "${orderId}" deletado com sucesso` }));
}

module.exports = {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
};