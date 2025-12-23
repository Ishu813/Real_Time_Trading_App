import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthJwtPayload extends JwtPayload {
  id: string;
  email: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown;

    // Runtime + TS-safe validation
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("id" in decoded) ||
      !("email" in decoded)
    ) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const payload = decoded as AuthJwtPayload;

    req.user = {
      id: payload.id,
      email: payload.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
