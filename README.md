# Orders API — Desafio Jitterbit

API REST para gerenciamento de pedidos, desenvolvida em **Node.js puro**,
com persistência em arquivo JSON simulando tabelas relacionais (`Order` e `Items`).

---

## Como executar

```bash
# 1. Entre na pasta do projeto
cd orders-api

# 2. Inicie o servidor
node src/server.js
```

O servidor estará disponível em: `http://localhost:3000`

---

## Estrutura do Projeto

```
orders-api/
├── src/
│   ├── server.js                  # Entry point — HTTP server
│   ├── config/
│   │   └── database.js            # Inicialização e acesso ao banco (JSON)
│   ├── models/
│   │   └── orderModel.js          # Mapeamento de campos + operações CRUD
│   ├── controllers/
│   │   └── orderController.js     # Handlers das rotas com validação
│   └── routes/
│       └── orderRoutes.js         # Roteador manual de URLs
├── data/
│   └── db.json                    # Banco de dados (gerado automaticamente)
├── package.json
└── README.md
```

---

## Schema do Banco de Dados

### Tabela: `orders`
| Campo         | Tipo   | Descrição                    |
|---------------|--------|------------------------------|
| orderId       | string | Identificador único do pedido|
| value         | number | Valor total do pedido        |
| creationDate  | string | Data de criação (ISO 8601)   |

### Tabela: `items`
| Campo     | Tipo   | Descrição                    |
|-----------|--------|------------------------------|
| orderId   | string | FK para a tabela orders      |
| productId | number | ID do produto                |
| quantity  | number | Quantidade do item           |
| price     | number | Preço unitário               |

---

## Mapeamento de Campos (Request → Banco)

| Campo do Request (PT)   | Campo no Banco (EN) |
|-------------------------|---------------------|
| `numeroPedido`          | `orderId`           |
| `valorTotal`            | `value`             |
| `dataCriacao`           | `creationDate`      |
| `items[].idItem`        | `items[].productId` |
| `items[].quantidadeItem`| `items[].quantity`  |
| `items[].valorItem`     | `items[].price`     |

---

## Endpoints

### `POST /order` — Criar pedido
**Body:**
```json
{
  "numeroPedido": "v10089015vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    {
      "idItem": "2434",
      "quantidadeItem": 1,
      "valorItem": 1000
    }
  ]
}
```
**Resposta:** `201 Created`
```json
{
  "message": "Order created successfully",
  "data": {
    "orderId": "v10089015vdb-01",
    "value": 10000,
    "creationDate": "2023-07-19T12:24:11.529Z",
    "items": [{ "productId": 2434, "quantity": 1, "price": 1000 }]
  }
}
```

---

### `GET /order/:orderId` — Buscar pedido por ID
```
GET http://localhost:3000/order/v10089015vdb-01
```
**Resposta:** `200 OK` | `404 Not Found`

---

### `GET /order/list` — Listar todos os pedidos
```
GET http://localhost:3000/order/list
```
**Resposta:** `200 OK`
```json
{ "data": [...], "total": 2 }
```

---

### `PUT /order/:orderId` — Atualizar pedido
```
PUT http://localhost:3000/order/v10089015vdb-01
```
Aceita o mesmo formato do POST (campos PT-BR). Suporta atualização parcial.

**Resposta:** `200 OK` | `404 Not Found`

---

### `DELETE /order/:orderId` — Deletar pedido
```
DELETE http://localhost:3000/order/v10089015vdb-01
```
**Resposta:** `200 OK` | `404 Not Found`

---

## 🧪 Exemplos com cURL

```bash
# Criar pedido
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
    "items": [{ "idItem": "2434", "quantidadeItem": 1, "valorItem": 1000 }]
  }'

# Buscar pedido
curl http://localhost:3000/order/v10089015vdb-01

# Listar todos
curl http://localhost:3000/order/list

# Atualizar pedido
curl -X PUT http://localhost:3000/order/v10089015vdb-01 \
  -H "Content-Type: application/json" \
  -d '{ "valorTotal": 15000 }'

# Deletar pedido
curl -X DELETE http://localhost:3000/order/v10089015vdb-01
```

---

## ✅ Códigos HTTP Utilizados

| Código | Situação                              |
|--------|---------------------------------------|
| 200    | Sucesso (GET, PUT, DELETE)            |
| 201    | Criado com sucesso (POST)             |
| 400    | Requisição inválida / campos faltando |
| 404    | Pedido não encontrado                 |
| 409    | Conflito — pedido já existe           |
| 500    | Erro interno do servidor              |
