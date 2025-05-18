const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const classManagementRoutes = require('./routes/class_management');
const eventsRoutes = require('./routes/events');
const olympiadsRoutes = require('./routes/olympiads');
const tasksRoutes = require('./routes/tasks');
const summaryRoutes = require('./routes/summary');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Явный маршрут для корня
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

console.log('Подключение маршрутов...');
app.use('/', summaryRoutes); // Переместили summaryRoutes выше
app.use('/api/auth', authRoutes);
app.use('/', attendanceRoutes);
app.use('/', classManagementRoutes);
app.use('/', eventsRoutes);
app.use('/', olympiadsRoutes);
app.use('/', tasksRoutes);
console.log('Маршруты подключены');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});