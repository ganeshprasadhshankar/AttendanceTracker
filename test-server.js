const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002; // Different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json()); // Using express.json() instead of bodyParser
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Login credentials
const loginFile = './login.json';

function readLoginCredentials() {
    try {
        const data = fs.readFileSync(loginFile, 'utf8');
        console.log('Login file contents:', data);
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading login credentials:', err.message);
        return { users: [] };
    }
}

// Simple login route
app.post('/api/login', (req, res) => {
    console.log('=== LOGIN REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }
    
    try {
        const loginData = readLoginCredentials();
        console.log('Available users:', loginData.users);
        
        const user = loginData.users.find(
            u => u.username === username.trim() && u.password === password.trim()
        );
        
        console.log('User found:', user);
        
        if (user) {
            console.log('Login successful');
            res.json({ 
                success: true, 
                message: 'Login successful',
                username: user.username
            });
        } else {
            console.log('Invalid credentials');
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + err.message 
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.path);
    res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('  GET  /test');
    console.log('  POST /api/login');
    console.log('  GET  /');
    
    // Test login file reading
    console.log('\n--- Testing login file ---');
    const loginData = readLoginCredentials();
    console.log('Login data loaded:', loginData);
}); 