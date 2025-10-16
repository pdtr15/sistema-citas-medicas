const express = require('express');
const router = express.Router();
const pool = require('../database');

// Obtener todas las citas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.nombre as paciente_nombre, d.nombre as doctor_nombre, d.especialidad 
            FROM citas c 
            JOIN pacientes p ON c.paciente_id = p.id 
            JOIN doctores d ON c.doctor_id = d.id 
            ORDER BY c.fecha DESC, c.hora DESC
        `);
        res.json({ success: true, citas: result.rows });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Agendar nueva cita
router.post('/agendar', async (req, res) => {
    try {
        const { paciente_id, doctor_id, fecha, hora, motivo } = req.body;

        // Verificar disponibilidad
        const citasOcupadas = await pool.query(
            'SELECT hora FROM citas WHERE doctor_id = $1 AND fecha = $2 AND estado = ANY($3::text[])',
            [doctor_id, fecha, ['agendada', 'confirmada']]
        );

        const horariosOcupados = citasOcupadas.rows.map(cita => cita.hora);
        if (horariosOcupados.includes(hora)) {
            return res.status(400).json({ 
                success: false, 
                message: 'El horario seleccionado no está disponible' 
            });
        }

        const result = await pool.query(
            'INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [paciente_id, doctor_id, fecha, hora, motivo]
        );

        res.json({ 
            success: true, 
            message: 'Cita agendada exitosamente', 
            citaId: result.rows[0].id 
        });
    } catch (error) {
        console.error('Error al agendar cita:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});


// Obtener horarios disponibles
router.get('/horarios-disponibles/:doctorId/:fecha', async (req, res) => {
    try {
        const { doctorId, fecha } = req.params;
        
        const citasOcupadas = await pool.query(
            'SELECT hora FROM citas WHERE doctor_id = $1 AND fecha = $2 AND estado IN ($3, $4)',
            [doctorId, fecha, 'agendada', 'confirmada']
        );
        
        const horariosOcupados = citasOcupadas.rows.map(cita => cita.hora);
        const horariosDisponibles = [];
        
        // Generar horarios de 8:00 AM a 5:00 PM cada 30 minutos
        for (let hour = 8; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const hora = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                if (!horariosOcupados.includes(hora)) {
                    horariosDisponibles.push(hora);
                }
            }
        }
        
        res.json({ 
            success: true, 
            horariosDisponibles 
        });
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Reprogramar cita
router.put('/reprogramar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora } = req.body;
        
        const result = await pool.query(
            'UPDATE citas SET fecha = $1, hora = $2, estado = $3 WHERE id = $4',
            [fecha, hora, 'reprogramada', id]
        );
        
        if (result.rowCount > 0) {
            res.json({ 
                success: true, 
                message: 'Cita reprogramada exitosamente' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Cita no encontrada' 
            });
        }
    } catch (error) {
        console.error('Error al reprogramar cita:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Cancelar cita
router.put('/cancelar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE citas SET estado = $1 WHERE id = $2',
            ['cancelada', id]
        );
        
        if (result.rowCount > 0) {
            res.json({ 
                success: true, 
                message: 'Cita cancelada exitosamente' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Cita no encontrada' 
            });
        }
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener doctores
router.get('/doctores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM doctores WHERE estado = $1', ['activo']);
        res.json({ success: true, doctores: result.rows });
    } catch (error) {
        console.error('Error al obtener doctores:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener pacientes
router.get('/pacientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pacientes');
        res.json({ success: true, pacientes: result.rows });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;