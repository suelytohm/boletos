require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do pool do PostgreSQL
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware para análise do corpo das requisições
app.use(bodyParser.json());
app.use(cors({
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));

// Rotas CRUD

// Criar um boleto
app.post('/boleto', async (req, res) => {
  const {
    usuario,
    codigoBoleto,
    tipo,
    valor
  } = req.body;

  const query = 'INSERT INTO boleto (usuario, codigoBoleto, tipo, valor) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [usuario, codigoBoleto, tipo, valor];

  try {
    const result = await pool.query(query, values);

    const result2 = await pool.query('SELECT * FROM boleto order by pagamentoagendado desc');
    res.json(result2.rows);

    // res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao inserir boleto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todos os boletos
app.get('/tudo', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boleto order by pagamentoagendado desc');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter boletos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


app.get('/boletos', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM boleto WHERE pagamentoAgendado <= CURRENT_DATE and pago = 'N'`);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao obter boletos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
});



// Rota para atualizar um boleto por ID
app.put('/boletos/:id', async (req, res) => {
    const id = req.params.id;
    const { pago, nomeComprovante } = req.body;
    
    try {
      const result = await pool.query(
        'UPDATE boleto SET diaPagamento = CURRENT_DATE, pago = $1, nomeComprovante = $2 WHERE id = $3',
        [pago, nomeComprovante, id]
      );
  
      if (result.rowCount > 0) {
        res.json({ message: 'Boleto atualizado com sucesso' });
      } else {
        res.status(404).json({ message: 'Boleto não encontrado' });
      }
    } catch (err) {
      console.error('Erro ao atualizar o boleto:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  

app.get('/user/:user', async (req, res) => {
  const user = req.params.user;
  try {
    const result = await pool.query('SELECT * FROM usuario where nome = $1',
    [user]
  );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter usuario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
