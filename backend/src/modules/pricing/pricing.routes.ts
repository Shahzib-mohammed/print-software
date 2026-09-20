// ===================================================================
// Pricing API Routes
// ===================================================================

import { Router, Request, Response } from "express";
import { PricingService } from "./pricing.service";
import { sendSuccess, sendError } from "../../common/response";

const router = Router();

// POST /api/pricing/calculate — Live price computation for customer UI
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { shopId, pageCount, copies = 1, printMode = "bw", sided = "single", paperType = "A4 70gsm", selectedProducts } = req.body;

    if (!shopId || pageCount === undefined) {
      return sendError(res, "shopId and pageCount are required", 400);
    }

    const result = await PricingService.calculatePrice({
      shopId,
      pageCount: Number(pageCount),
      copies: Number(copies) || 1,
      printMode,
      sided,
      paperType,
      selectedProducts,
    });

    return sendSuccess(res, "Price calculated successfully", result);
  } catch (err: any) {
    return sendError(res, "Failed to calculate price", 500, err.message);
  }
});

// GET /api/pricing/shop/:shopId — Get all price rules for shop admin
router.get("/shop/:shopId", async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const rules = await PricingService.getRulesByShop(shopId);
    return sendSuccess(res, "Price rules fetched", rules);
  } catch (err: any) {
    return sendError(res, "Failed to fetch price rules", 500, err.message);
  }
});

// PATCH /api/pricing/rule/:id — Update rate for a specific rule
router.patch("/rule/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pricePerPage } = req.body;

    if (pricePerPage === undefined || isNaN(Number(pricePerPage))) {
      return sendError(res, "Valid pricePerPage is required", 400);
    }

    const updated = await PricingService.updateRule(id, Number(pricePerPage));
    return sendSuccess(res, "Price rule updated", updated);
  } catch (err: any) {
    return sendError(res, "Failed to update price rule", 500, err.message);
  }
});

// POST /api/pricing/rule — Create a new rule
router.post("/rule", async (req: Request, res: Response) => {
  try {
    const { shopId, printMode, sided, paperType, pricePerPage } = req.body;
    if (!shopId || !printMode || !sided || !paperType || pricePerPage === undefined) {
      return sendError(res, "All rule fields are required", 400);
    }

    const created = await PricingService.createRule({
      shopId,
      printMode,
      sided,
      paperType,
      pricePerPage: Number(pricePerPage),
    });

    return sendSuccess(res, "Price rule created", created, 201);
  } catch (err: any) {
    return sendError(res, "Failed to create price rule", 500, err.message);
  }
});

export default router;
