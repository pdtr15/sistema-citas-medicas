const { Pool } = require('pg');

// Configuración para PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Conectado a la base de datos PostgreSQL');
        client.release();
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
    }
};

testConnection();

module.exports = pool;