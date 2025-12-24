import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Runtime + TS-safe validation
        if (typeof decoded !== "object" ||
            decoded === null ||
            !("id" in decoded) ||
            !("email" in decoded)) {
            return res.status(401).json({ message: "Invalid token payload" });
        }
        const payload = decoded;
        req.user = {
            id: payload.id,
            email: payload.email,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
//# sourceMappingURL=auth.js.map