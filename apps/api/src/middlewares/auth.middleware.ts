import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "PUBLIC" | "USER" | "OWNER" | "ADMIN";
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    req.user = { id: "anonymous", email: "", role: "PUBLIC" };
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      console.warn("[Auth] Missing SUPABASE_JWT_SECRET environment variable");
      // Fallback to PUBLIC if server is misconfigured to prevent crash, but log it.
      req.user = { id: "anonymous", email: "", role: "PUBLIC" };
      return next();
    }

    const decoded = jwt.verify(token, secret) as any;
    
    // Default mapped role from token. You can configure this based on Zenith's specific logic.
    let role: "USER" | "OWNER" | "ADMIN" = "USER";
    if (decoded.role === "admin") {
      role = "ADMIN";
    } else if (decoded.email === "sang.trantamly@gmail.com") {
      role = "OWNER";
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: role,
    };
    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error instanceof Error ? error.message : error);
    // If token is invalid/expired, we downgrade them to PUBLIC instead of hard failing 401 
    // unless they hit a protected route, in which case requireRole will handle the 401/403.
    req.user = { id: "anonymous", email: "", role: "PUBLIC" };
    next();
  }
};

export const requireRole = (allowedRoles: ("PUBLIC" | "USER" | "OWNER" | "ADMIN")[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // If the route allows PUBLIC, anyone can access
    if (allowedRoles.includes("PUBLIC")) {
      return next();
    }

    const userRole = req.user?.role || "PUBLIC";
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: "Access denied. Insufficient permissions." });
      return;
    }

    next();
  };
};
