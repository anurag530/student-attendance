const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const sequelize = new Sequelize('express-mysql', 'root', 'root', {
    dialect: 'mysql',
    host: 'localhost'
});

// Models definition
const Student = sequelize.define('Student', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

const Attendance = sequelize.define('Attendance', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('present', 'absent'),
        allowNull: false,
    },
});

// Establish associations
Student.hasMany(Attendance);
Attendance.belongsTo(Student);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// API routes
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.findAll();
        res.json({ students });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to fetch students' });
    }
});

app.post('/api/students', async (req, res) => {
    const { name } = req.body;
    try {
        const student = await Student.create({ name });
        res.status(201).json({ student });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to create student' });
    }
});

app.get('/api/attendance', async (req, res) => {
    const { date } = req.query;
    try {
        const attendance = await Attendance.findAll({
            where: { date },
            include: [{ model: Student, attributes: ['id', 'name'] }],
        });
        res.json({ attendance });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to fetch attendance data' });
    }
});

app.post('/api/attendance', async (req, res) => {
    const { studentId, attendanceStatus, date } = req.body;
    try {
        const student = await Student.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await Attendance.create({ StudentId: studentId, date, status: attendanceStatus });
        res.sendStatus(201);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
});

app.get('/api/attendance/report', async (req, res) => {
    try {
        const totalDays = await Attendance.count();
        const presentDays = await Attendance.count({ where: { status: 'present' } });
        const percentage = (presentDays / totalDays) * 100 || 0;
        res.json({ totalDays, presentDays, percentage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to fetch attendance report' });
    }
});

// Sync database and start server
sequelize.sync().then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
