# CareBridge

**CareBridge** is a specialized web platform designed to support children with autism and their caregivers. It bridges the gap between parents and professional mentors, providing a holistic ecosystem for development tracking, scheduling, resource sharing, and community support.

## 🚀 Executive Summary
The project aims to empower parents with data-driven tools to monitor their child's growth while facilitating professional guidance from mentors. The application focuses on a **"Premium, Calm, and Professional"** user experience, utilizing modern design principles to create a stress-free environment for users managing complex care routines.

## 🛠️ Technology Stack

### Frontend (User Interface)
-   **Framework**: [Next.js](https://nextjs.org/) (App Router Architecture)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Design System**: Custom **Glassmorphism** UI, responsive grid layouts, and smooth CSS animations (`animate-fadeIn`, `animate-slideUp`).
-   **State Management**: React Hooks (`useState`, `useEffect`) & Context API (`AuthContext`).
-   **Icons**: Native SVG icons / Heroicons concepts.

### Backend (API & Server)
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/) - RESTful API architecture.
-   **Security**: Use of `cors`, `helmet` (implied best practice), and `bcrypt` for password hashing.
-   **Authentication**: JSON Web Tokens (JWT) for stateless, secure session management.

### Database
-   **System**: [PostgreSQL](https://www.postgresql.org/)
-   **Driver**: `pg` (node-postgres)
-   **Schema**: Relational models for Users, Children, Activities, Sessions, posts, and Resources.

---

## 💡 Working Principles & Architecture

### 1. Role-Based Access Control (RBAC)
The system is built on a strict separation of concerns between two primary user roles:
-   **Parents**: Focus on *consuming* resources, *tracking* their own child's data, and *managing* daily routines.
-   **Mentors**: Focus on *providing* guidance, *managing* client connections, *scheduling* professional sessions, and *curating* resources.

### 2. Data-Driven Development
-   **Growth Logs**: Stored in a relational format to allow for historical tracking of height, weight, and head circumference.
-   **Visualizations**: Data is rendered into Growth Charts to provide actionable insights at a glance.

### 3. Community & Connection
-   **Forum System**: A threaded discussion board separates concerns into channels (Questions, Success Stories, etc.) to organize knowledge.
-   **Mentor Linking**: A direct database relationship (`mentor_clients` table) allows for secure data sharing and session management between a specific mentor and parent.

---

## ✨ Core Features

### 🔐 Authentication
-   Secure Registration & Login.
-   Protected Routes ensuring only authenticated users access dashboards.
-   Automatic role redirection.

### 📊 Dashboard
-   **Parent View**: Child profile switching, Growth Charts, Quick Stats.
-   **Mentor View**: Client monitoring list, Session shortcuts.

### 📅 Smart Scheduling
-   **Activity Schedule (Parent)**: Managing daily life (Speech Therapy, Playtime) with visual types.
-   **Session Management (Mentor)**: Professional appointment setting with meeting links.

### 📚 Resource Hub
-   A curated library of educational content.
-   Categorized by domain (Speech, Behavioral, Sensory).
-   Mentors can contribute new materials.

### 💬 Community Forum
-   Social platform for peer support.
-   Features include creating posts, liking, and nested commenting.

---

## 🏃‍♂️ How to Run

### Prerequisites
-   Node.js installed.
-   PostgreSQL installed and running.

### 1. Database Setup
Create a database named `carebridge` and run the schema script:
```bash
psql -U postgres -d carebridge -f server/database.sql
```

### 2. Backend Setup
Navigate to the server directory:
```bash
cd server
npm install
# Configure .env with DB credentials and JWT_SECRET
npm run dev
```

### 3. Frontend Setup
Navigate to the client directory:
```bash
cd client
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

# Care-Bridge

