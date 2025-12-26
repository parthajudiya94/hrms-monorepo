# Multi-Tenant HRMS Application

A comprehensive Human Resource Management System (HRMS) built with multi-tenant architecture, supporting time tracking, user management, and role-based access control.

## Features

### Current Implementation
- ✅ Multi-tenant architecture
- ✅ Role-based access control (Admin, CEO, HR, CTO, CFO, Project Manager, Team Leader, Employee)
- ✅ User authentication (Login/Register)
- ✅ User creation with role assignment
- ✅ Time tracking:
  - Clock In/Out
  - Break In/Out
  - Real-time status tracking
  - Work hours calculation

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MySQL with mysql2
- JWT for authentication
- bcryptjs for password hashing
- Liquibase for database migrations

### Frontend
- React with TypeScript
- React Router for navigation
- Axios for API calls
- Modern CSS with responsive design

## Project Structure

```
hrms-monorepo/
├── packages/
│   ├── backend/          # Express API server
│   │   └── src/
│   │       ├── config/   # Database configuration
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── types/
│   │       └── server.ts
│   ├── web/              # React frontend
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── services/
│   │       └── types/
│   └── liquibase/         # Database migrations
│       └── changelog.xml
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE hrms;
```

2. Update database configuration in `packages/backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hrms
JWT_SECRET=your-secret-key
PORT=3001
```

3. Run Liquibase migrations (if you have Liquibase CLI set up) or manually execute the SQL from `packages/liquibase/changelog.xml`

### Installation

1. Install dependencies:
```bash
npm install
```

This will install dependencies for all packages using Lerna.

2. Install dependencies for individual packages:
```bash
cd packages/backend && npm install
cd ../web && npm install
```

### Running the Application

#### Development Mode (Both Frontend and Backend)

From the root directory:
```bash
npm start
```

This will start both the backend (port 3001) and frontend (port 3000) concurrently.

#### Individual Services

**Backend only:**
```bash
cd packages/backend
npm run dev
```

**Frontend only:**
```bash
cd packages/web
npm start
```

### Environment Variables

Create `.env` files in:
- `packages/backend/.env` - Backend configuration
- `packages/web/.env` - Frontend configuration (optional, defaults to `http://localhost:3001/api`)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users (Requires Authentication)
- `POST /api/users` - Create new user
- `GET /api/users` - Get all users (tenant-scoped)
- `GET /api/users/roles` - Get all roles (tenant-scoped)

### Time Tracking (Requires Authentication)
- `POST /api/time-tracking/clock-in` - Clock in
- `POST /api/time-tracking/clock-out` - Clock out
- `POST /api/time-tracking/break-in` - Start break
- `POST /api/time-tracking/break-out` - End break
- `GET /api/time-tracking/today` - Get today's status

## Default Data

The database migration creates a sample tenant "Sample Company" with default roles:
- Admin
- CEO
- HR
- CTO
- CFO
- Project Manager
- Team Leader
- Employee

### Default Login Credentials

After running the database migrations, you can login with:

- **Email:** `admin@sample.local`
- **Password:** `admin123`

This admin user has full access and can create additional users through the dashboard.

## Usage

1. **First Time Setup:**
   - Register a new user via `/api/auth/register` or create directly in database
   - Login with credentials

2. **User Management:**
   - Admin and HR users can create new users via the "Create User" button in the dashboard
   - Assign appropriate roles during user creation

3. **Time Tracking:**
   - Clock in when starting work
   - Use Break In/Out for breaks
   - Clock out when ending work
   - View real-time status and work hours

## Future Enhancements

- [ ] Dynamic role creation by Admin
- [ ] Leave management
- [ ] Attendance reports
- [ ] Employee profiles
- [ ] Department management
- [ ] Payroll integration
- [ ] Notifications system
- [ ] Multi-language support

## License

UNLICENSED

## Author

Parth Ajudiya

