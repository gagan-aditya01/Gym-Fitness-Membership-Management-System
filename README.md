# Gym Fitness Membership Management System

## Team
- **Developers**: Gagan Aditya and contributors
- **Contact**: gaganaditya@example.com

## Problem Statement
Modern gyms need a digital solution to manage memberships, class schedules, bookings, attendance tracking, and trainer‑member interactions. Existing systems are often fragmented, lacking a unified API that enforces robust authentication, role‑based access control (RBAC), and data consistency.

## Technical Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (stateless)
- **Validation**: Joi
- **Testing**: Jest & Supertest (to be added)
- **Version Control**: Git

## Setup & Installation
```bash
# Clone the repository
git clone https://github.com/yourorg/gym-fitness-management.git
cd gym-fitness-management

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values (see below)

# Run the development server
npm run dev
```
The server will start on `http://localhost:5000`.

## Environment Variables (`.env.example`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/gym_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```
> **Note**: No secret values are stored in the repository.

## Modules & Directory Structure
```
src/
├─ controllers/        # Request handling logic
├─ middleware/        # auth, validation, error handling
├─ models/            # Mongoose schemas (User, Membership, Attendance, …)
├─ routes/            # Express routers (auth, attendance, class, …)
├─ utils/             # Helper functions
└─ server.js          # Application entry point
```

## API Reference
All endpoints are prefixed with **/api**.

### Auth
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | – | Register a new user |
| `POST` | `/auth/login`    | – | Login and receive JWT |

### Attendance
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/attendance/checkin` | member | Check‑in for gym visit or class |
| `GET`  | `/attendance/me`      | member | View own attendance |
| `GET`  | `/attendance`         | admin  | View all attendance (filters supported) |

### Bookings
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET`  | `/booking/me` | member | List member bookings |
| `PATCH`| `/booking/:id/cancel` | member | Cancel a booking |

### Classes
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/class` | trainer | Create a new class |
| `POST` | `/class/:id/book` | member | Book a class |
| `GET`  | `/class/:id/bookings` | trainer, admin | View bookings for a class |

### Dashboard
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard` | member | Member‑specific summary (active membership, upcoming classes, recent attendance) |

### Membership Plans & Memberships
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET`  | `/membershipplan` | – | List all plans |
| `POST` | `/membershipplan` | admin | Create a new plan |
| `GET`  | `/membership/me` | member | View own membership |
| `POST` | `/membership` | member | Purchase a membership |

### Workout Notes
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/workoutnote` | trainer | Add a trainer note for a member |
| `GET`  | `/workoutnote/me` | member | Retrieve member’s notes |

### Admin Reports (`/admin/reports/...`)
All report endpoints require **admin** role and return aggregated data using MongoDB pipelines.
- Attendance aggregation by day & type
- Membership‑plan popularity
- Upcoming renewals (next 7 days)
- Class booking statistics

## Database Schema Overview
- **User** – `name`, `email`, `password`, `role`
- **MembershipPlan** – `name`, `price`, `durationMonths`
- **Membership** – `userId`, `planId`, `status`, `startDate`, `endDate`
- **ClassSession** – `title`, `trainerId`, `date`, `capacity`
- **Booking** – `memberId`, `classId`, `status`
- **Attendance** – `memberId`, `date`, `type`, optional `classId`
- **WorkoutNote** – `memberId`, `trainerId`, `note`, `date`

## Known Limitations & Future Work
- No email verification / password reset flows yet.
- Rate‑limiting and request throttling are not implemented.
- No front‑end UI – only a REST API.
- Testing coverage is minimal; adding unit/integration tests is a priority.
- Websocket for real‑time class updates could be added.

---
*Generated with ❤️ by the Gym Fitness Management team.*