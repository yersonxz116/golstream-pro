import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error("Internal Server Error:", err.message);

  res.status(500).json({
    error: "Internal server error occurred",
    ...(process.env.NODE_ENV === "development" ? { message: err.message } : {}),
  });
}
