const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/api/olympiads', async (req, res) => {
    try {
        const { stage } = req.query;
        const [subjects] = await db.execute('SELECT * FROM olympiad_subjects WHERE stage = ?', [stage]);
        const [participationsRows] = await db.execute('SELECT * FROM olympiad_participations WHERE stage = ?', [stage]);
        const [students] = await db.execute('SELECT * FROM students');

        const participations = {};
        for (const subject of subjects) {
            participations[subject.id] = {};
            for (const p of participationsRows.filter(p => p.subject_id === subject.id)) {
                participations[subject.id][p.student_id] = p.status;
            }
        }

        res.json({ subjects, participations, students });
    } catch (error) {
        console.error('Ошибка в /api/olympiads:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/olympiads/subject', async (req, res) => {
    try {
        const { stage, subject_name } = req.body;
        if (!stage || !subject_name) throw new Error('Этап и название предмета обязательны');
        const [result] = await db.execute(
            'INSERT INTO olympiad_subjects (stage, name) VALUES (?, ?)',
            [stage, subject_name]
        );
        res.json({ id: result.insertId, stage, name: subject_name });
    } catch (error) {
        console.error('Ошибка в /api/olympiads/subject:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/olympiads/participants', async (req, res) => {
    try {
        const { stage, subject_id, student_ids } = req.body;
        for (const student_id of student_ids) {
            await db.execute(
                'INSERT INTO olympiad_participations (stage, subject_id, student_id, status) VALUES (?, ?, ?, ?)',
                [stage, subject_id, student_id, 'Участник']
            );
        }
        res.json({ message: 'Участники добавлены' });
    } catch (error) {
        console.error('Ошибка в /api/olympiads/participants:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/api/olympiads/result', async (req, res) => {
    try {
        const { stage, subject_id, student_id, status } = req.body;
        const validStatuses = ['Участник', 'Призёр', 'Победитель'];
        if (!validStatuses.includes(status)) {
            throw new Error('Недопустимый статус. Допустимые значения: Участник, Призёр, Победитель');
        }
        await db.execute(
            'UPDATE olympiad_participations SET status = ? WHERE stage = ? AND subject_id = ? AND student_id = ?',
            [status, stage, subject_id, student_id]
        );
        res.json({ message: 'Результат обновлён' });
    } catch (error) {
        console.error('Ошибка в /api/olympiads/result:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;