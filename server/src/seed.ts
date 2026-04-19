import { db } from './db'
import { products, customers, sales, payments, batches } from './db/schema'
import 'dotenv/config'

const NEW_PRODUCTS_DATA = [
  { id: 'p1', name: 'House Wire 1.5mm', category: 'Wire', labelSpec: 'FR PVC Wire 1.5 sq mm ISI', actualSpec: '1.3 sq mm FR', unit: 'coil', purchasePrice: 850, sellingPrice: 1050, batchStatus: 'active', trackStock: true, currentStock: 1500 },
  { id: 'p2', name: 'House Wire 2.5mm', category: 'Wire', labelSpec: 'FR PVC Wire 2.5 sq mm ISI', actualSpec: '2.1 sq mm FR', unit: 'coil', purchasePrice: 1350, sellingPrice: 1650, batchStatus: 'active', trackStock: true, currentStock: 800 },
  { id: 'p3', name: '3 Core Flexible Cable', category: 'Cable', labelSpec: '3 Core Flex Cable 1.0 sq mm ISI', actualSpec: '0.85 sq mm', unit: 'meter', purchasePrice: 18, sellingPrice: 24, batchStatus: 'trial', trackStock: false, currentStock: 0 },
  { id: 'p4', name: 'Main Switch Wire 4mm', category: 'Wire', labelSpec: 'FR Wire 4 sq mm ISI', actualSpec: '3.5 sq mm FR', unit: 'coil', purchasePrice: 1950, sellingPrice: 2450, batchStatus: 'active', trackStock: true, currentStock: 45 },
  { id: 'p5', name: 'Earth Wire 1.5mm', category: 'Wire', labelSpec: 'Earth Wire Green 1.5 sq mm', actualSpec: '1.2 sq mm', unit: 'coil', purchasePrice: 750, sellingPrice: 900, batchStatus: 'discontinued', trackStock: false, currentStock: 0 }
];

const NEW_CUSTOMERS_DATA = [
  { id: 'c1', companyName: 'Sharma Electricals', contactPerson: 'Ravi Sharma', phone: '9876543210', city: 'Delhi', address: '123 Market Road', udhaar: '16000', pricingTier: 'standard', customDiscountPercent: 0, paymentTerms: '30 din', creditLimit: 50000, riskScore: 75 },
  { id: 'c2', companyName: 'Gupta Hardware', contactPerson: 'Amit Gupta', phone: '9876543211', city: 'Noida', address: 'Sector 5', udhaar: '0', pricingTier: 'standard', customDiscountPercent: 0, paymentTerms: 'immediate', creditLimit: 20000, riskScore: 85 },
  { id: 'c3', companyName: 'Balaji Projects', contactPerson: 'Suresh Kumar', phone: '9876543212', city: 'Gurgaon', address: 'Industrial Area', udhaar: '12500', pricingTier: 'standard', customDiscountPercent: 0, paymentTerms: '60 din', creditLimit: 100000, riskScore: 60 },
];

const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

const NEW_SALES_DATA = [
  { id: 's_old1', saleNumber: 'SALE-001', date: ninetyDaysAgo, customerId: 'c1', customerName: 'Sharma Electricals', saleMode: 'pukka', items: [], subtotal: 15000, discount: 0, total: 15000, paymentType: 'credit', cashReceived: 0, creditAmount: 15000, notes: '', createdAt: ninetyDaysAgo },
  { id: 's_old2', saleNumber: 'SALE-002', date: fortyDaysAgo, customerId: 'c1', customerName: 'Sharma Electricals', saleMode: 'pukka', items: [], subtotal: 8000, discount: 0, total: 8000, paymentType: 'credit', cashReceived: 0, creditAmount: 8000, notes: '', createdAt: fortyDaysAgo },
  { id: 's_old3', saleNumber: 'SALE-003', date: tenDaysAgo, customerId: 'c1', customerName: 'Sharma Electricals', saleMode: 'pukka', items: [], subtotal: 5000, discount: 0, total: 5000, paymentType: 'partial', cashReceived: 2000, creditAmount: 3000, notes: '', createdAt: tenDaysAgo },
  { id: 's_old4', saleNumber: null, date: tenDaysAgo, customerId: 'c3', customerName: 'Balaji Projects', saleMode: 'kachcha', items: [], subtotal: 12500, discount: 0, total: 12500, paymentType: 'credit', cashReceived: 0, creditAmount: 12500, notes: '', createdAt: tenDaysAgo }
];

const NEW_PAYMENTS_DATA = [
  { id: 'pay_1', customerId: 'c1', customerName: 'Sharma Electricals', date: fortyDaysAgo, amount: 10000, mode: 'neft', reference: 'NEFT-123', notes: '', createdAt: fortyDaysAgo }
];

const NEW_BATCHES_DATA = [
  {
    id: 'b1',
    batchNumber: 'BATCH-001',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    manufacturerName: 'V-Guard OEM Plt 2',
    items: [
      { productId: 'p1', productName: 'House Wire 1.5mm', labelSpec: 'FR PVC Wire 1.5 sq mm ISI', actualSpec: '1.25 sq mm FR Special Run', quantity: 50, costPerUnit: 800, totalCost: 40000 },
      { productId: 'p3', productName: '3 Core Flexible Cable', labelSpec: '3 Core Flex Cable 1.0 sq mm ISI', actualSpec: '0.80 sq mm', quantity: 1000, costPerUnit: 16, totalCost: 16000 }
    ],
    totalCost: 56000,
    status: 'trial',
    marketResponse: '',
    nextAction: 'pending',
    notes: 'Testing localized copper substitution',
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log("Seeding database...")
  try {
    for (const p of NEW_PRODUCTS_DATA) {
      // @ts-ignore
      await db.insert(products).values(p).onConflictDoNothing()
    }
    console.log("Seeded products")

    for (const c of NEW_CUSTOMERS_DATA) {
      await db.insert(customers).values({
        id: c.id,
        companyName: c.companyName,
        contactPerson: c.contactPerson,
        phone: c.phone,
        city: c.city,
        address: c.address,
        udhaar: c.udhaar,
        pricingTier: c.pricingTier,
        customDiscountPercent: c.customDiscountPercent,
        paymentTerms: c.paymentTerms,
        creditLimit: c.creditLimit,
        riskScore: c.riskScore
      } as any).onConflictDoNothing()
    }
    console.log("Seeded customers")

    for (const s of NEW_SALES_DATA) {
      // @ts-ignore
      await db.insert(sales).values({ ...s, date: new Date(s.date), createdAt: new Date(s.createdAt) } as any).onConflictDoNothing()
    }
    console.log("Seeded sales")

    for (const p of NEW_PAYMENTS_DATA) {
      await db.insert(payments).values({ ...p, date: new Date(p.date), createdAt: new Date(p.createdAt) } as any).onConflictDoNothing()
    }
    console.log("Seeded payments")

    for (const b of NEW_BATCHES_DATA) {
      await db.insert(batches).values({ ...b, date: new Date(b.date), createdAt: new Date(b.createdAt) } as any).onConflictDoNothing()
    }
    console.log("Seeded batches")

    console.log("Seed completed!")
    process.exit(0)
  } catch (err) {
    console.error("Error seeding:", err)
    process.exit(1)
  }
}

seed()
