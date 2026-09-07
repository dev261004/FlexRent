import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/user.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyJWT);
router.use(requireRole(["ADMIN"]));

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
