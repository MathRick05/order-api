const crypto = require('crypto');

// Chave secreta usada para assinar e verificar os tokens
// Em produção, use uma variável de ambiente: process.env.JWT_SECRET
const SECRET = 'jitterbit_secret_2024';

// Usuários cadastrados (em produção, viria do banco de dados)
const USERS = [
  { id: 1, username: 'admin', password: 'admin123' },
];

/**
 * Codifica uma string para Base64URL (padrão do JWT)
 * @param {string} str
 * @returns {string}
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodifica uma string de Base64URL
 * @param {string} str
 * @returns {string}
 */
function base64UrlDecode(str) {
  // Adiciona padding '=' se necessário
  str += '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

/**
 * Gera um token JWT com payload informado e expiração de 1 hora
 * @param {Object} payload - Dados a incluir no token (ex: { id, username })
 * @returns {string} Token JWT
 */
function generateToken(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  const data = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),          // emitido em (timestamp)
    exp: Math.floor(Date.now() / 1000) + 3600,   // expira em 1 hora
  };

  const body = base64UrlEncode(JSON.stringify(data));

  // Assina o token com HMAC SHA-256
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifica e decodifica um token JWT
 * @param {string} token
 * @returns {Object} Payload decodificado
 * @throws {Error} Se o token for inválido ou expirado
 */
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token inválido');

  const [header, body, signature] = parts;

  // Recalcula a assinatura e compara com a do token
  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  if (signature !== expectedSignature) throw new Error('Assinatura do token inválida');

  // Decodifica o payload
  const payload = JSON.parse(base64UrlDecode(body));

  // Verifica se o token expirou
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expirado');
  }

  return payload;
}

/**
 * Middleware de autenticação JWT.
 * Verifica o header Authorization: Bearer <token> em cada requisição protegida.
 * Caso válido, anexa o payload do token em req.user e chama next().
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next - Função a chamar se autenticado com sucesso
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Verifica se o header foi enviado no formato correto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401);
    return res.end(JSON.stringify({
      error: 'Não autorizado',
      message: 'Token não fornecido. Use o header: Authorization: Bearer <token>',
    }));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload; // disponibiliza os dados do usuário na requisição
    next();
  } catch (err) {
    res.writeHead(401);
    res.end(JSON.stringify({
      error: 'Não autorizado',
      message: err.message,
    }));
  }
}

/**
 * Handler do endpoint de login
 * POST /auth/login
 * Body: { username, password }
 * Retorna um token JWT em caso de sucesso
 */
function loginHandler(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.writeHead(400);
    return res.end(JSON.stringify({
      error: 'Requisição inválida',
      message: '"username" e "password" são obrigatórios',
    }));
  }

  // Busca o usuário pelo username e password
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    res.writeHead(401);
    return res.end(JSON.stringify({
      error: 'Não autorizado',
      message: 'Usuário ou senha incorretos',
    }));
  }

  // Gera o token com os dados do usuário (sem a senha)
  const token = generateToken({ id: user.id, username: user.username });

  res.writeHead(200);
  res.end(JSON.stringify({
    message: 'Login realizado com sucesso',
    token,
    expiraEm: '1 hora',
  }));
}

module.exports = { authMiddleware, loginHandler };