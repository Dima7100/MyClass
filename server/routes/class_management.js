const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Получение списка учеников
router.get('/api/students', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM students ORDER BY full_name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение данных одного ученика
router.get('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM students WHERE id = ?', [id]);
        if (!rows.length) throw new Error('Ученик не найден');
        res.json(rows[0]);
    } catch (error) {
        console.error('Ошибка в /api/students/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// Добавление ученика
router.post('/api/students', async (req, res) => {
    try {
        const { full_name, phone, email, parents, birth_date, passport, snils } = req.body;
        if (!full_name) throw new Error('ФИО обязательно');
        const [result] = await db.execute(
            'INSERT INTO students (full_name, phone, email, parents, birth_date, passport, snils) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [full_name, phone || null, email || null, parents || null, birth_date || null, passport || null, snils || null]
        );
        res.json({ id: result.insertId, full_name, phone, email, parents, birth_date, passport, snils });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление ученика
router.put('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, email, parents, birth_date, passport, snils } = req.body;
        if (!full_name) throw new Error('ФИО обязательно');
        await db.execute(
            'UPDATE students SET full_name = ?, phone = ?, email = ?, parents = ?, birth_date = ?, passport = ?, snils = ? WHERE id = ?',
            [full_name, phone || null, email || null, parents || null, birth_date || null, passport || null, snils || null, id]
        );
        res.json({ id, full_name, phone, email, parents, birth_date, passport, snils });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление ученика
router.delete('/api/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM students WHERE id = ?', [id]);
        res.json({ message: 'Ученик удалён' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Очистка базы данных
router.delete('/api/clear-database', async (req, res) => {
    try {
        await db.execute('DELETE FROM attendance');
        await db.execute('DELETE FROM event_participations');
        await db.execute('DELETE FROM events');
        await db.execute('DELETE FROM tasks');
        await db.execute('DELETE FROM olympiads');
        await db.execute('DELETE FROM students');
        res.json({ message: 'База данных очищена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;