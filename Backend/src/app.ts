import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Rental Management API is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
