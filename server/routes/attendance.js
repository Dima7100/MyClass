const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/api/attendance', async (req, res) => {
    try {
        const { day, student } = req.query;
        let query = 'SELECT s.full_name AS student, a.date, a.status FROM attendance a JOIN students s ON a.student_id = s.id';
        const params = [];

        if (day) {
            query += ' WHERE DATE(a.date) = ?';
            params.push(day);
        }
        if (student) {
            query += (day ? ' AND' : ' WHERE') + ' s.full_name LIKE ?';
            params.push(`%${student}%`);
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/statistics', async (req, res) => {
    try {
        const { student } = req.query;
        let query = `
            SELECT 
                s.full_name AS student,
                COUNT(a.id) AS total,
                SUM(CASE WHEN a.is_excused = TRUE THEN 1 ELSE 0 END) AS excused,
                SUM(CASE WHEN a.is_excused = FALSE THEN 1 ELSE 0 END) AS unexcused
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id
        `;
        const params = [];

        if (student) {
            query += ' WHERE s.full_name LIKE ?';
            params.push(`%${student}%`);
        }
        query += ' GROUP BY s.id, s.full_name';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/summary/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();

        // Данные о пропусках
        const [absences] = await db.execute(`
            SELECT date, status, is_excused FROM attendance WHERE student_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
        `, [studentId, month + 1, year]);
        const absenceRecords = absences.map(a => [a.date.toISOString().split('T')[0], a.status + (a.is_excused ? ' (обоснован)' : '')]);
        const totalAbsences = absences.length;

        // Данные о мероприятиях
        const [eventParticipations] = await db.execute(`
            SELECT e.name, e.weight FROM event_participations ep
            JOIN events e ON ep.event_id = e.id
            WHERE ep.student_id = ?
        `, [studentId]);
        const participatedEvents = eventParticipations.map(ep => ep.name);
        const [totalEvents] = await db.execute('SELECT COUNT(*) as count FROM events');
        const eventTotal = totalEvents[0].count;

        // Данные о поручениях
        const [tasks] = await db.execute(`
            SELECT description, completed FROM tasks WHERE student_id = ?
        `, [studentId]);
        const completedTasks = tasks.filter(t => t.completed).map(t => t.description);
        const incompleteTasks = tasks.filter(t => !t.completed).map(t => t.description);

        // Данные об олимпиадах
        const [olympiads] = await db.execute(`
            SELECT subject_id, stage, status FROM olympiads WHERE student_id = ?
        `, [studentId]);
        const olympiadParticipations = olympiads.map(o => [`${o.stage} - ${o.subject_id}`, o.status]);

        res.json({
            full_name: (await db.execute('SELECT full_name FROM students WHERE id = ?', [studentId]))[0][0].full_name,
            events: { participated: participatedEvents, total: eventTotal },
            tasks: { completed: completedTasks, incomplete: incompleteTasks },
            olympiads: { participations: olympiadParticipations },
            absences: { records: absenceRecords, totalDays, totalAbsences }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/summary/students', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name FROM students');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;