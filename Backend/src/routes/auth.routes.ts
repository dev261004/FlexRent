import { Router } from "express";
import {
  login,
  logout,
  me,
  refresh,
  register,
  updateProfile,
} from "../controllers/auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", verifyJWT, me);
router.put("/profile", verifyJWT, updateProfile);

export default router;
