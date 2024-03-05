require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(cors({
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));

const http = require('http');
const socketIO = require('socket.io');


const server = http.createServer(app);
const io = socketIO(server);
 



// Configuração do pool do PostgreSQL
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware para análise do corpo das requisições


// Rotas CRUD

// Criar um boleto
app.post('/boleto', async (req, res) => {
  const {
    usuario,
    codigoBoleto,
    tipo,
    valor, 
    telefone
  } = req.body;

  const query = 'INSERT INTO boleto (usuario, codigoBoleto, tipo, valor, telefone) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [usuario, codigoBoleto, tipo, valor, telefone];

  try {
    const result = await pool.query(query, values);

    const result2 = await pool.query('SELECT * FROM boleto order by pagamentoagendado desc');
    res.status(200).json(result2.rows);

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


// Obter todos os boletos
app.get('/tudo/:nomeUsuario', async (req, res) => {
  const nomeUsuario = req.params.nomeUsuario;
  try {
    const result = await pool.query('SELECT * FROM boleto where usuario = $1 order by pagamentoagendado desc', [nomeUsuario]);
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

app.get('/user/telefone/:telefone', async (req, res) => {
  const telefone = req.params.telefone;
  let numero = ""

  if(telefone.length == 17){
      let meio = telefone.substring(4, telefone.length -5)
      numero = telefone.substring(2, 4) + 9 + meio;
  }
  else if (telefone.length == 18) {
      numero = telefone.substring(2, telefone.length - 5)
  }

  try {
    const result = await pool.query('SELECT * FROM usuario where telefone = $1',
    [numero]
  );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter saldo do usuario:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


app.put('/atualizarSaldo/:id', async (req, res) => {
  const id = req.params.id;
  const saldo = req.body.saldoatualizado;

  try {
    const result = await pool.query(
      'UPDATE usuario SET saldo = $1 WHERE id = $2',
      [saldo, id]
    );

    if (result.rowCount > 0) {
      res.json({ message: 'Saldo atualizado com sucesso' });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao atualizar o saldo:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
})


const storage = multer.diskStorage({
  destination: function(req, res, cb){
    cb(null, "uploads/")
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})

const upload = multer({storage})

app.post('/upload', upload.single('file'), (req, res) => {
  res.send("Arquivo recebido")
})

app.get('/arquivo/:nomeArquivo', (req, res) => {
  const nomeArquivo = req.params.nomeArquivo;
  res.sendFile(`${__dirname}/uploads/${nomeArquivo}`);
});




io.on('connection', (socket) => {
  console.log('Novo usuário conectado');

  // Manipula mensagens do cliente
  socket.on('novo boleto', (msg) => {
    console.log('Mensagem recebida: ' + msg);
    // Envia a mensagem para todos os clientes conectados
    io.emit('novo boleto', msg);
  });

  socket.on('enviar comprovante', (comprovante) => {
    console.log('Comprovante solicitado: ' + comprovante);
    io.emit('enviar comprovante', comprovante);
  });
 
  socket.on('depositar', (transferencia) => {
    console.log('Transferência solicitada: ' + transferencia);
    io.emit('depositar', transferencia);
  });

  // Manipula desconexões
  socket.on('disconnect', () => {
    console.log('Usuário desconectado');
  });
});

// Inicia o servidor na porta 3000

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
