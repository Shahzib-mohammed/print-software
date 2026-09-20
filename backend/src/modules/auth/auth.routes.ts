// ===================================================================
// Auth API Routes
// ===================================================================

import { Router, Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess, sendError } from "../../common/response";

const router = Router();

// POST /api/auth/login — Shopkeeper login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const result = await AuthService.login(email, password);
    return sendSuccess(res, "Login successful", result);
  } catch (err: any) {
    return sendError(res, err.message || "Authentication failed", 401);
  }
});

export default router;
