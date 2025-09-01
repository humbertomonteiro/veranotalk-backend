// import { Request, Response, NextFunction } from "express";
// import { authAdmin } from "../../config/firebaseAdmin";

// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   const token = req.headers.authorization?.split("Bearer ")[1];
//   if (!token) {
//     return res.status(401).json({ error: "No token provided" });
//   }
//   try {
//     const decodedToken = await authAdmin.verifyIdToken(token);
//     (req as any).user = { uid: decodedToken.uid };
//     next();
//   } catch (err) {
//     console.error("Erro ao verificar token:", err);
//     res.status(401).json({ error: "Invalid token" });
//   }
// };

// export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   if (!(req as any).user) return res.status(401).json({ error: "Unauthorized" });
//   try {
//     const userDoc = await dbAdmin.collection("users").doc((req as any).user.uid).get();
//     if (!userDoc.exists || userDoc.data()?.role !== "admin") {
//       return res.status(403).json({ error: "Forbidden" });
//     }
//     next();
//   } catch (err) {
//     console.error("Erro ao verificar role:", err);
//     res.status(403).json({ error: "Forbidden" });
//   }
// };
