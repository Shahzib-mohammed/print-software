// ===================================================================
// Orders Service
// Manages zero-friction customer orders, file records, and queues
// ===================================================================

import { prisma } from "../../common/prisma";
import { PricingService } from "../pricing/pricing.service";
import path from "path";

// Helper to generate a short, human-friendly 4-character pickup code
function generateOrderCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${letter}${num}`;
}

export interface CreateOrderParams {
  shopId: string;
  customerPhone?: string;
  paymentMethod: "online" | "cash" | "split";
  printOptions: {
    printMode: "bw" | "color";
    sided: "single" | "double";
    paperType: string;
    copies: number;
    pageCount: number;
  };
  fileInfo: {
    originalFilename: string;
    storageKey: string;
    pageCount: number;
  };
  selectedProducts?: Array<{ productId: string; quantity: number }>;
}

export class OrdersService {
  /**
   * Creates a new order with auto page counting and live pricing
   */
  static async createOrder(params: CreateOrderParams) {
    const { shopId, customerPhone, paymentMethod, printOptions, fileInfo, selectedProducts = [] } = params;

    // 1. Fetch shop to get retention hours
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");

    // 2. Compute exact price
    const priceCalculation = await PricingService.calculatePrice({
      shopId,
      pageCount: printOptions.pageCount,
      copies: printOptions.copies,
      printMode: printOptions.printMode,
      sided: printOptions.sided,
      paperType: printOptions.paperType,
      selectedProducts,
    });

    // 3. Expiration deadline (25 hours default)
    const retentionHours = shop.retentionHours || 25;
    const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

    // 4. Initial status: online payments wait for gateway, cash orders wait for shopkeeper confirmation
    const initialStatus = paymentMethod === "cash" ? "pending_payment" : "created";
    const orderCode = generateOrderCode();

    // 5. Database transaction to create Order + OrderItems + OrderFile
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          shopId,
          customerPhone,
          status: initialStatus,
          paymentMethod,
          totalAmount: priceCalculation.grandTotal,
        },
      });

      // Create print line item
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          type: "print",
          printMode: printOptions.printMode,
          sided: printOptions.sided,
          paperType: printOptions.paperType,
          pageCount: printOptions.pageCount,
          copies: printOptions.copies,
          unitPrice: priceCalculation.pricePerPage,
          lineTotal: priceCalculation.printTotal,
        },
      });

      // Create product line items (add-ons)
      for (const prod of priceCalculation.productItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            type: "product",
            productId: prod.id,
            copies: prod.quantity,
            unitPrice: prod.price,
            lineTotal: prod.total,
          },
        });
      }

      // Create file tracking record with retention expiration
      const orderFile = await tx.orderFile.create({
        data: {
          orderId: order.id,
          storageKey: fileInfo.storageKey,
          originalFilename: fileInfo.originalFilename,
          pageCount: fileInfo.pageCount,
          expiresAt,
        },
      });

      return {
        order,
        orderFile,
        priceCalculation,
      };
    });
  }

  /**
   * Retrieves an order with all items, files, and payment status
   */
  static async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true, slug: true, logoUrl: true } },
        orderItems: true,
        orderFiles: true,
        payments: true,
        printJobs: true,
      },
    });
  }

  /**
   * Retrieves orders for a specific shop (live queue & history) with daily/monthly summaries
   */
  static async getOrdersByShop(shopId: string, filterStatus?: string) {
    const whereClause: any = { shopId };
    if (filterStatus && filterStatus !== "all") {
      whereClause.status = filterStatus;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: true,
        orderFiles: true,
        payments: true,
        printJobs: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Calculate Today's & Month's summary
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allShopOrders = await prisma.order.findMany({
      where: { shopId, status: { in: ["paid", "printing", "completed"] } },
      select: { totalAmount: true, createdAt: true, orderItems: true },
    });

    let todayRevenue = 0;
    let todayPrints = 0;
    let monthRevenue = 0;
    let monthPrints = 0;

    for (const ord of allShopOrders) {
      const orderDate = new Date(ord.createdAt);
      const isToday = orderDate >= startOfToday;
      const isThisMonth = orderDate >= startOfMonth;

      let pagesInOrder = 0;
      for (const item of ord.orderItems) {
        if (item.type === "print" && item.pageCount) {
          pagesInOrder += item.pageCount * item.copies;
        }
      }

      if (isToday) {
        todayRevenue += ord.totalAmount;
        todayPrints += pagesInOrder;
      }
      if (isThisMonth) {
        monthRevenue += ord.totalAmount;
        monthPrints += pagesInOrder;
      }
    }

    return {
      orders,
      summary: {
        todayRevenue,
        todayPrints,
        monthRevenue,
        monthPrints,
      },
    };
  }

  /**
   * Updates order status
   */
  static async updateOrderStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: { orderFiles: true, shop: true },
    });
  }
}
