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
  
  // Log database connection for debugging
  console.log("[Auth Setup] Initializing session store");
  console.log("[Auth Setup] DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("[Auth Setup] Environment:", process.env.NODE_ENV);
  
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "sessions",
    errorLog: (error) => {
      console.error("[Session Store Error]:", error);
    },
  });
  
  // Test database connection
  sessionStore.pruneSessions((err) => {
    if (err) {
      console.error("[Session Store] Failed to connect to database:", err);
    } else {
      console.log("[Session Store] Successfully connected to database");
    }
  });

  const isProduction = process.env.NODE_ENV === "production";
  
  // Ensure we have a consistent session secret
  const sessionSecret = process.env.SESSION_SECRET || "langua-legacy-session-secret-2025";
  console.log("[Auth Setup] Session secret configured:", sessionSecret.substring(0, 5) + "...");
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: true, // Force session saves
    saveUninitialized: true, // Ensure sessions are created
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax", // 'none' required for cross-origin in production
      secure: isProduction, // Required with sameSite: none
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      // Don't set domain - let the browser handle it automatically
      path: '/',
    },
    name: 'connect.sid', // Explicitly set the session cookie name
    proxy: isProduction, // Only trust proxy in production
  };

  app.use(session(sessionSettings));
  
  // Log session middleware setup
  console.log("[Auth Setup] Session middleware configured with:", {
    secure: sessionSettings.cookie?.secure,
    sameSite: sessionSettings.cookie?.sameSite,
    httpOnly: sessionSettings.cookie?.httpOnly,
    proxy: sessionSettings.proxy,
    env: process.env.NODE_ENV
  });

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
        
        // Create user object
        req.user = {
          id: user.id,
          email: user.email!,
          username: user.username || undefined,
        };
        
        // Regenerate session for security and proper saving
        req.session.regenerate((regenErr) => {
          if (regenErr) {
            console.error("[Replit Auth] Session regenerate error:", regenErr);
            return res.status(500).json({ error: "Failed to regenerate session" });
          }
          
          // Set userId in the new session
          req.session.userId = user.id;
          
          // Force save the session
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ error: "Failed to save session" });
            }
            res.json(req.user);
          });
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

      // Create user object
      req.user = {
        id: user.id,
        email: user.email!,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      // Regenerate session for security and proper saving
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.error("[Register] Session regenerate error:", regenErr);
          return res.status(500).json({ message: "Failed to regenerate session" });
        }
        
        // Set userId in the new session
        req.session.userId = user.id;
        
        // Force save the session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }
          res.status(201).json(req.user);
        });
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

      // Create user object
      req.user = {
        id: user.id,
        email: user.email!,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      // Regenerate session for security and proper saving
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.error("[Login] Session regenerate error:", regenErr);
          return res.status(500).json({ message: "Failed to regenerate session" });
        }
        
        // Set userId in the new session
        req.session.userId = user.id;
        
        // Force save the session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }
          res.json(req.user);
        });
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
      console.log("[Google Auth] Starting Firebase verification");
      const admin = await import("firebase-admin");
      
      if (!admin.apps.length) {
        console.log("[Google Auth] Initializing Firebase Admin SDK");
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        if (!serviceAccountJson) {
          console.error("[Google Auth] FIREBASE_SERVICE_ACCOUNT env var not found");
          throw new Error("FIREBASE_SERVICE_ACCOUNT not found");
        }
        
        console.log("[Google Auth] Service account JSON length:", serviceAccountJson.length);
        
        let serviceAccount;
        try {
          serviceAccount = JSON.parse(serviceAccountJson);
          console.log("[Google Auth] Service account parsed, project_id:", serviceAccount.project_id);
        } catch (parseError) {
          console.error("[Google Auth] Failed to parse service account JSON:", parseError);
          throw new Error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT");
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
        console.log("[Google Auth] Firebase Admin SDK initialized");
      } else {
        console.log("[Google Auth] Firebase Admin SDK already initialized");
      }

      console.log("[Google Auth] Verifying ID token...");
      const decoded = await admin.auth().verifyIdToken(idToken);
      console.log("[Google Auth] Token verified for uid:", decoded.uid);
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

      // Create user object
      req.user = {
        id: user.id,
        email: user.email!,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      // Regenerate session to ensure proper saving in production
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.error("[Auth Debug] Session regenerate error:", regenErr);
          return res.status(500).json({ error: "Failed to regenerate session" });
        }
        
        // Set userId in the new session
        req.session.userId = user.id;
        
        // Log for debugging
        console.log("[Auth Debug] Google auth successful for user:", user.email);
        console.log("[Auth Debug] New Session ID:", req.sessionID);
        console.log("[Auth Debug] Setting userId:", user.id);
        
        // Force save the session with callback
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[Auth Debug] Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session", details: saveErr.message });
          }
          console.log("[Auth Debug] Session saved successfully");
          console.log("[Auth Debug] Session data after save:", { 
            sessionId: req.sessionID,
            userId: req.session.userId,
            cookie: req.session.cookie
          });
          res.json(req.user);
        });
      });
    } catch (error) {
      console.error("[Google Auth] Full error details:", error);
      console.error("[Google Auth] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Temporarily show error details in production for debugging
      res.status(500).json({ 
        error: "Failed to login with Google",
        details: errorMessage,
        env: process.env.NODE_ENV,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT
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
  
  // Clear session for testing - useful for debugging auth issues
  app.post("/api/auth/test/clear", (req: AuthRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to clear session" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Session cleared successfully" });
    });
  });

  // Test authentication endpoint for production debugging
  app.get("/api/auth/test", async (req: AuthRequest, res: Response) => {
    const headers = req.headers;
    
    // Try to retrieve session data from store directly
    let sessionData = null;
    if (req.sessionID && sessionStore) {
      try {
        sessionData = await new Promise((resolve, reject) => {
          sessionStore.get(req.sessionID, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
      } catch (err) {
        console.error("Error fetching session from store:", err);
      }
    }
    
    res.json({
      sessionId: req.sessionID,
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      sessionFromStore: sessionData ? { 
        hasUserId: !!(sessionData as any).userId,
        userId: (sessionData as any).userId,
        keys: Object.keys(sessionData)
      } : null,
      isProduction: process.env.NODE_ENV === "production",
      domain: process.env.REPLIT_DOMAINS,
      replId: process.env.REPL_ID,
      deploymentId: process.env.REPLIT_DEPLOYMENT_ID || "not-set",
      actualDeploymentId: process.env.DEPLOYMENT_ID || process.env.REPLIT_DEPLOYMENT_ID || "none",
      databaseUrl: process.env.DATABASE_URL ? "present" : "missing",
      origin: headers.origin,
      referer: headers.referer,
      host: headers.host,
      forwardedFor: headers['x-forwarded-for'],
      forwardedProto: headers['x-forwarded-proto'],
      cookie: headers.cookie ? 'present' : 'missing',
      sessionCookie: headers.cookie?.includes('connect.sid') ? 'found' : 'not found',
      cookieValue: headers.cookie?.split('connect.sid=')[1]?.split(';')[0] || 'not found',
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