// ===================================================================
// Shops Service (Tenant Management)
// ===================================================================

import { prisma } from "../../common/prisma";

export class ShopsService {
  /**
   * Finds a shop by its unique URL slug (used when customer scans QR)
   */
  static async getShopBySlug(slug: string) {
    return prisma.shop.findUnique({
      where: { slug },
      include: {
        priceRules: true,
        products: {
          where: { isActive: true, deletedAt: null },
        },
        printers: {
          where: { status: "online" },
          select: { id: true, name: true, printerType: true, status: true },
        },
      },
    });
  }

  /**
   * Retrieves all shops (for Platform Admin)
   */
  static async getAllShops() {
    return prisma.shop.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { orders: true, printers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Creates a new shop (onboarding)
   */
  static async createShop(data: {
    name: string;
    slug: string;
    logoUrl?: string;
    retentionHours?: number;
    gatewaySubmerchantId?: string;
  }) {
    return prisma.shop.create({
      data: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        retentionHours: data.retentionHours || 25,
        gatewaySubmerchantId: data.gatewaySubmerchantId,
      },
    });
  }

  /**
   * Updates shop configuration (retention hours, status, etc.)
   */
  static async updateShop(id: string, data: any) {
    return prisma.shop.update({
      where: { id },
      data,
    });
  }
}
