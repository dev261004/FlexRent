import { Router } from "express";
import {
  createRentalPeriod,
  deleteRentalPeriod,
  getRentalPeriod,
  listRentalPeriods,
  updateRentalPeriod,
} from "../controllers/rental-period.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", listRentalPeriods);
router.get("/:id", getRentalPeriod);
router.post("/", requireRole(["ADMIN"]), createRentalPeriod);
router.patch("/:id", requireRole(["ADMIN"]), updateRentalPeriod);
router.delete("/:id", requireRole(["ADMIN"]), deleteRentalPeriod);

export default router;
