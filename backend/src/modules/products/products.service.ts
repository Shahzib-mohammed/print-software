// ===================================================================
// Products Service (Shop Add-on Catalog)
// ===================================================================

import { prisma } from "../../common/prisma";

export class ProductsService {
  /**
   * List all active products for a shop
   */
  static async getProductsByShop(shopId: string) {
    return prisma.product.findMany({
      where: { shopId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Add a new product to shop catalog
   */
  static async createProduct(data: {
    shopId: string;
    name: string;
    price: number;
    imageUrl?: string;
    variant?: string;
    stockQty?: number;
  }) {
    return prisma.product.create({ data });
  }

  /**
   * Update product details
   */
  static async updateProduct(id: string, data: any) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft-delete a product
   */
  static async deleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
