import { db } from "./index";
import * as schema from "@shared/schema";
import * as crypto from "crypto";

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    // Check if admin user exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });

    // Create admin user if not exists
    if (!existingAdmin) {
      const adminPassword = await hashPassword('abohane12345');
      await db.insert(schema.users).values({
        username: "admin",
        password: adminPassword,
        firstName: "المدير",
        lastName: "الوكيل",
        role: "admin",
        isOnline: true,
        profilePicture: "https://ui-avatars.com/api/?name=Admin&background=6200EA&color=fff"
      });

      console.log("Admin user created");
    }

    // Sample hosts for testing
    const hostUsers = [
      {
        username: "sara",
        password: await hashPassword("password123"),
        firstName: "سارة",
        lastName: "أحمد",
        email: "sara@example.com",
        role: "host",
        isOnline: false,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=120&q=80"
      },
      {
        username: "mohammed",
        password: await hashPassword("password123"),
        firstName: "محمد",
        lastName: "علي",
        email: "mohammed@example.com",
        role: "host",
        isOnline: false,
        lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        profilePicture: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=120&q=80"
      },
      {
        username: "ahmed",
        password: await hashPassword("password123"),
        firstName: "أحمد",
        lastName: "محمد",
        email: "ahmed@example.com",
        role: "host",
        isOnline: true,
        profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=120&q=80"
      }
    ];

    // Only insert hosts if they don't exist
    for (const host of hostUsers) {
      const existingHost = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, host.username)
      });

      if (!existingHost) {
        await db.insert(schema.users).values(host);
        console.log(`Created host user: ${host.username}`);
      }
    }
  
    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

seed();
