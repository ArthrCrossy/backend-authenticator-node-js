# Backend Node.js Project

## 📋 Overview

This project is a backend implementation of a system to manage user authentication, calorie tracking, food entries, user profile management, and an administrative support message system. It is built using **Node.js** with **Express.js**, and **MySQL** as the database.

## 📂 Project Structure

## ⚙️ Features

### Authentication
- User registration, login, and profile management using **JWT authentication**.
- Middleware to ensure routes are accessible only to authenticated users.

### Profile Management
- CRUD operations for user profiles, including sex, birthdate, height, weight, activity level, and goals.

### Calorie Tracking
- Add, update, and delete entries for food tracking.
- Automatically calculates calorie consumption based on food details.

### Support System
- **Users** can send messages to **admins**.
- **Admins** have an inbox to view and mark messages as read.

### Broadcast System
- Admins can broadcast global announcements to all users.
- Users receive these announcements in real-time streams.

### Database Management
- MySQL database with structured tables for users, profiles, food entries, and messages.
- Auto table creation when the server starts.

### Event Streaming
- Uses `SSE` (Server-Sent Events) to broadcast real-time messages to users.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+
- **MySQL**: v8+
- Ensure `npm` is installed to manage dependencies.

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd backEndNode
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env
   DB_HOST=localhost
   DB_USER=<your-db-user>
   DB_PASSWORD=<your-db-password>
   DB_NAME=<your-db-name>
   DB_PORT=3306
   JWT_SECRET=<your-secret>
   PORT=3000
   ```

4. Start the MySQL database and ensure the schema is created:
   ```sh
   npm run start:db
   ```

5. Run the server:
   ```sh
   npm run dev
   ```
   The server will be available at `http://localhost:3000`.

### Endpoints
#### **Authentication**
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login an existing user.
- `POST /api/auth/newPassword`: Update password of an account.
- `GET /api/auth/profile`: View authenticated user's profile.
- `GET /api/auth/users`: View all registered users (requires admin privileges).

#### **Profile Management**
- `GET /api/profile/me`: Get your profile details.
- `PUT /api/profile/me`: Update your profile.
- `GET /api/profile/targets/day`: Get calorie target for a specific day.
- `GET /api/profile/targets/range`: Get calorie targets for a date range.

#### **Food Management**
- `GET /api/foods`: List all food items.
- `GET /api/foods/search?q=<query>`: Search for food items.
- `POST /api/foods`: Add a new food item.
- `PUT /api/foods/:id`: Update an existing food.
- `DELETE /api/foods/:id`: Delete a food item.

#### **Food Entries**
- `GET /api/food-entries`: List user's food entries for a specific day.
- `POST /api/food-entries`: Add a food entry for a particular day.
- `DELETE /api/food-entries/:id`: Remove a specific food entry.

#### **Broadcast System**
- `POST /admin/broadcast`: Send a broadcast to all users (restricted to admin role).
- `GET /me/broadcast`: List broadcast messages for the authenticated user.
- `GET /me/broadcast/unread-count`: Get the count of unread broadcasts.
- `POST /me/broadcast/:id/read`: Mark a broadcast as read.
- `GET /me/broadcast/stream`: Receive live broadcasts via `SSE`.

#### **Support System**
- `POST /api/support/messages`: Send a message to the admin (restricted to user role).
- `GET /api/admin/support/messages`: View support inbox (restricted to admin role).
- `PATCH /api/admin/support/messages/:id/read`: Mark a message as read.

## 🛠️ Development

### Scripts
- `npm run dev`: Start the server in development mode.
- `npm run start`: Start the server in production mode.
- `npm run lint`: Lint the codebase for errors using ESLint.
- `npm run test`: Run automated tests (if any).

### Tools & Technologies
- **Express.js**: Backend framework.
- **MySQL**: Relational database.
- **bcrypt.js**: Password hashing.
- **jsonwebtoken**: Authentication via JWT.
- **dotenv**: Environment variables management.
- **SSE (Server-Sent Events)**: Real-time notifications for users.

## 🛡️ Security

- Passwords are hashed with `bcrypt` before being stored in the database.
- JWT-based secure authentication system with token expiration.

## 💡 Future Improvements
- Add automated tests for controllers and models.
- Implement rate limiting for endpoints to prevent abuse.
- Improve error handling and logging mechanisms.
- Introduce role-based access control using middleware.
