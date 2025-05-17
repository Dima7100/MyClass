const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'rjvuytoew',
    database: 'my_class_db',
    connectionLimit: 10
});

(async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                birth_date DATE,
                phone VARCHAR(20),
                email VARCHAR(255),
                passport VARCHAR(50),
                snils VARCHAR(20),
                parents TEXT    
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                is_excused BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                weight INT NOT NULL
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS event_participations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT,
                student_id INT,
                FOREIGN KEY (event_id) REFERENCES events(id),
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                student_id INT,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS olympiads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_id INT,
                stage VARCHAR(50),
                student_id INT,
                status VARCHAR(20),
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);
        connection.release();
    } catch (error) {
        console.error('Ошибка создания таблиц:', error);
    }
})();

module.exports = pool;