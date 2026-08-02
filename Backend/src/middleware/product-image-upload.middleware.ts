import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { AppError } from "./error.middleware";
import { env } from "../config/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_IMAGES_PER_REQUEST = 10;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "flexrent/products",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      // Optional: transformation for sizing/optimization
      // transformation: [{ width: 1000, height: 1000, crop: "limit" }]
    };
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

export const PRODUCT_IMAGE_FIELD_NAME = "images";
export const PRODUCT_IMAGE_MAX_FILES = MAX_IMAGES_PER_REQUEST;

