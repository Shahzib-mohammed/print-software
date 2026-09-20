// ===================================================================
// Document Auto-Purge Worker (Privacy & DPDP Compliance)
// Automatically purges expired customer files after the retention window (25h)
// and creates an immutable audit trail in deletion_logs
// ===================================================================

import fs from "fs";
import { prisma } from "./prisma";

export function startRetentionCleaner(intervalMinutes = 15) {
  console.log(`🛡️ File Retention Cleaner initialized (Sweeps every ${intervalMinutes} mins)`);

  const runCleanupSweep = async () => {
    try {
      const now = new Date();

      // Find files whose retention window has passed and haven't been purged
      const expiredFiles = await prisma.orderFile.findMany({
        where: {
          expiresAt: { lte: now },
          deletedAt: null,
        },
        take: 50,
      });

      if (expiredFiles.length === 0) return;

      console.log(`🧹 Auto-Purge: Found ${expiredFiles.length} expired customer file(s) to delete`);

      for (const fileRecord of expiredFiles) {
        // 1. Delete physical file from disk if it exists
        try {
          if (fs.existsSync(fileRecord.storageKey)) {
            fs.unlinkSync(fileRecord.storageKey);
            console.log(`🗑️ Deleted file from disk: ${fileRecord.storageKey}`);
          }
        } catch (fileErr) {
          console.warn(`Could not delete file ${fileRecord.storageKey}:`, fileErr);
        }

        // 2. Write immutable audit log
        await prisma.deletionLog.create({
          data: {
            orderFileId: fileRecord.id,
            method: "scheduled_job",
          },
        });

        // 3. Mark file as purged in database
        await prisma.orderFile.update({
          where: { id: fileRecord.id },
          data: { deletedAt: new Date() },
        });

        console.log(`✅ File record ${fileRecord.id} successfully marked deleted with audit log`);
      }
    } catch (err) {
      console.error("Error in retention cleaner sweep:", err);
    }
  };

  // Run initial sweep on boot
  runCleanupSweep();

  // Run on interval
  setInterval(runCleanupSweep, intervalMinutes * 60 * 1000);
}
