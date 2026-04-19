CREATE TABLE IF NOT EXISTS "batches" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_number" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"manufacturer_name" text NOT NULL,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"market_response" text DEFAULT '',
	"next_action" text DEFAULT 'pending',
	"parent_batch_id" text,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"contact_person" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '',
	"credit_limit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_terms" text DEFAULT 'immediate',
	"pricing_tier" text DEFAULT 'standard' NOT NULL,
	"custom_discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"special_prices" jsonb DEFAULT '[]',
	"notes" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"mode" text DEFAULT 'cash' NOT NULL,
	"reference" text DEFAULT '',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_history" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"purchase_price" numeric(12, 2) NOT NULL,
	"selling_price" numeric(12, 2) NOT NULL,
	"changed_by" text DEFAULT 'manual',
	"notes" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Wire' NOT NULL,
	"label_spec" text NOT NULL,
	"actual_spec" text NOT NULL,
	"unit" text DEFAULT 'coil' NOT NULL,
	"purchase_price" numeric(12, 2) NOT NULL,
	"selling_price" numeric(12, 2) NOT NULL,
	"batch_status" text DEFAULT 'trial' NOT NULL,
	"track_stock" boolean DEFAULT false NOT NULL,
	"current_stock" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reorder_level" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reorder_quantity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_number" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"customer_id" text,
	"customer_name" text NOT NULL,
	"sale_mode" text DEFAULT 'pukka' NOT NULL,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"payment_type" text DEFAULT 'cash' NOT NULL,
	"cash_received" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_sale_number_unique" UNIQUE("sale_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"company_name" text DEFAULT 'Mera Vyapaar' NOT NULL,
	"owner_name" text DEFAULT 'Owner' NOT NULL,
	"gemini_api_key" text DEFAULT '',
	"address" text DEFAULT '',
	"phone" text DEFAULT '',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"direction" text NOT NULL,
	"reference_id" text,
	"reference_type" text,
	"stock_before" numeric(12, 2) NOT NULL,
	"stock_after" numeric(12, 2) NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batches_status_idx" ON "batches" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batches_date_idx" ON "batches" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers" ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_city_idx" ON "customers" ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_date_idx" ON "payments" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_customer_idx" ON "payments" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sales_date_idx" ON "sales" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sales_customer_idx" ON "sales" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sales_mode_idx" ON "sales" ("sale_mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_product_idx" ON "stock_movements" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_movements_date_idx" ON "stock_movements" ("date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
