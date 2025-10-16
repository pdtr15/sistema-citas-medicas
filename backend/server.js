const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rutas
const citasRoutes = require('./routes/citas');
app.use('/api/citas', citasRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend de Citas Médicas funcionando!' });
});

// Tarea programada para recordatorios
cron.schedule('0 8 * * *', () => {
  console.log('Ejecutando recordatorios automáticos...');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});