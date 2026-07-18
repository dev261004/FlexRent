import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";
import { Request } from "express";
import { AppError } from "./error.middleware";

const MAX_IMAGES_PER_REQUEST = 10;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const PRODUCT_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "products");
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, PRODUCT_UPLOAD_DIR);
  },
  filename: (req: Request, file, callback) => {
    const productId =
      typeof req.params.productId === "string" ? req.params.productId : "unknown";
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const random = crypto.randomBytes(4).toString("hex");

    callback(
      null,
      `product_${productId}_${Date.now()}_${random}.${extension}`
    );
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(new AppError(400, "Only jpg, jpeg, png, and webp images are allowed"));
    return;
  }

  callback(null, true);
};

export const productImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: MAX_IMAGES_PER_REQUEST,
  },
});

export const PRODUCT_IMAGE_UPLOAD_DIR = PRODUCT_UPLOAD_DIR;
export const PRODUCT_IMAGE_UPLOAD_URL_PREFIX = "/uploads/products";
export const PRODUCT_IMAGE_FIELD_NAME = "images";
export const PRODUCT_IMAGE_MAX_FILES = MAX_IMAGES_PER_REQUEST;
