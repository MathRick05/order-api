const http = require('http');
const { router } = require('./routes/orderRoutes');
const { initDatabase } = require('./config/database');
const { docsHandler } = require('./config/swagger');

const PORT = 3000;

// Inicializa o banco de dados ao iniciar o servidor
initDatabase();

/**
 * Servidor HTTP simples que faz o parse do corpo JSON e roteia as requisições
 */
const server = http.createServer(async (req, res) => {
  // Faz o parse do corpo para requisições POST/PUT
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });

  req.on('end', async () => {
    // Anexa o corpo já parseado à requisição
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch (e) {
      req.body = {};
    }

    if (docsHandler(req, res)) return;

    // Define os headers padrão da resposta
    res.setHeader('Content-Type', 'application/json');

    // Roteia a requisição
    try {
      await router(req, res);
    } catch (err) {
      console.error('Erro não tratado:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Erro Interno do Servidor', message: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Orders API rodando em http://localhost:${PORT}`);
  console.log(`   POST   http://localhost:${PORT}/order          → Criar pedido`);
  console.log(`   GET    http://localhost:${PORT}/order/list     → Listar todos os pedidos`);
  console.log(`   GET    http://localhost:${PORT}/order/:id      → Buscar pedido por ID`);
  console.log(`   PUT    http://localhost:${PORT}/order/:id      → Atualizar pedido`);
  console.log(`   DELETE http://localhost:${PORT}/order/:id      → Deletar pedido`);
  console.log(`   DOCUMENTAÇAO http://localhost:${PORT}/docs  → Documentação Swagger`);
});