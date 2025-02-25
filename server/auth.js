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

  const sessionSettings = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log('Attempting login for username:', username);
      try {
        const user = await storage.getUserByUsername(username);
        const passwordMatch = await comparePasswords(password, user?.password || '');
        console.log('Password comparison result:', passwordMatch);
        if (!user || !passwordMatch) {
          console.log('Login failed: Invalid credentials');
          return done(null, false);
        }
        console.log('Login successful:', { username: user.username, role: user.role });
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

  passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user:', id);
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  // API Routes for authentication
  app.post('/api/register', async (req, res, next) => {
    console.log('Registration attempt for username:', req.body.username);
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Registration failed: Username exists');
        return res.status(400).send('Username already exists');
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        console.log('Registration successful:', user.username);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post('/api/login', (req, res, next) => {
    console.log('Login request received:', { username: req.body.username, password: '***' });
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Login failed: No user found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      req.login(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return next(err);
        }
        console.log('User logged in successfully:', user.username);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res, next) => {
    const username = req.user?.username;
    console.log('Logout request for user:', username);
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('User logged out successfully:', username);
      res.sendStatus(200);
    });
  });

  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('Unauthorized access attempt to /api/user');
      return res.sendStatus(401);
    }
    console.log('User data requested for:', req.user.username);
    res.json(req.user);
  });
}

module.exports = { setupAuth };