# Innovation Project Showcase Portal

A platform for students to submit, showcase, and explore innovation projects within an institution.

## Features

- User Authentication (Login/Signup)
- Project Submission with files and video links
- Project Browsing with filters
- Project Details Page with comments
- Admin Dashboard for project approvals

## Project Structure

```
.
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── submit.html
│   └── projects.html
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

### Frontend Setup

1. The frontend is served statically by the backend server
2. Open `http://localhost:3000` in your web browser

## API Endpoints

### Authentication
- POST `/api/register` - Register a new user
- POST `/api/login` - Login user

### Projects
- POST `/api/projects` - Submit a new project
- GET `/api/projects` - Get all projects (with optional filters)
- GET `/api/projects/:id` - Get project details

### Admin
- GET `/api/admin/projects` - Get all projects (admin view)
- PUT `/api/admin/projects/:id` - Update project status
- DELETE `/api/admin/projects/:id` - Delete a project

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- File Storage: Local file system (multer)
- Authentication: Basic (JWT implementation needed for production)

## Security Notes

- This is a basic implementation. For production use:
  - Implement proper password hashing
  - Add JWT authentication
  - Use a proper database instead of in-memory storage
  - Add input validation and sanitization
  - Implement proper file upload security measures 