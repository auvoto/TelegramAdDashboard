const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const { storage } = require('./storage');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function setupAuth(app) {
  console.log('Setting up authentication...');

  // Configure session middleware with proper settings
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'sid', // Set a specific cookie name
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  };

  // Enable trust proxy if you're behind a reverse proxy
  app.set('trust proxy', 1);

  // Apply session middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Debug middleware to log session and auth status
  app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    next();
  });

  passport.use(new LocalStrategy(async (username, password, done) => {
    console.log('Login attempt for:', username);
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('User not found:', username);
        return done(null, false);
      }

      const isValid = await comparePasswords(password, user.password);
      console.log('Password valid:', isValid);

      if (!isValid) {
        return done(null, false);
      }

      console.log('Login successful for:', username);
      return done(null, user);
    } catch (error) {
      console.error('Login error:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user:', id);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  app.post('/api/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send('Username already exists');
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: 'employee'
      });

      req.login(user, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return res.status(500).send(err.message);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return next(err);
        }
        console.log('Login successful, session created for:', user.username);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res) => {
    const username = req.user?.username;
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).send(err.message);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).send(err.message);
        }
        res.clearCookie('sid');
        res.sendStatus(200);
      });
    });
  });

  app.get('/api/user', (req, res) => {
    console.log('GET /api/user - Session:', req.sessionID);
    console.log('Is authenticated:', req.isAuthenticated());

    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}

module.exports = { setupAuth };