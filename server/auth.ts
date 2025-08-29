import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === "production";
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax", // Use 'none' for cross-site requests in production
      secure: isProduction, // Use secure cookies in production
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      // Don't set domain - let the browser handle it automatically
      path: '/',
    },
    name: 'connect.sid', // Explicitly set the session cookie name
    proxy: true, // Trust the proxy
  };

  app.use(session(sessionSettings));

  // Setup Replit auth if available  
  if (process.env.REPL_ID && process.env.REPLIT_DOMAINS) {
    // Replit auth route - simplified approach
    app.get('/api/auth/replit', async (req: AuthRequest, res: Response) => {
      try {
        // Get Replit user info from headers
        const replitUser = req.headers['x-replit-user-name'] as string;
        const replitUserId = req.headers['x-replit-user-id'] as string;
        const replitUserRoles = req.headers['x-replit-user-roles'] as string;
        
        if (!replitUser || !replitUserId) {
          return res.status(401).json({ error: 'No Replit user found' });
        }
        
        // Create/update user in database
        const user = await storage.upsertUser({
          id: `replit-${replitUserId}`,
          email: `${replitUser}@replit.user`,
          username: replitUser,
          authProvider: 'replit',
        });
        
        // Set session
        req.session.userId = user.id;
        req.user = {
          id: user.id,
          email: user.email!,
          username: user.username || undefined,
        };
        
        // Explicitly save the session before responding
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ error: "Failed to save session" });
          }
          res.json(req.user);
        });
      } catch (error) {
        console.error('Replit auth error:', error);
        res.status(500).json({ error: 'Failed to authenticate with Replit' });
      }
    });
  }

  // Registration endpoint
  app.post("/api/register", async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        authProvider: "local",
      });

      // Set session
      req.session.userId = user.id;
      req.user = {
        id: user.id,
        email: user.email!,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      // Explicitly save the session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        res.status(201).json(req.user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req: AuthRequest, res: Response) => {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: "Username/email and password are required" });
      }

      // Find user by username or email
      let user = await storage.getUserByEmail(usernameOrEmail);
      if (!user) {
        user = await storage.getUserByUsername(usernameOrEmail);
      }

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.user = {
        id: user.id,
        email: user.email!,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      // Explicitly save the session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        res.json(req.user);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: AuthRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Google login endpoint
  app.post("/api/auth/google", async (req: AuthRequest, res: Response) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: "ID token is required" });
      }

      // Verify the Firebase ID token
      const admin = await import("firebase-admin");
      if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountJson) {
          throw new Error("FIREBASE_SERVICE_ACCOUNT not found");
        }
        
        let serviceAccount;
        try {
          serviceAccount = JSON.parse(serviceAccountJson);
        } catch (parseError) {
          throw new Error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT");
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decoded;
      
      if (!email || !decoded.email_verified) {
        return res.status(401).json({ error: "Email not verified" });
      }

      // Split name into first and last
      const nameParts = name ? name.split(' ') : [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      // Upsert user in database
      const user = await storage.upsertUser({
        id: uid,
        email: email || null,
        firstName,
        lastName,
        profileImageUrl: picture || null,
        authProvider: "google",
      });

      // Set session
      req.session.userId = user.id;
      req.user = {
        id: user.id,
        email: user.email!,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      // Explicitly save the session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json(req.user);
      });
    } catch (error) {
      console.error("Google auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        error: "Failed to login with Google",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user.id,
        email: user.email!,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      res.json(req.user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Test authentication endpoint for production debugging
  app.get("/api/auth/test", (req: AuthRequest, res: Response) => {
    const headers = req.headers;
    res.json({
      sessionId: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      isProduction: process.env.NODE_ENV === "production",
      domain: process.env.REPLIT_DOMAINS,
      replId: process.env.REPL_ID,
      deploymentId: process.env.REPLIT_DEPLOYMENT_ID,
      origin: headers.origin,
      referer: headers.referer,
      host: headers.host,
      forwardedFor: headers['x-forwarded-for'],
      forwardedProto: headers['x-forwarded-proto'],
      cookie: headers.cookie ? 'present' : 'missing',
      sessionCookie: headers.cookie?.includes('connect.sid') ? 'found' : 'not found',
    });
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email!,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};