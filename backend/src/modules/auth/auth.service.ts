// ===================================================================
// Auth Service (Shopkeepers & Platform Admins)
// ===================================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../common/prisma";
import { config } from "../../config";

export class AuthService {
  /**
   * Authenticate a shopkeeper or admin
   */
  static async login(email: string, passwordPlain: string) {
    const admin = await prisma.shopAdmin.findUnique({
      where: { email },
      include: { shop: true },
    });

    if (!admin) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(passwordPlain, admin.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        shopId: admin.shopId,
        role: admin.role,
        email: admin.email,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        shop: admin.shop,
      },
    };
  }
}
