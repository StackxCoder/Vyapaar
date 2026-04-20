import { pgTable, text, numeric, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import * as crypto from 'node:crypto' // for randomUUID fallback if needed or let DB handle it. Actually the user's snippet uses crypto.randomUUID() which is global in modern node.

// ─── USERS (shop owners) ─────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  companyName: text('company_name').notNull(),
  ownerName: text('owner_name').notNull(),
  phone: text('phone').default(''),
  city: text('city').default(''),
  plan: text('plan').notNull().default('free'),
  isActive: boolean('is_active').notNull().default(true),
  onboardingComplete: boolean('onboarding_complete').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
// ─── PRODUCTS ──────────────────────────────────────────────
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('Wire'),
  labelSpec: text('label_spec').notNull(),
  actualSpec: text('actual_spec').notNull(),
  unit: text('unit').notNull().default('coil'),
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull(),
  batchStatus: text('batch_status').notNull().default('trial'),
  trackStock: boolean('track_stock').notNull().default(false),
  currentStock: numeric('current_stock', { precision: 12, scale: 2 }).notNull().default('0'),
  reorderLevel: numeric('reorder_level', { precision: 12, scale: 2 }).notNull().default('0'),
  reorderQuantity: numeric('reorder_quantity', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes').default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  nameIdx: index('products_name_idx').on(t.name),
  categoryIdx: index('products_category_idx').on(t.category),
}))

// ─── CUSTOMERS ─────────────────────────────────────────────
export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person').notNull().default(''),
  phone: text('phone').notNull().default(''),
  city: text('city').notNull().default(''),
  address: text('address').default(''),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentTerms: text('payment_terms').default('immediate'),
  pricingTier: text('pricing_tier').notNull().default('standard'),
  customDiscountPercent: numeric('custom_discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  specialPrices: jsonb('special_prices').default('[]'),
  notes: text('notes').default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  phoneIdx: index('customers_phone_idx').on(t.phone),
  cityIdx: index('customers_city_idx').on(t.city),
}))

// ─── SALES ─────────────────────────────────────────────────
export const sales = pgTable('sales', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  saleNumber: text('sale_number').unique(),
  date: timestamp('date').notNull().defaultNow(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'restrict' }),
  customerName: text('customer_name').notNull(),
  saleMode: text('sale_mode').notNull().default('pukka'),
  items: jsonb('items').notNull().default('[]'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  paymentType: text('payment_type').notNull().default('cash'),
  cashReceived: numeric('cash_received', { precision: 12, scale: 2 }).notNull().default('0'),
  creditAmount: numeric('credit_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  dateIdx: index('sales_date_idx').on(t.date),
  customerIdx: index('sales_customer_idx').on(t.customerId),
  modeIdx: index('sales_mode_idx').on(t.saleMode),
}))

// ─── PAYMENTS ──────────────────────────────────────────────
export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  customerName: text('customer_name').notNull(),
  date: timestamp('date').notNull().defaultNow(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  mode: text('mode').notNull().default('cash'),
  reference: text('reference').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  dateIdx: index('payments_date_idx').on(t.date),
  customerIdx: index('payments_customer_idx').on(t.customerId),
}))

// ─── BATCHES ───────────────────────────────────────────────
export const batches = pgTable('batches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  batchNumber: text('batch_number').notNull().unique(),
  date: timestamp('date').notNull().defaultNow(),
  manufacturerName: text('manufacturer_name').notNull(),
  items: jsonb('items').notNull().default('[]'),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('trial'),
  marketResponse: text('market_response').default(''),
  nextAction: text('next_action').default('pending'),
  parentBatchId: text('parent_batch_id'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('batches_status_idx').on(t.status),
  dateIdx: index('batches_date_idx').on(t.date),
}))

// ─── STOCK MOVEMENTS ───────────────────────────────────────
export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  type: text('type').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  direction: text('direction').notNull(),
  referenceId: text('reference_id'),
  referenceType: text('reference_type'),
  stockBefore: numeric('stock_before', { precision: 12, scale: 2 }).notNull(),
  stockAfter: numeric('stock_after', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  productIdx: index('stock_movements_product_idx').on(t.productId),
  dateIdx: index('stock_movements_date_idx').on(t.date),
}))

// ─── PRICE HISTORY ─────────────────────────────────────────
export const priceHistory = pgTable('price_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(),
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull(),
  changedBy: text('changed_by').default('manual'),
  notes: text('notes').default(''),
})

export const settings = pgTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull().default(''),
  address: text('address').default(''),
  phone: text('phone').default(''),
  gstin: text('gstin').default(''),
  invoicePrefix: text('invoice_prefix').default('INV'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── RELATIONS ─────────────────────────────────────────────
export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  payments: many(payments),
}))

export const salesRelations = relations(sales, ({ one }) => ({
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
}))

export const productsRelations = relations(products, ({ many }) => ({
  stockMovements: many(stockMovements),
  priceHistory: many(priceHistory),
}))

// ─── TYPE EXPORTS ──────────────────────────────────────────
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Sale = typeof sales.$inferSelect
export type NewSale = typeof sales.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Batch = typeof batches.$inferSelect
export type NewBatch = typeof batches.$inferInsert
export type StockMovement = typeof stockMovements.$inferSelect
export type Settings = typeof settings.$inferSelect
