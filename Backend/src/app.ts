import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import productAttributeRoutes from "./routes/product-attribute.routes";
import productRoutes from "./routes/product.routes";

export const app = express();

app.use(
  cors({
    origin:"*",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Rental Management API is healthy",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/categories", categoryRoutes);
app.use("/api/product-attributes", productAttributeRoutes);
app.use("/product-attributes", productAttributeRoutes);
app.use("/api/products", productRoutes);
app.use("/products", productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
