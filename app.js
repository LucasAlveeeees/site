const express = require('express');
const app = express();

// Exemplo de rota
app.get('/', (req, res) => {
  res.send('Olá, mundo!');
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

