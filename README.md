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
- Update the `.env` file with your values:
  ```
  # Required
  DATABASE_URL="postgresql://user:password@host:port/database"
  SESSION_SECRET="your-secret-key-here"

  # Optional (for Facebook Pixel)
  FACEBOOK_PIXEL_ID=""
  FACEBOOK_ACCESS_TOKEN=""
  ```

3. **Database Setup**
- Make sure your PostgreSQL database is running
- Set your database URL in `.env`
- Run database migrations:
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
- `/uploads` - Uploaded files (created automatically)

### Available Scripts
- `npm run dev` - Start development server
- `npm run db:push` - Push database schema changes
- `npm run build` - Build for production
- `npm start` - Start production server

### Important Notes
1. Make sure your PostgreSQL database is running before starting the application
2. The uploads directory will be created automatically when needed
3. All environment variables should be set in `.env` file
4. For development, the server runs on port 5000

## Features
- User authentication with role-based access
- Channel management with CRUD operations
- Facebook Pixel integration for tracking
- Landing page generation
- Analytics tracking
- File upload for channel logos

## Troubleshooting
1. If you see database connection errors:
   - Verify DATABASE_URL is correct in .env
   - Ensure PostgreSQL is running
   - Run `npm run db:push` to update schema

2. If session is not working:
   - Make sure SESSION_SECRET is set in .env
   - Clear browser cookies and try again

3. If uploads are not working:
   - Check if uploads directory exists
   - Ensure write permissions are correct