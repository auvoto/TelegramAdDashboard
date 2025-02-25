import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Temporarily compare passwords directly for testing
async function comparePasswords(supplied: string, stored: string) {
  return supplied === stored;
}

export function setupAuth(app: Express) {
  // Add trust proxy to handle potential proxy issues
  app.set('trust proxy', 1);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: true, // Changed to true for better compatibility
    saveUninitialized: true, // Changed to true for better compatibility
    store: storage.sessionStore,
    cookie: {
      secure: false, // Allow non-HTTPS for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Attempting login for username:', username);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log('Login failed: User not found');
          return done(null, false, { message: 'Invalid username or password' });
        }

        const passwordMatch = await comparePasswords(password, user.password);
        console.log('Password comparison result:', passwordMatch);

        if (!passwordMatch) {
          console.log('Login failed: Password mismatch');
          return done(null, false, { message: 'Invalid username or password' });
        }

        if (!user.isActive) {
          console.log('Login failed: User is inactive');
          return done(null, false, { message: 'Account is inactive' });
        }

        console.log('Login successful:', { username, role: user.role });
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('Deserialization failed: User not found');
        return done(new Error('User not found'));
      }
      console.log('User deserialized successfully');
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  // Add registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.sendStatus(401);
      }

      if (req.user.role !== "admin") {
        return res.sendStatus(403);
      }

      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const user = await storage.createUser(userData);
      console.log('User created successfully:', user);
      res.status(201).json(user);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received:', req.body);
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Authentication failed:', info);
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        console.log('User logged in successfully:', user.username);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log('Logout request received');
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return next(err);
        }
        console.log('User logged out successfully');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('Unauthorized access attempt to /api/user');
      return res.sendStatus(401);
    }
    console.log('User data requested:', req.user);
    res.json(req.user);
  });
}