// ===================================================================
// Pricing Engine & Price Rules Service
// Handles live price calculations based on shop's configured rules
// ===================================================================

import { prisma } from "../../common/prisma";

export interface CalculatePriceInput {
  shopId: string;
  pageCount: number;
  copies: number;
  printMode: "bw" | "color";
  sided: "single" | "double";
  paperType: string;
  selectedProducts?: Array<{ productId: string; quantity: number }>;
}

export class PricingService {
  /**
   * Computes the total price live for customer UI
   */
  static async calculatePrice(input: CalculatePriceInput) {
    const { shopId, pageCount, copies, printMode, sided, paperType, selectedProducts = [] } = input;

    // 1. Fetch matching price rule for this shop
    let rule = await prisma.priceRule.findFirst({
      where: {
        shopId,
        printMode,
        sided,
        paperType,
      },
    });

    // Fallback: If specific paper type rule not found, fallback to standard A4 70gsm
    if (!rule) {
      rule = await prisma.priceRule.findFirst({
        where: {
          shopId,
          printMode,
          sided,
        },
      });
    }

    // Default fallback rates if shop hasn't configured rules yet
    const pricePerPage = rule ? rule.pricePerPage : printMode === "color" ? 10.0 : 2.0;

    // Calculate print cost: pages * copies * unit price
    const printTotal = Math.round(pageCount * copies * pricePerPage * 100) / 100;

    // 2. Calculate add-on products cost
    let productsTotal = 0;
    const productItems: Array<{ id: string; name: string; price: number; quantity: number; total: number }> = [];

    if (selectedProducts.length > 0) {
      const productIds = selectedProducts.map((p) => p.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, shopId, isActive: true },
      });

      for (const item of selectedProducts) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const itemTotal = prod.price * item.quantity;
          productsTotal += itemTotal;
          productItems.push({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            quantity: item.quantity,
            total: itemTotal,
          });
        }
      }
    }

    const grandTotal = Math.round((printTotal + productsTotal) * 100) / 100;

    return {
      pricePerPage,
      pageCount,
      copies,
      printMode,
      sided,
      paperType,
      printTotal,
      productsTotal,
      grandTotal,
      productItems,
    };
  }

  /**
   * Get all price rules for a shop
   */
  static async getRulesByShop(shopId: string) {
    return prisma.priceRule.findMany({
      where: { shopId },
      orderBy: [{ printMode: "asc" }, { sided: "asc" }],
    });
  }

  /**
   * Update or upsert a price rule
   */
  static async updateRule(id: string, pricePerPage: number) {
    return prisma.priceRule.update({
      where: { id },
      data: { pricePerPage },
    });
  }

  /**
   * Create a new price rule
   */
  static async createRule(data: {
    shopId: string;
    printMode: string;
    sided: string;
    paperType: string;
    pricePerPage: number;
  }) {
    return prisma.priceRule.create({ data });
  }
}
