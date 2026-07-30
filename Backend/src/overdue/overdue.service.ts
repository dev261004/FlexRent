import { AppError } from "../middleware/error.middleware";
import { notificationService } from "../notifications/notification.service";
import { overdueRepository } from "./overdue.repository";
import { ListOverdueQuery, OverdueStatistics } from "./overdue.types";

export class OverdueService {
  /**
   * Main overdue detection engine.
   * Runs periodically via BullMQ worker or manual admin trigger.
   * Idempotent: Skips rentals that already have an OverdueRecord (ACTIVE, RESOLVED, or IGNORED).
   */
  async detectOverdueRentals(): Promise<{
    detectedCount: number;
    processedCount: number;
    skippedCount: number;
  }> {
    const potentialOverdues = await overdueRepository.findPotentialOverdues();
    const now = new Date();

    let processedCount = 0;
    let skippedCount = 0;

    for (const rental of potentialOverdues) {
      try {
        // Validation check 1: Rental status & actual return date
        if (rental.status !== "PICKED_UP" || rental.actualReturnAt !== null) {
          skippedCount++;
          continue;
        }

        // Validation check 2: Expected return date past check
        if (new Date(rental.rentalEnd).getTime() >= now.getTime()) {
          skippedCount++;
          continue;
        }

        // Validation check 3: Idempotency check — check if an OverdueRecord already exists for this rental
        const existingRecord = await overdueRepository.findByRental(rental.id);
        if (existingRecord) {
          // If record exists (ACTIVE, RESOLVED, or IGNORED), skip duplicate creation
          skippedCount++;
          continue;
        }

        // Calculate days overdue
        const diffMs = now.getTime() - new Date(rental.rentalEnd).getTime();
        const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        // Step 1: Create OverdueRecord
        const record = await overdueRepository.create({
          rentalOrderId: rental.id,
          userId: rental.customerId,
          vendorId: rental.vendorId,
          expectedReturnDate: rental.rentalEnd,
          daysOverdue,
          notificationSent: false,
          lateFeeStarted: false,
        });

        // Step 2: Trigger Overdue Notification via NotificationService
        try {
          await notificationService.notify({
            userId: rental.customerId,
            type: "OVERDUE_REMINDER",
            priority: "HIGH",
            title: "Rental Overdue",
            message: "Your rental is overdue. Please return it as soon as possible to avoid additional charges.",
            actionUrl: `/dashboard/rentals/${rental.id}`,
            idempotencyKey: `overdue-${rental.id}`,
          });

          // Step 3: Update notificationSent flag
          await overdueRepository.update(record.id, { notificationSent: true });
        } catch (notifErr: any) {
          console.error(
            `⚠️ Notification failed for overdue rental ${rental.id}:`,
            notifErr.message
          );
        }

        processedCount++;
      } catch (err: any) {
        console.error(`❌ Error processing overdue for rental ${rental.id}:`, err.message);
      }
    }

    return {
      detectedCount: potentialOverdues.length,
      processedCount,
      skippedCount,
    };
  }

  /**
   * Automatically resolve overdue state when a rental is returned.
   */
  async resolveOverdueByRentalId(rentalOrderId: string): Promise<void> {
    const activeRecord = await overdueRepository.findActiveByRental(rentalOrderId);
    if (activeRecord) {
      await overdueRepository.markResolved(rentalOrderId, new Date());
    }
  }

  /**
   * Manually resolve an overdue record.
   */
  async resolveOverdueManually(id: string) {
    const record = await overdueRepository.findById(id);
    if (!record) {
      throw new AppError(404, "Overdue record not found");
    }

    if (record.status === "RESOLVED") {
      throw new AppError(400, "Overdue record is already resolved");
    }

    return overdueRepository.update(id, {
      status: "RESOLVED",
      resolvedAt: new Date(),
    });
  }

  /**
   * Manually ignore an overdue record.
   */
  async ignoreOverdue(id: string) {
    const record = await overdueRepository.findById(id);
    if (!record) {
      throw new AppError(404, "Overdue record not found");
    }

    if (record.status === "IGNORED") {
      throw new AppError(400, "Overdue record is already ignored");
    }

    return overdueRepository.markIgnored(id);
  }

  /**
   * Get single overdue record by ID.
   */
  async getOverdueById(id: string) {
    const record = await overdueRepository.findById(id);
    if (!record) {
      throw new AppError(404, "Overdue record not found");
    }
    return record;
  }

  /**
   * Get single overdue record by rental order ID.
   */
  async getOverdueByRentalId(rentalOrderId: string) {
    const record = await overdueRepository.findByRental(rentalOrderId);
    if (!record) {
      throw new AppError(404, "No overdue record found for this rental order");
    }
    return record;
  }

  /**
   * Get paginated overdue records.
   */
  async getOverdueRecords(query: ListOverdueQuery) {
    const [records, total] = await overdueRepository.findMany(query);
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dashboard statistics.
   */
  async getStatistics(vendorId?: string, userId?: string): Promise<OverdueStatistics> {
    return overdueRepository.findStatistics(vendorId, userId);
  }
}

export const overdueService = new OverdueService();
