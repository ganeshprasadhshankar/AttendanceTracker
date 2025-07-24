const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Use express.json() instead of bodyParser
app.use(express.urlencoded({ extended: true })); // Use express.urlencoded()
// API routes MUST come before static files middleware
// (Moving static files to after API routes)

// JSON file-based database
const dbFile = './attendance.json';
const loginFile = './login.json';

// Initialize database file
function initializeDatabase() {
    if (!fs.existsSync(dbFile)) {
        fs.writeFileSync(dbFile, JSON.stringify({ attendance: [], nextId: 1 }, null, 2));
        console.log('Attendance database file created.');
    } else {
        console.log('Connected to attendance database.');
    }
}

// Initialize login file
function initializeLoginFile() {
    if (!fs.existsSync(loginFile)) {
        const defaultUsers = {
            users: [
                { username: "admin", password: "admin123" },
                { username: "manager", password: "manager123" },
                { username: "hr", password: "hr123" }
            ]
        };
        fs.writeFileSync(loginFile, JSON.stringify(defaultUsers, null, 2));
        console.log('Login credentials file created.');
    } else {
        console.log('Connected to login credentials.');
    }
}

// Read database
function readDatabase() {
    try {
        const data = fs.readFileSync(dbFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database:', err.message);
        return { attendance: [], nextId: 1 };
    }
}

// Read login credentials
function readLoginCredentials() {
    try {
        const data = fs.readFileSync(loginFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading login credentials:', err.message);
        return { users: [] };
    }
}

// Write database
function writeDatabase(data) {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing database:', err.message);
        return false;
    }
}

// Initialize database and login file
initializeDatabase();
initializeLoginFile();

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login validation
app.post('/api/login', (req, res) => {
    console.log('Login request received:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }
    
    try {
        const loginData = readLoginCredentials();
        console.log('Login data loaded:');
        console.log('Looking for user with username and password');
        
        // Find user with matching credentials
        const user = loginData.users.find(
            u => u.username === username.trim() && u.password === password.trim()
        );
        
        console.log('User found');
        
        if (user) {
            console.log('Login successful for user:', user.username);
            res.json({ 
                success: true, 
                message: 'Login successful',
                username: user.username
            });
        } else {
            console.log('Invalid credentials for username:', username);
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Mark attendance
app.post('/api/attendance', (req, res) => {
    const { associate_id, associate_name, date } = req.body;
    
    if (!associate_id || !associate_name || !date) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Validate Associate ID is a number
    if (!/^\d+$/.test(associate_id.toString().trim())) {
        return res.status(400).json({ 
            success: false, 
            message: 'Associate ID must contain only numbers' 
        });
    }
    
    // Validate Associate Name contains only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(associate_name.trim())) {
        return res.status(400).json({ 
            success: false, 
            message: 'Associate Name must contain only letters and spaces' 
        });
    }
    
    // Additional validation for empty names
    if (associate_name.trim().length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Associate Name cannot be empty or contain only spaces' 
        });
    }
    
    const db = readDatabase();
    
    // Check if attendance already marked for today
    const existingRecord = db.attendance.find(
        record => record.associate_id === associate_id && record.date === date
    );
    
    if (existingRecord) {
        return res.status(400).json({ 
            success: false, 
            message: 'Attendance already marked for today' 
        });
    }
    
    // Create new attendance record
    const newRecord = {
        id: db.nextId,
        associate_id,
        associate_name,
        date,
        created_at: new Date().toISOString()
    };
    
    db.attendance.push(newRecord);
    db.nextId++;
    
    if (writeDatabase(db)) {
        res.json({ 
            success: true, 
            message: 'Attendance marked successfully',
            id: newRecord.id 
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save attendance' 
        });
    }
});

// Get all attendance records
app.get('/api/attendance', (req, res) => {
    const { date } = req.query;
    
    try {
        const db = readDatabase();
        let records = db.attendance;
        
        if (date) {
            records = records.filter(record => record.date === date);
        }
        
        // Sort by created_at DESC
        records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.json({ 
            success: true, 
            data: records 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Database error' 
        });
    }
});

// Get attendance for specific associate
app.get('/api/attendance/:associate_id', (req, res) => {
    const { associate_id } = req.params;
    
    try {
        const db = readDatabase();
        const records = db.attendance
            .filter(record => record.associate_id === associate_id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({ 
            success: true, 
            data: records 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Database error' 
        });
    }
});

// Static files middleware - AFTER API routes
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server gracefully...');
    process.exit(0);
}); 