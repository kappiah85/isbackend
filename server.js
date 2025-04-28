const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(cors({
    origin: ['https://isfrontend.onrender.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// In-memory storage for projects and users (replace with database in production)
let projects = [];
let users = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes
app.post('/api/register', (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Input validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format' 
            });
        }

        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, // TODO: Hash password in production
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = users.find(user => user.email === email && user.password === password);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

app.post('/api/projects', authenticateToken, upload.array('files'), (req, res) => {
    try {
        const { title, description, category, tags, video } = req.body;
        const files = req.files ? req.files.map(file => file.filename) : [];
        
        const project = {
            id: Date.now().toString(),
            title,
            description,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            files,
            video,
            status: 'pending',
            userId: req.user.id,
            createdAt: new Date().toISOString()
        };
        
        projects.push(project);
        res.status(201).json({ 
            success: true,
            message: 'Project submitted successfully',
            project
        });
    } catch (error) {
        console.error('Project submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

app.get('/api/projects', (req, res) => {
    try {
        const { category, tag } = req.query;
        let filteredProjects = [...projects];
        
        if (category) {
            filteredProjects = filteredProjects.filter(p => p.category === category);
        }
        
        if (tag) {
            filteredProjects = filteredProjects.filter(p => p.tags.includes(tag));
        }
        
        res.json({ 
            success: true,
            projects: filteredProjects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

app.get('/api/projects/:id', (req, res) => {
    try {
        const project = projects.find(p => p.id === req.params.id);
        if (!project) {
            return res.status(404).json({ 
                success: false,
                message: 'Project not found' 
            });
        }
        res.json({ 
            success: true,
            project
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

// Admin routes
app.get('/api/admin/projects', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied' 
        });
    }
    res.json({ 
        success: true,
        projects
    });
});

app.put('/api/admin/projects/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied' 
        });
    }

    try {
        const { status } = req.body;
        const project = projects.find(p => p.id === req.params.id);
        
        if (!project) {
            return res.status(404).json({ 
                success: false,
                message: 'Project not found' 
            });
        }
        
        project.status = status;
        res.json({ 
            success: true,
            project
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

app.delete('/api/admin/projects/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied' 
        });
    }

    try {
        const index = projects.findIndex(p => p.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ 
                success: false,
                message: 'Project not found' 
            });
        }
        
        projects.splice(index, 1);
        res.json({ 
            success: true,
            message: 'Project deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 