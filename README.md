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
  SESSION_SECRET="your-secret-key-here"  # Can be any long random string

  # Optional (for Facebook Pixel)
  FACEBOOK_PIXEL_ID=""      # For tracking
  FACEBOOK_ACCESS_TOKEN=""  # For server-side events
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

### Features
- User authentication with role-based access
- Channel management with CRUD operations
- Facebook Pixel integration for tracking
- Landing page generation
- Analytics tracking
- File upload for channel logos

### Troubleshooting
1. If you see database connection errors:
   - Verify DATABASE_URL is correct in .env
   - Ensure PostgreSQL is running
   - Run `npm run db:push` to update schema

2. If session is not working:
   - Make sure SESSION_SECRET is set in .env
   - Clear browser cookies and try again
   - Check that you're not mixing HTTP and HTTPS in local development

3. If uploads are not working:
   - Check if uploads directory exists
   - Ensure write permissions are correct

4. If login is not working:
   - Clear browser cookies
   - Ensure you have at least one user in the database
   - Check database connection
   - Verify your username and password

### Local Development Notes
If running locally (outside Replit), you can safely remove these Replit-specific packages from package.json:
- "@replit/vite-plugin-cartographer"
- "@replit/vite-plugin-runtime-error-modal"
- "@replit/vite-plugin-shadcn-theme-json"

The core functionality will work without these packages.

### Data Migration from Replit to Local Setup
When moving the project from Replit to your local environment, follow these steps:

1. First, set up the folder structure:
```bash
mkdir -p uploads/logos
```

2. Copy all channel logo images from the Replit environment to your local `uploads/logos` directory. The following files need to be copied:
- crypto_gyan_logo.png
- CRYPTOMANTRA.jpeg
- class with dipak.jpeg
- Financial Catalysts.JPG
- Screenshot 2025-02-23 at 2.16.17â¯PM.png
- 12c258e8-32c4-49bb-9c77-49c07df2e9e2.webp

3. Set up your local PostgreSQL database:
   - Create a new database
   - Copy `.env.example` to `.env` and update the DATABASE_URL
   - Run the migration queries in this order:
      ```sql
      -- 1. Create tables
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'employee',
          is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS channels (
          id SERIAL PRIMARY KEY,
          uuid TEXT NOT NULL,
          name TEXT NOT NULL,
          subscribers INTEGER NOT NULL,
          logo TEXT NOT NULL,
          invite_link TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL REFERENCES users(id),
          custom_pixel_id TEXT,
          custom_access_token TEXT,
          deleted BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS pixel_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          pixel_id TEXT NOT NULL,
          access_token TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Create admin user
      INSERT INTO users (username, password, role, is_active) 
      VALUES ('auvoto', 'Auvoto@1234', 'admin', true)
      ON CONFLICT (username) DO NOTHING;
      ```

   - Then run the channel data import query provided separately (due to its length)

4. Start the application:
```bash
npm install
npm run dev
```

### Migrating to MongoDB
If you want to migrate to MongoDB instead of PostgreSQL, this will require significant changes:
- Replacing Drizzle ORM with Mongoose
- Rewriting the storage layer
- Updating session management
- Converting schemas to MongoDB format

Please request the MongoDB migration as a separate task if needed.