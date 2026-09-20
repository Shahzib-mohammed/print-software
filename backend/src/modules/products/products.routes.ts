// ===================================================================
// Products API Routes
// ===================================================================

import { Router, Request, Response } from "express";
import { ProductsService } from "./products.service";
import { sendSuccess, sendError } from "../../common/response";

const router = Router();

// GET /api/products/shop/:shopId — List all products for a shop
router.get("/shop/:shopId", async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const products = await ProductsService.getProductsByShop(shopId);
    return sendSuccess(res, "Products fetched", products);
  } catch (err: any) {
    return sendError(res, "Failed to fetch products", 500, err.message);
  }
});

// POST /api/products — Create product
router.post("/", async (req: Request, res: Response) => {
  try {
    const { shopId, name, price, imageUrl, variant, stockQty } = req.body;
    if (!shopId || !name || price === undefined) {
      return sendError(res, "shopId, name, and price are required", 400);
    }

    const created = await ProductsService.createProduct({
      shopId,
      name,
      price: Number(price),
      imageUrl,
      variant,
      stockQty: stockQty ? Number(stockQty) : undefined,
    });

    return sendSuccess(res, "Product created", created, 201);
  } catch (err: any) {
    return sendError(res, "Failed to create product", 500, err.message);
  }
});

// PATCH /api/products/:id — Update product
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await ProductsService.updateProduct(id, req.body);
    return sendSuccess(res, "Product updated", updated);
  } catch (err: any) {
    return sendError(res, "Failed to update product", 500, err.message);
  }
});

// DELETE /api/products/:id — Soft-delete product
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ProductsService.deleteProduct(id);
    return sendSuccess(res, "Product removed");
  } catch (err: any) {
    return sendError(res, "Failed to delete product", 500, err.message);
  }
});

export default router;
