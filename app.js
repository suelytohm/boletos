const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = new sqlite3.Database('database.db');

const moment = require('moment');

// Configuração do Express
app.use(bodyParser.json());

// Criar a tabela "boleto" se ela não existir
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS boleto (
    id INTEGER PRIMARY KEY,
    user TEXT,
    codigoBoleto TEXT,
    tipo TEXT,
    valor REAL,
    pagamentoAgendado DATE,
    diaPagamento DATE,
    pago BOOLEAN,
    nomeComprovante TEXT
  )`);
});

// Rota para criar um novo boleto
app.post('/boletos', (req, res) => {
  const { user, codigoBoleto, tipo, valor, diaPagamento, pago, nomeComprovante } = req.body;
  const pagamentoAgendado = moment().format('YYYY-MM-DD');
  db.run('INSERT INTO boleto (user, codigoBoleto, tipo, valor, pagamentoAgendado, diaPagamento, pago, nomeComprovante) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [user, codigoBoleto, tipo, valor, pagamentoAgendado, diaPagamento, pago, nomeComprovante],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: 'Boleto criado com sucesso!',
        boleto_id: this.lastID
      });
    });
});

// Rota para listar todos os boletos
app.get('/boletos', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0]; // Obtém a data de hoje no formato 'YYYY-MM-DD'
  db.all('SELECT * FROM boleto WHERE pagamentoAgendado <= ? and pago = "N" ', [hoje], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Rota para buscar um boleto por ID
app.get('/boletos/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM boleto WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'Boleto não encontrado' });
    }
  });
});

// Rota para atualizar um boleto por ID
app.put('/boletos/:id', (req, res) => {
  const id = req.params.id;
  const diaPagamento = moment().format('YYYY-MM-DD');  
  const { user, codigoBoleto, tipo, valor, pagamentoAgendado, pago, nomeComprovante } = req.body;
  db.run('UPDATE boleto SET user = ?, codigoBoleto = ?, tipo = ?, valor = ?, pagamentoAgendado = ?, diaPagamento = ?, pago = ?, nomeComprovante = ? WHERE id = ?',
    [user, codigoBoleto, tipo, valor, pagamentoAgendado, diaPagamento, pago, nomeComprovante, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes > 0) {
        res.json({ message: 'Boleto atualizado com sucesso' });
      } else {
        res.status(404).json({ message: 'Boleto não encontrado' });
      }
    });
});

// Rota para deletar um boleto por ID
app.delete('/boletos/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM boleto WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes > 0) {
      res.json({ message: 'Boleto excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Boleto não encontrado' });
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
