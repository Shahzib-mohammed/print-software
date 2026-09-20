// ===================================================================
// Shops API Routes
// ===================================================================

import { Router, Request, Response } from "express";
import { ShopsService } from "./shops.service";
import { sendSuccess, sendError } from "../../common/response";

const router = Router();

// GET /api/shops/:slug — Customer scans QR and loads shop data
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const shop = await ShopsService.getShopBySlug(slug);

    if (!shop) {
      return sendError(res, "Shop not found. Please verify the QR code or link.", 404);
    }

    return sendSuccess(res, "Shop details retrieved successfully", shop);
  } catch (err: any) {
    return sendError(res, "Failed to load shop details", 500, err.message);
  }
});

// GET /api/shops — List all shops (Platform Admin)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const shops = await ShopsService.getAllShops();
    return sendSuccess(res, "Shops fetched successfully", shops);
  } catch (err: any) {
    return sendError(res, "Failed to fetch shops", 500, err.message);
  }
});

// POST /api/shops — Onboard a new shop
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, slug, logoUrl, retentionHours, gatewaySubmerchantId } = req.body;
    if (!name || !slug) {
      return sendError(res, "Shop name and URL slug are required", 400);
    }

    const newShop = await ShopsService.createShop({
      name,
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-"),
      logoUrl,
      retentionHours,
      gatewaySubmerchantId,
    });

    return sendSuccess(res, "Shop registered successfully", newShop, 201);
  } catch (err: any) {
    return sendError(res, "Failed to register shop", 500, err.message);
  }
});

// PATCH /api/shops/:id — Update shop settings
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await ShopsService.updateShop(id, req.body);
    return sendSuccess(res, "Shop settings updated", updated);
  } catch (err: any) {
    return sendError(res, "Failed to update shop", 500, err.message);
  }
});

export default router;
