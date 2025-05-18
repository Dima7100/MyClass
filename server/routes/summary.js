const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/api/summary/students', async (req, res) => {
    console.log('Получен запрос /api/summary/students');
    try {
        console.log('Выполнение запроса к базе данных...');
        const [rows] = await db.execute('SELECT id, full_name FROM students ORDER BY full_name ASC');
        console.log('Получены данные:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Ошибка в /api/summary/students:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/summary/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const [student] = await db.execute(
            'SELECT full_name FROM students WHERE id = ?',
            [studentId]
        );
        if (!student.length) throw new Error('Ученик не найден');

        const [events] = await db.execute(
            `SELECT e.name 
             FROM events e 
             JOIN event_participations ep ON e.id = ep.event_id 
             WHERE ep.student_id = ?`,
            [studentId]
        );
        const [tasks] = await db.execute(
            `SELECT description 
             FROM tasks 
             WHERE student_id = ? AND completed = TRUE`,
            [studentId]
        );
        const [olympiads] = await db.execute(
            `SELECT subject_id, status 
             FROM olympiads 
             WHERE student_id = ?`,
            [studentId]
        );
        const [absences] = await db.execute(
            `SELECT date, status 
             FROM attendance 
             WHERE student_id = ?`,
            [studentId]
        );

        res.json({
            full_name: student[0].full_name,
            events: {
                total: (await db.execute('SELECT COUNT(*) FROM events'))[0][0]['COUNT(*)'],
                participated: events.map(e => e.name)
            },
            tasks: {
                completed: tasks.map(t => t.description),
                incomplete: (await db.execute(
                    `SELECT description 
                     FROM tasks 
                     WHERE student_id = ? AND completed = FALSE`,
                    [studentId]
                ))[0].map(t => t.description)
            },
            olympiads: { participations: olympiads.map(o => [o.subject_id, o.status]) },
            absences: {
                totalDays: (await db.execute('SELECT COUNT(DISTINCT date) FROM attendance'))[0][0]['COUNT(DISTINCT date)'],
                totalAbsences: (await db.execute('SELECT COUNT(*) FROM attendance WHERE status = ?', ['Пропуск']))[0][0]['COUNT(*)'],
                records: absences.map(a => [a.date, a.status])
            }
        });
    } catch (error) {
        console.error('Ошибка в /api/summary/:studentId:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;