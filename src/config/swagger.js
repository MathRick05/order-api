const crypto = require('crypto');

/**
 * Documentação Swagger da Orders API.
 * Serve dois endpoints:
 *   GET /docs        → Interface visual do Swagger UI (HTML)
 *   GET /docs/json   → Especificação OpenAPI em formato JSON
 */

/**
 * Especificação OpenAPI 3.0 da API
 */
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Orders API',
    version: '1.0.0',
    description: 'API REST para gerenciamento de pedidos — Desafio Jitterbit',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Servidor local' },
  ],

  // Define o esquema de autenticação Bearer JWT
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Informe o token JWT obtido no endpoint /auth/login',
      },
    },
    schemas: {
      // Schema do item dentro de um pedido (formato da requisição em PT-BR)
      ItemInput: {
        type: 'object',
        required: ['idItem', 'quantidadeItem', 'valorItem'],
        properties: {
          idItem:         { type: 'string',  example: '2434' },
          quantidadeItem: { type: 'integer', example: 1 },
          valorItem:      { type: 'number',  example: 1000 },
        },
      },
      // Schema do pedido (formato da requisição em PT-BR)
      OrderInput: {
        type: 'object',
        required: ['numeroPedido', 'valorTotal', 'dataCriacao', 'items'],
        properties: {
          numeroPedido: { type: 'string',  example: 'v10089015vdb-01' },
          valorTotal:   { type: 'number',  example: 10000 },
          dataCriacao:  { type: 'string',  format: 'date-time', example: '2023-07-19T12:24:11.529Z' },
          items:        { type: 'array', items: { $ref: '#/components/schemas/ItemInput' } },
        },
      },
      // Schema do item como salvo no banco (formato EN)
      ItemOutput: {
        type: 'object',
        properties: {
          productId: { type: 'integer', example: 2434 },
          quantity:  { type: 'integer', example: 1 },
          price:     { type: 'number',  example: 1000 },
        },
      },
      // Schema do pedido como salvo no banco (formato EN)
      OrderOutput: {
        type: 'object',
        properties: {
          orderId:      { type: 'string',  example: 'v10089015vdb-01' },
          value:        { type: 'number',  example: 10000 },
          creationDate: { type: 'string',  format: 'date-time', example: '2023-07-19T12:24:11.529Z' },
          items:        { type: 'array', items: { $ref: '#/components/schemas/ItemOutput' } },
        },
      },
      // Schema de erro padrão
      Error: {
        type: 'object',
        properties: {
          error:   { type: 'string', example: 'Not Found' },
          message: { type: 'string', example: 'Pedido não encontrado' },
        },
      },
    },
  },

  // Aplica autenticação JWT em todos os endpoints por padrão
  security: [{ bearerAuth: [] }],

  paths: {
    // ── Autenticação ────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Realizar login e obter token JWT',
        security: [], // rota pública, sem autenticação
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message:  { type: 'string', example: 'Login realizado com sucesso' },
                    token:    { type: 'string', example: 'eyJhbGci...' },
                    expiraEm: { type: 'string', example: '1 hora' },
                  },
                },
              },
            },
          },
          401: { description: 'Usuário ou senha incorretos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Pedidos ─────────────────────────────────────────────────────────────────
    '/order': {
      post: {
        tags: ['Pedidos'],
        summary: 'Criar um novo pedido',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Pedido criado com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderOutput' } } },
          },
          400: { description: 'Campos obrigatórios ausentes ou inválidos' },
          401: { description: 'Token não fornecido ou inválido' },
          409: { description: 'Pedido com esse ID já existe' },
        },
      },
    },

    '/order/list': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar todos os pedidos',
        responses: {
          200: {
            description: 'Lista de pedidos retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data:  { type: 'array', items: { $ref: '#/components/schemas/OrderOutput' } },
                    total: { type: 'integer', example: 2 },
                  },
                },
              },
            },
          },
          401: { description: 'Token não fornecido ou inválido' },
        },
      },
    },

    '/order/{orderId}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Buscar pedido por ID',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' }, example: 'v10089015vdb-01' },
        ],
        responses: {
          200: {
            description: 'Pedido encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderOutput' } } },
          },
          401: { description: 'Token não fornecido ou inválido' },
          404: { description: 'Pedido não encontrado' },
        },
      },
      put: {
        tags: ['Pedidos'],
        summary: 'Atualizar um pedido existente',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' }, example: 'v10089015vdb-01' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrderInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Pedido atualizado com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderOutput' } } },
          },
          400: { description: 'Corpo da requisição inválido ou vazio' },
          401: { description: 'Token não fornecido ou inválido' },
          404: { description: 'Pedido não encontrado' },
        },
      },
      delete: {
        tags: ['Pedidos'],
        summary: 'Deletar um pedido',
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' }, example: 'v10089015vdb-01' },
        ],
        responses: {
          200: { description: 'Pedido deletado com sucesso' },
          401: { description: 'Token não fornecido ou inválido' },
          404: { description: 'Pedido não encontrado' },
        },
      },
    },
  },
};

/**
 * Gera o HTML da interface Swagger UI usando a CDN oficial
 * @returns {string} HTML completo da página
 */
function getSwaggerHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orders API — Documentação</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/docs/json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        deepLinking: true,
      });
    </script>
  </body>
</html>`;
}

/**
 * Handler das rotas de documentação
 * GET /docs      → Swagger UI (HTML)
 * GET /docs/json → Especificação OpenAPI (JSON)
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {boolean} true se a rota foi tratada, false caso contrário
 */
function docsHandler(req, res) {
  const url = req.url.split('?')[0];

  // Serve a interface visual do Swagger
  if (url === '/docs' || url === '/docs/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getSwaggerHtml());
    return true;
  }

  // Serve a especificação OpenAPI em JSON
  if (url === '/docs/json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerSpec, null, 2));
    return true;
  }

  // Rota não é de documentação
  return false;
}

module.exports = { docsHandler };