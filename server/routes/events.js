const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Получение списка мероприятий и участников
router.get('/api/events', async (req, res) => {
    try {
        const [events] = await db.execute('SELECT * FROM events');
        const [participations] = await db.execute(`
            SELECT ep.event_id, ep.student_id, s.full_name 
            FROM event_participations ep 
            JOIN students s ON ep.student_id = s.id
        `);
        const [students] = await db.execute('SELECT id, full_name FROM students');
        res.json({ events, participations, students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавление мероприятия
router.post('/api/events', async (req, res) => {
    try {
        const { name, description, weight } = req.body;
        if (!name || !weight) throw new Error('Название и вес обязательны');
        const [result] = await db.execute(
            'INSERT INTO events (name, description, weight) VALUES (?, ?, ?)',
            [name, description || null, weight]
        );
        res.json({ id: result.insertId, name, description, weight, participations: {} });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление мероприятия
router.put('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, weight } = req.body;
        if (!name || !weight) throw new Error('Название и вес обязательны');
        await db.execute(
            'UPDATE events SET name = ?, description = ?, weight = ? WHERE id = ?',
            [name, description || null, weight, id]
        );
        res.json({ id, name, description, weight });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление мероприятия
router.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM event_participations WHERE event_id = ?', [id]);
        await db.execute('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Мероприятие удалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Переключение участия в мероприятии
router.post('/api/events/participation', async (req, res) => {
    try {
        const { event_id, student_id } = req.body;
        const [existing] = await db.execute(
            'SELECT * FROM event_participations WHERE event_id = ? AND student_id = ?',
            [event_id, student_id]
        );
        if (existing.length > 0) {
            await db.execute(
                'DELETE FROM event_participations WHERE event_id = ? AND student_id = ?',
                [event_id, student_id]
            );
            res.json({ message: 'Участие удалено' });
        } else {
            await db.execute(
                'INSERT INTO event_participations (event_id, student_id) VALUES (?, ?)',
                [event_id, student_id]
            );
            res.json({ message: 'Участие добавлено' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;