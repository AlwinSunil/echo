import type { AdapterAccountType } from "next-auth/adapters";

import { drizzle } from "drizzle-orm/neon-http";
import {
  boolean,
  decimal,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const db = drizzle(process.env.DATABASE_URL!);

// Auth tables (NextAuth)
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

// Echo app tables
export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  promptText: text("promptText").notNull(),
  category: text("category").notNull(), // e.g., "portrait", "landscape", "abstract"
  tags: text("tags").array(),
  exampleImageUrl: text("exampleImageUrl"),
  isPublic: boolean("isPublic").default(false),
  isForSale: boolean("isForSale").default(false),
  price: decimal("price", { precision: 10, scale: 2 }), // Price in rupees
  totalSales: integer("totalSales").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  promptId: uuid("promptId").references(() => prompts.id, { onDelete: "set null" }),
  imageUrl: text("imageUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  isPublic: boolean("isPublic").default(false),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const promptPurchases = pgTable("promptPurchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: text("buyerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: text("sellerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  promptId: uuid("promptId")
    .notNull()
    .references(() => prompts.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  sellerEarnings: decimal("sellerEarnings", { precision: 10, scale: 2 }).notNull(),
  razorpayOrderId: text("razorpayOrderId"),
  razorpayPaymentId: text("razorpayPaymentId"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const userEarnings = pgTable("userEarnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 2 }).default("0"),
  totalSales: integer("totalSales").default(0),
  pendingAmount: decimal("pendingAmount", { precision: 10, scale: 2 }).default("0"),
  lastPayoutDate: timestamp("lastPayoutDate", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const imageLikes = pgTable("imageLikes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  imageId: uuid("imageId")
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  uniqueLike: primaryKey({ columns: [table.userId, table.imageId] }),
}));

export const userStats = pgTable("userStats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalImagesGenerated: integer("totalImagesGenerated").default(0),
  totalPromptsCreated: integer("totalPromptsCreated").default(0),
  totalPromptsSold: integer("totalPromptsSold").default(0),
  totalLikesReceived: integer("totalLikesReceived").default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// User subscription and credits system
export const userSubscriptions = pgTable("userSubscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketplaceCredits: integer("marketplaceCredits").default(5), // Free marketplace prompts
  marketplaceCreditsUsed: integer("marketplaceCreditsUsed").default(0),
  customPromptsUsed: integer("customPromptsUsed").default(0), // Unlimited free custom prompts
  lastResetDate: timestamp("lastResetDate", { mode: "date" }).defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// Marketplace credit purchases
export const creditPurchases = pgTable("creditPurchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creditsPurchased: integer("creditsPurchased").notNull(), // 5 credits for ₹50
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // ₹50
  razorpayOrderId: text("razorpayOrderId"),
  razorpayPaymentId: text("razorpayPaymentId"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

// Prompt usage tracking for earnings
export const promptUsage = pgTable("promptUsage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  promptId: uuid("promptId")
    .references(() => prompts.id, { onDelete: "cascade" }),
  imageId: uuid("imageId")
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  isMarketplacePrompt: boolean("isMarketplacePrompt").notNull(),
  creatorEarnings: decimal("creatorEarnings", { precision: 10, scale: 2 }).notNull(), // ₹6
  platformEarnings: decimal("platformEarnings", { precision: 10, scale: 2 }).notNull(), // ₹4
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});
