# Telegram Channel Marketing Platform

A specialized platform for creating high-conversion landing pages with advanced tracking capabilities.

## Local Development Setup

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL database
- npm or yarn package manager

### Setup Steps

1. **Clone the repository and install dependencies**
```bash
npm install
```

2. **Environment Configuration**
- Copy `.env.example` to `.env`
```bash
cp .env.example .env
```
- Update the `.env` file with your database credentials and other required variables

3. **Database Setup**
- The application uses Drizzle ORM with PostgreSQL
- After setting up DATABASE_URL in .env, run:
```bash
npm run db:push
```

4. **Start the Development Server**
```bash
npm run dev
```
The application will be available at `http://localhost:5000`

### Project Structure
- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared types and schemas
- `/migrations` - Database migrations

### Available Scripts
- `npm run dev` - Start development server
- `npm run db:push` - Push database schema changes
- `npm run build` - Build for production
- `npm start` - Start production server

## Features
- User authentication
- Channel management
- Facebook Pixel integration
- Landing page generation
- Analytics tracking
