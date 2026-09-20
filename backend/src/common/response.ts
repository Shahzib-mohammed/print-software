// ===================================================================
// Standard API Response Formatter (TRD §9.2)
// Every API endpoint returns a predictable and consistent shape:
// { "success": boolean, "message": string, "data"?: any }
// ===================================================================

import { Response } from "express";

export function sendSuccess<T>(res: Response, message: string, data?: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== undefined ? data : null,
  });
}

export function sendError(res: Response, message: string, statusCode = 400, details?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: details !== undefined ? details : null,
  });
}
