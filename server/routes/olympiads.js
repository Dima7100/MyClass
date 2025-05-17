const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Получение данных об олимпиадах
router.get('/api/olympiads', async (req, res) => {
    try {
        const { stage } = req.query;
        const [olympiads] = await db.execute('SELECT * FROM olympiads WHERE stage = ?', [stage]);
        const [students] = await db.execute('SELECT id, full_name FROM students');
        const subjects = [...new Set(olympiads.map(o => o.subject_id))].map(id => ({ id, name: `Предмет ${id}` }));
        const participations = olympiads.reduce((acc, o) => {
            if (!acc[o.subject_id]) acc[o.subject_id] = {};
            acc[o.subject_id][o.student_id] = o.status;
            return acc;
        }, {});
        res.json({ subjects, participations, students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавление предмета (предметы хранятся как ID в olympiads, название для отображения генерируется)
router.post('/api/olympiads/subject', async (req, res) => {
    try {
        const { stage, subject_name } = req.body;
        const [result] = await db.execute('SELECT MAX(subject_id) as max FROM olympiads WHERE stage = ?', [stage]);
        const newSubjectId = (result[0].max || 0) + 1;
        res.json({ id: newSubjectId, name: subject_name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавление участников
router.post('/api/olympiads/participants', async (req, res) => {
    try {
        const { stage, subject_id, student_ids } = req.body;
        for (const student_id of student_ids) {
            const [existing] = await db.execute(
                'SELECT * FROM olympiads WHERE stage = ? AND subject_id = ? AND student_id = ?',
                [stage, subject_id, student_id]
            );
            if (!existing.length) {
                await db.execute(
                    'INSERT INTO olympiads (stage, subject_id, student_id, status) VALUES (?, ?, ?, ?)',
                    [stage, subject_id, student_id, 'Участник']
                );
            }
        }
        res.json({ message: 'Участники добавлены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление результата
router.put('/api/olympiads/result', async (req, res) => {
    try {
        const { stage, subject_id, student_id, status } = req.body;
        await db.execute(
            'UPDATE olympiads SET status = ? WHERE stage = ? AND subject_id = ? AND student_id = ?',
            [status, stage, subject_id, student_id]
        );
        res.json({ message: 'Результат обновлён' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;