const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Получение списка поручений и выполнений
router.get('/api/tasks', async (req, res) => {
    try {
        const [tasks] = await db.execute('SELECT * FROM tasks');
        const [completions] = await db.execute(`
            SELECT id, student_id FROM tasks WHERE completed = TRUE
        `);
        const [students] = await db.execute('SELECT id, full_name FROM students');
        res.json({ tasks, completions, students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавление поручения
router.post('/api/tasks', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) throw new Error('Описание обязательно');
        const [result] = await db.execute(
            'INSERT INTO tasks (description, completed, student_id) VALUES (?, FALSE, NULL)',
            [description]
        );
        res.json({ id: result.insertId, description, completed: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление поручения
router.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        if (!description) throw new Error('Описание обязательно');
        await db.execute(
            'UPDATE tasks SET description = ? WHERE id = ? AND student_id IS NULL',
            [description, id]
        );
        res.json({ id, description });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление поручения
router.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM tasks WHERE id = ? AND student_id IS NULL', [id]);
        res.json({ message: 'Поручение удалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Переключение выполнения поручения
router.post('/api/tasks/completion', async (req, res) => {
    try {
        const { task_id, student_id } = req.body;
        const [existing] = await db.execute(
            'SELECT * FROM tasks WHERE id = ? AND student_id = ? AND completed = TRUE',
            [task_id, student_id]
        );
        if (existing.length > 0) {
            await db.execute(
                'DELETE FROM tasks WHERE id = ? AND student_id = ? AND completed = TRUE',
                [task_id, student_id]
            );
            res.json({ message: 'Выполнение снято' });
        } else {
            await db.execute(
                'INSERT INTO tasks (id, description, completed, student_id) SELECT id, description, TRUE, ? FROM tasks WHERE id = ? AND student_id IS NULL LIMIT 1',
                [student_id, task_id]
            );
            res.json({ message: 'Выполнение добавлено' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;