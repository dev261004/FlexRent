import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import {
  cancelReminders,
  getReminders,
  getRemindersByRentalOrder,
  rescheduleReminders,
} from "./reminder.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", getReminders);
router.get("/:rentalOrderId", getRemindersByRentalOrder);
router.post("/:rentalOrderId/reschedule", rescheduleReminders);
router.delete("/:rentalOrderId", cancelReminders);

export default router;
