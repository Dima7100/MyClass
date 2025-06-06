const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/api/events', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM events ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Ошибка в /api/events:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/events/participations', async (req, res) => {
    try {
        const { event_id, student_id } = req.query;
        let query = 'SELECT * FROM event_participations';
        let params = [];
        if (event_id && student_id) {
            query += ' WHERE event_id = ? AND student_id = ?';
            params = [event_id, student_id];
        }
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Ошибка в /api/events/participations:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [id]);
        if (!rows.length) throw new Error('Мероприятие не найдено');
        res.json(rows[0]);
    } catch (error) {
        console.error('Ошибка в /api/events/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/events', async (req, res) => {
    try {
        const { name, description, weight } = req.body;
        if (!name || !weight) throw new Error('Название и вес обязательны');
        const [result] = await db.execute(
            'INSERT INTO events (name, description, weight) VALUES (?, ?, ?)',
            [name, description || null, weight]
        );
        res.json({ id: result.insertId, name, description, weight });
    } catch (error) {
        console.error('Ошибка в /api/events:', error);
        res.status(500).json({ error: error.message });
    }
});

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
        console.error('Ошибка в /api/events/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Мероприятие удалено' });
    } catch (error) {
        console.error('Ошибка в /api/events/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/events/participation', async (req, res) => {
    try {
        const { event_id, student_id } = req.body;
        const [result] = await db.execute(
            'INSERT INTO event_participations (event_id, student_id) VALUES (?, ?)',
            [event_id, student_id]
        );
        res.json({ id: result.insertId, event_id, student_id });
    } catch (error) {
        console.error('Ошибка в /api/events/participation:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;