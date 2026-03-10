const {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
} = require('../controllers/orderController');

const { authMiddleware, loginHandler } = require('../middlewares/auth');

/**
 * Roteador manual simples.
 * Associa padrões de URL e métodos HTTP ao handler correto do controller.
 *
 * Rotas públicas (sem autenticação):
 *   POST   /auth/login         → loginHandler
 *
 * Rotas protegidas (exigem Bearer token no header Authorization):
 *   POST   /order              → createOrderHandler
 *   GET    /order/list         → listOrdersHandler
 *   GET    /order/:orderId     → getOrderHandler
 *   PUT    /order/:orderId     → updateOrderHandler
 *   DELETE /order/:orderId     → deleteOrderHandler
 */
async function router(req, res) {
  const method = req.method.toUpperCase();
  const url = req.url.split('?')[0]; // Ignora a query string
  const parts = url.split('/').filter(Boolean); // ['order', 'someId']

  // ── POST /auth/login (rota pública) ──────────────────────────────────────────
  if (method === 'POST' && parts[0] === 'auth' && parts[1] === 'login') {
    return loginHandler(req, res);
  }

  // ── Todas as rotas abaixo são protegidas por JWT ──────────────────────────────
  // O middleware verifica o token e chama next() se válido
  const autenticado = await new Promise(resolve => {
    authMiddleware(req, res, () => resolve(true));
  });

  if (!autenticado) return;

  // ── POST /order ───────────────────────────────────────────────────────────────
  if (method === 'POST' && parts.length === 1 && parts[0] === 'order') {
    return createOrderHandler(req, res);
  }

  // ── GET /order/list ───────────────────────────────────────────────────────────
  if (method === 'GET' && parts.length === 2 && parts[0] === 'order' && parts[1] === 'list') {
    return listOrdersHandler(req, res);
  }

  // ── GET /order/:orderId ───────────────────────────────────────────────────────
  if (method === 'GET' && parts.length === 2 && parts[0] === 'order') {
    return getOrderHandler(req, res, parts[1]);
  }

  // ── PUT /order/:orderId ───────────────────────────────────────────────────────
  if (method === 'PUT' && parts.length === 2 && parts[0] === 'order') {
    return updateOrderHandler(req, res, parts[1]);
  }

  // ── DELETE /order/:orderId ────────────────────────────────────────────────────
  if (method === 'DELETE' && parts.length === 2 && parts[0] === 'order') {
    return deleteOrderHandler(req, res, parts[1]);
  }

  // ── Fallback 404 ──────────────────────────────────────────────────────────────
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `A rota ${method} ${url} não existe`,
  }));
}

module.exports = { router };