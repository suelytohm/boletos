const { Pool } = require('pg');

const connectionString = 'postgres://qbtmvnim:MpIRQ6Y7EGpWb_rRvZmTeuOjo26mIL_i@babar.db.elephantsql.com:5432/qbtmvnim';

const pool = new Pool({
  connectionString: connectionString,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado com sucesso! A data atual é:', res.rows[0].now);
  }
  pool.end(); // Feche o pool após o uso
});