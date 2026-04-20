/* eslint-disable react-refresh/only-export-components */
// Cleaned up imports
import { daysDiff, toDateOnly, isToday } from '../utils/dateUtils';

const INITIAL_DATA = {
  products: [],
  customers: [],
  sales: [],
  payments: [],
  batches: [],
  stockMovements: [],
  priceHistory: [],
  competitorNotes: [],
  scoreCache: { scores: {}, lastUpdated: 0 },
  settings: {
    companyName: 'Vyapaar Admin',
    ownerName: 'Admin',
    geminiApiKey: '',
    geminiModel: '',
    expenses: {}
  }
};

import { useState, useEffect, createContext, useContext } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../api/products';
import { useCustomers } from '../api/customers';
import { useSales, useCreateSale } from '../api/sales';
import { usePayments, useCreatePayment } from '../api/payments';
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch } from '../api/batches';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const { data: qProducts = [] } = useProducts();
  const { data: qCustomers = [] } = useCustomers();
  const { data: qSales = [] } = useSales();
  const { data: qPayments = [] } = usePayments();
  const { data: qBatches = [] } = useBatches();
  
  const createSale = useCreateSale();
  const createPayment = useCreatePayment();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const [localData, setLocalData] = useState(() => {
    try {
      const stored = localStorage.getItem('vyapaar_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed) throw new Error("Parsed data is null");

        // Migration: Ensure customers has creditLimit indicating new schema natively
        if (parsed.customers && parsed.customers.length > 0 && typeof parsed.customers[0] === 'object' && parsed.customers[0].creditLimit === undefined) {
          parsed.customers = [];
          parsed.sales = [];
          parsed.payments = [];
        }
        if (!parsed.batches || !Array.isArray(parsed.batches)) {
          parsed.batches = [];
        }
        
        // Ensure core arrays exist
        if (!parsed.sales) parsed.sales = [];
        if (!parsed.products) parsed.products = [];
        if (!parsed.customers) parsed.customers = [];
        if (!parsed.payments) parsed.payments = [];
        if (!parsed.stockMovements) parsed.stockMovements = [];
        if (!parsed.settings) parsed.settings = INITIAL_DATA.settings;

        // Data migration for physical stock tracking parameters
        if (parsed.products) {
          parsed.products = parsed.products.map(p => ({
            ...p,
            trackStock: p.trackStock ?? false,
            currentStock: Number(p.currentStock) || 0,
            reorderLevel: Number(p.reorderLevel) || 0,
            reorderQuantity: Number(p.reorderQuantity) || 0,
            lastStockUpdate: p.lastStockUpdate || null
          }));
        }

        // Data migration for pricing engine
        if (parsed.customers) {
          parsed.customers = parsed.customers.map(c => ({
            ...c,
            pricingTier: c.pricingTier || 'standard',
            customDiscountPercent: Number(c.customDiscountPercent) || 0,
            specialPrices: Array.isArray(c.specialPrices) ? c.specialPrices : []
          }));
        }
        if (!parsed.priceHistory) parsed.priceHistory = [];
        if (!parsed.competitorNotes) parsed.competitorNotes = [];
        if (!parsed.scoreCache) parsed.scoreCache = { scores: {}, lastUpdated: 0 };

        return parsed;
      }
    } catch (err) {
      console.warn("Local storage corruption detected. Factory resetting dataset safely.", err);
    }
    
    return INITIAL_DATA;
  });

  // Compose dynamic reactive Data object blending API + local ephemeral
  // PostgreSQL returns numerics as strings to preserve precision. We parse them here.
  const mapNumerics = (arr, fields) => arr.map(item => {
    const copy = { ...item };
    fields.forEach(f => { if (copy[f] !== undefined) copy[f] = Number(copy[f]) || 0; });
    return copy;
  });

  const parsedProducts = mapNumerics(qProducts, ['purchasePrice', 'sellingPrice', 'currentStock']);
  const parsedCustomers = mapNumerics(qCustomers, ['udhaar', 'creditLimit', 'customDiscountPercent']);
  const parsedSales = mapNumerics(qSales, ['subtotal', 'discount', 'total', 'cashReceived', 'creditAmount']);
  const parsedPayments = mapNumerics(qPayments, ['amount']);
  const parsedBatches = mapNumerics(qBatches, ['totalCost']);

  const data = {
    ...localData,
    products: parsedProducts,
    customers: parsedCustomers,
    sales: parsedSales,
    payments: parsedPayments,
    batches: parsedBatches
  };

  const setData = (updater) => setLocalData(updater);

  const setItem = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const addEntity = (key, entity) => {
    if (key === 'products') createProduct.mutate(entity);
    else if (key === 'batches') createBatch.mutate(entity);
    else {
      setData((prev) => ({ ...prev, [key]: [{ ...entity, id: Math.random().toString(36).substr(2, 9) }, ...prev[key]] }));
    }
  };

  const updateEntity = (key, id, updates) => {
    if (key === 'products') updateProduct.mutate({ id, ...updates });
    else if (key === 'batches') updateBatch.mutate({ id, ...updates });
    else {
      setData((prev) => ({ ...prev, [key]: prev[key].map((item) => (item.id === id ? { ...item, ...updates } : item)) }));
    }
  };

  const deleteEntity = (key, id) => {
    if (key === 'products') deleteProduct.mutate(id);
    else if (key === 'batches') deleteBatch.mutate(id);
    else {
      setData((prev) => ({ ...prev, [key]: prev[key].filter((item) => item.id !== id) }));
    }
  };

  const overrideData = (jsonData) => setData(jsonData);
  const wipeData = () => setData(INITIAL_DATA);

  // Complex business logic wrappers
  const processSale = (saleData) => {
    createSale.mutate(saleData);
    return { ...saleData, id: 'processing...' };
    
    setData((prev) => {
      let nextMovements = [...(prev.stockMovements || [])];
      let nextProducts = [...prev.products];
      const now = new Date().toISOString();
      
      // Auto-deduct from stock ledger if trackStock is true
      saleData.items.forEach(item => {
        const productIndex = nextProducts.findIndex(p => p.id === item.productId);
        if (productIndex >= 0 && nextProducts[productIndex].trackStock) {
          const product = nextProducts[productIndex];
          const qtyOut = Number(item.quantity) || 0;
          const newStock = product.currentStock - qtyOut;
          
          nextMovements.unshift({
            id: Math.random().toString(36).substr(2, 9),
            date: now,
            productId: product.id,
            productName: product.name,
            type: "sale_out",
            quantity: qtyOut,
            direction: "out",
            referenceId: newId,
            referenceType: "sale",
            notes: `Auto deducted for Sale ${pukkaId || 'Kachcha'}`,
            stockBefore: product.currentStock,
            stockAfter: newStock,
            createdAt: now
          });
          
          nextProducts[productIndex] = {
            ...product,
            currentStock: newStock,
            lastStockUpdate: now
          };
        }
      });
      
      return { 
        ...prev, 
        sales: [compiledSale, ...prev.sales],
        products: nextProducts,
        stockMovements: nextMovements
      };
    });
    return compiledSale; 
  };

  const processPayment = (paymentData) => {
    createPayment.mutate(paymentData);
    return paymentData;
  };

  const processBatchStatusUpdate = (batchId, newStatus, marketResponse) => {
    setData((prev) => {
      let linkedItems = [];
      const updatedBatches = prev.batches.map(b => {
        if (b.id === batchId) {
          linkedItems = b.items;
          return { ...b, status: newStatus, marketResponse };
        }
        return b;
      });

      const nextData = { ...prev, batches: updatedBatches };

      // Cross-entity logic: If activated, cascade "active" status globally into standard Catalog defaults.
      if (newStatus === 'active') {
        const itemIds = linkedItems.map(i => i.productId);
        nextData.products = prev.products.map(p => {
          if (itemIds.includes(p.id)) return { ...p, batchStatus: 'active' };
          return p;
        });
      }

      return nextData;
    });
  };

  const processStockMovement = (movementData) => {
    setData((prev) => {
      const productIndex = prev.products.findIndex(p => p.id === movementData.productId);
      if (productIndex === -1) return prev;
      
      const product = prev.products[productIndex];
      // Only process movements for tracked models or force-override if tracking turned on
      const qty = Number(movementData.quantity) || 0;
      const direction = movementData.direction || (movementData.type.includes('out') ? 'out' : 'in');
      const diff = direction === 'in' ? qty : -qty;
      const newStock = product.currentStock + diff;

      const now = new Date().toISOString();
      const compiledMovement = {
        ...movementData,
        id: Math.random().toString(36).substr(2, 9),
        direction,
        stockBefore: product.currentStock,
        stockAfter: newStock,
        date: movementData.date || now,
        createdAt: now
      };

      const nextProducts = [...prev.products];
      nextProducts[productIndex] = {
        ...product,
        currentStock: newStock,
        lastStockUpdate: now,
        // Automatically enable tracking if an explicit stock movement is injected
        trackStock: true 
      };

      return {
        ...prev,
        products: nextProducts,
        stockMovements: [compiledMovement, ...(prev.stockMovements || [])]
      };
    });
  };
  const processBulkPriceUpdate = (updates, changedBy = 'bulk_update') => {
    setData((prev) => {
      const now = new Date().toISOString();
      const updatedProducts = [...prev.products];
      const newHistory = [...(prev.priceHistory || [])];

      Object.keys(updates).forEach(productId => {
        const productIndex = updatedProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex];
          const updateData = updates[productId];
          
          if (updateData.sellingPrice && updateData.sellingPrice !== product.sellingPrice) {
            newHistory.unshift({
              id: Math.random().toString(36).substr(2, 9),
              productId,
              date: now,
              purchasePrice: product.purchasePrice,
              sellingPrice: updateData.sellingPrice,
              oldSellingPrice: product.sellingPrice,
              changedBy,
              notes: updateData.notes || ''
            });
            updatedProducts[productIndex] = { ...product, sellingPrice: updateData.sellingPrice };
          }
        }
      });

      return { ...prev, products: updatedProducts, priceHistory: newHistory };
    });
  };

  const addCompetitorNote = (noteData) => {
    setData((prev) => {
      const compiledNote = {
        ...noteData,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString()
      };
      return { ...prev, competitorNotes: [compiledNote, ...(prev.competitorNotes || [])] };
    });
  };

  // ----- DYNAMIC CALCULATIONS ----- //

  const getEffectiveRate = (productId, customerId) => {
    if (!data.products || !data.customers) return { rate: 0, source: 'error', discount: 0 };
    
    const product = data.products.find(p => p.id === productId);
    const customer = data.customers.find(c => c.id === customerId);
    
    if (!product || !customer) return { rate: product?.sellingPrice || 0, source: 'standard', discount: 0 };

    // 1. Check Custom Override Priority
    const specialrices = customer.specialPrices || [];
    const customPrice = specialrices.find(sp => sp.productId === productId);
    if (customPrice && customPrice.customRate > 0) {
      return { rate: customPrice.customRate, source: 'custom', discount: 0 };
    }

    // 2. Check Tier / Global Discount
    const basePrice = product.sellingPrice || 0;
    const discount = customer.customDiscountPercent || 0;
    
    if (discount > 0) {
      const tierRate = basePrice * (1 - discount / 100);
      return { rate: tierRate, source: 'tier_discount', discount };
    }

    // 3. Fallback to Catalog Base
    return { rate: basePrice, source: 'standard', discount: 0 };
  };

  const getLastSoldPrice = (productId, customerId = null) => {
    // Searches past sales chronological backwards for pricing context
    const sortedSales = [...(data.sales || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const sale of sortedSales) {
      if (customerId && sale.customerId !== customerId) continue;
      const item = sale.items?.find(i => i.productId === productId);
      if (item && item.amount > 0 && item.quantity > 0) {
        return item.amount / item.quantity; // Historic explicit unit rate
      }
    }
    return null;
  };

  const calculateCustomerScore = (customerId) => {
    const defaultRes = { score: 50, grade: 'B', avgPaymentDays: 0, paymentRatio: 0, suggestedCreditLimit: 0, breakdown: { speedScore: 10, reliabilityScore: 20, recencyScore: 10, volumeScore: 10 }, reason: 'No credit history' };
    
    // Explicit runtime fallback avoiding cache loop issues
    const custSales = (data.sales || []).filter(s => s.customerId === customerId && s.creditAmount > 0);
    const custPayments = (data.payments || []).filter(p => p.customerId === customerId);
    
    if (custSales.length === 0) return defaultRes;

    const paymentSpeeds = [];
    custPayments.forEach(payment => {
      const matchingSale = custSales.find(s => {
        const saleDate = new Date(s.date);
        const payDate = new Date(payment.date);
        return payDate >= saleDate && payDate <= new Date(saleDate.getTime() + 90 * 86400000);
      });
      if (matchingSale) {
        const days = Math.floor((new Date(payment.date) - new Date(matchingSale.date)) / 86400000);
        paymentSpeeds.push(Math.max(0, days)); 
      }
    });

    const avgDays = paymentSpeeds.length > 0 ? paymentSpeeds.reduce((a,b) => a+b, 0) / paymentSpeeds.length : 60;
    const speedScore = avgDays <= 15 ? 40 : avgDays <= 30 ? 32 : avgDays <= 45 ? 22 : avgDays <= 60 ? 12 : 0;

    const totalCredit = custSales.reduce((s,sale) => s + (sale.creditAmount||0), 0);
    const totalPaid = custPayments.reduce((s,p) => s + (p.amount||0), 0);
    const payRatio = totalCredit > 0 ? Math.min(totalPaid / totalCredit, 1) : 0;
    const reliabilityScore = Math.floor(payRatio * 30);

    const nowTime = new Date().getTime();
    const recentPayment = custPayments.some(p => Math.floor((nowTime - new Date(p.date).getTime()) / 86400000) <= 30);
    const lastSale = [...custSales].sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    const daysSinceLastSale = lastSale ? Math.floor((nowTime - new Date(lastSale.date).getTime()) / 86400000) : 999;
    const recencyScore = recentPayment ? 15 : daysSinceLastSale > 60 ? 5 : 10;

    const totalBusiness = custSales.reduce((s,sale) => s + (sale.total||0), 0);
    const volumeScore = totalBusiness > 500000 ? 15 : totalBusiness > 200000 ? 12 : totalBusiness > 50000 ? 8 : 4;

    const total = speedScore + reliabilityScore + recencyScore + volumeScore;
    const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D';
    const creditMultiplier = total >= 80 ? 1.5 : total >= 60 ? 1.0 : total >= 40 ? 0.6 : 0.3;

    return {
      score: total,
      grade,
      avgPaymentDays: Math.round(avgDays),
      paymentRatio: Math.round(payRatio * 100),
      suggestedCreditLimit: Math.round((totalBusiness / custSales.length) * creditMultiplier),
      breakdown: { speedScore, reliabilityScore, recencyScore, volumeScore }
    };
  };

  const refreshAllCustomerScores = () => {
    setData(prev => {
       const newScores = {};
       (prev.customers || []).forEach(c => {
          // Manual detached local recalculation ensuring we don't bind to stale states
          const custSales = (prev.sales || []).filter(s => s.customerId === c.id && s.creditAmount > 0);
          const custPayments = (prev.payments || []).filter(p => p.customerId === c.id);
          
          if (custSales.length === 0) {
            newScores[c.id] = { score: 50, grade: 'B', avgPaymentDays: 0, paymentRatio: 0, suggestedCreditLimit: 0, breakdown: { speedScore: 10, reliabilityScore: 20, recencyScore: 10, volumeScore: 10 }, reason: 'No credit history' };
            return;
          }

          const paymentSpeeds = [];
          custPayments.forEach(payment => {
            const matchingSale = custSales.find(s => {
              const saleDate = new Date(s.date);
              const payDate = new Date(payment.date);
              return payDate >= saleDate && payDate <= new Date(saleDate.getTime() + 90 * 86400000);
            });
            if (matchingSale) {
              const days = Math.floor((new Date(payment.date) - new Date(matchingSale.date)) / 86400000);
              paymentSpeeds.push(Math.max(0, days)); 
            }
          });

          const avgDays = paymentSpeeds.length > 0 ? paymentSpeeds.reduce((a,b) => a+b, 0) / paymentSpeeds.length : 60;
          const speedScore = avgDays <= 15 ? 40 : avgDays <= 30 ? 32 : avgDays <= 45 ? 22 : avgDays <= 60 ? 12 : 0;

          const totalCredit = custSales.reduce((s,sale) => s + (sale.creditAmount||0), 0);
          const totalPaid = custPayments.reduce((s,p) => s + (p.amount||0), 0);
          const payRatio = totalCredit > 0 ? Math.min(totalPaid / totalCredit, 1) : 0;
          const reliabilityScore = Math.floor(payRatio * 30);

          const nowTime = new Date().getTime();
          const recentPayment = custPayments.some(p => Math.floor((nowTime - new Date(p.date).getTime()) / 86400000) <= 30);
          const lastSale = [...custSales].sort((a,b) => new Date(b.date) - new Date(a.date))[0];
          const daysSinceLastSale = lastSale ? Math.floor((nowTime - new Date(lastSale.date).getTime()) / 86400000) : 999;
          const recencyScore = recentPayment ? 15 : daysSinceLastSale > 60 ? 5 : 10;

          const totalBusiness = custSales.reduce((s,sale) => s + (sale.total||0), 0);
          const volumeScore = totalBusiness > 500000 ? 15 : totalBusiness > 200000 ? 12 : totalBusiness > 50000 ? 8 : 4;

          const total = speedScore + reliabilityScore + recencyScore + volumeScore;
          const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D';
          const creditMultiplier = total >= 80 ? 1.5 : total >= 60 ? 1.0 : total >= 40 ? 0.6 : 0.3;

          newScores[c.id] = {
            score: total,
            grade,
            avgPaymentDays: Math.round(avgDays),
            paymentRatio: Math.round(payRatio * 100),
            suggestedCreditLimit: Math.round((totalBusiness / custSales.length) * creditMultiplier),
            breakdown: { speedScore, reliabilityScore, recencyScore, volumeScore }
          };
       });

       return { ...prev, scoreCache: { scores: newScores, lastUpdated: new Date().getTime() } };
    });
  };

  const getCustomerBalance = (customerId) => {
    const salesCredit = data.sales
      .filter(s => s.customerId === customerId)
      .reduce((acc, s) => acc + (s.creditAmount || 0), 0);
      
    const payments = data.payments
      .filter(p => p.customerId === customerId)
      .reduce((acc, p) => acc + (p.amount || 0), 0);
      
    return Math.max(0, salesCredit - payments);
  };

  const getCustomerAging = (customerId) => {
    const customerSales = data.sales
      .filter(s => s.customerId === customerId && s.creditAmount > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    const totalPaid = data.payments
      .filter(p => p.customerId === customerId)
      .reduce((acc, p) => acc + (p.amount || 0), 0);
      
    let remainingPayment = totalPaid;
    
    let currentBucket = 0; // 0-30 days
    let followUpBucket = 0; // 31-60 days
    let urgentBucket = 0; // 60+ days
    
    const now = Date.now();

    customerSales.forEach(sale => {
      let saleRemaining = sale.creditAmount;
      if (remainingPayment >= saleRemaining) {
        remainingPayment -= saleRemaining;
        saleRemaining = 0;
      } else if (remainingPayment > 0) {
        saleRemaining -= remainingPayment;
        remainingPayment = 0;
      }
      
      if (saleRemaining > 0) {
        const daysOld = daysDiff(sale.date);
        if (daysOld <= 30) currentBucket += saleRemaining;
        else if (daysOld <= 60) followUpBucket += saleRemaining;
        else urgentBucket += saleRemaining;
      }
    });

    return { buckets: { current: currentBucket, followUp: followUpBucket, urgent: urgentBucket } };
  };

  const storeValue = {
    data,
    setItem,
    addEntity,
    updateEntity,
    deleteEntity,
    overrideData,
    wipeData,
    processSale,
    processPayment,
    processBatchStatusUpdate,
    processStockMovement,
    processBulkPriceUpdate,
    addCompetitorNote,
    
    getCustomerBalance,
    getCustomerAging,
    getEffectiveRate,
    getLastSoldPrice,
    calculateCustomerScore,
    refreshAllCustomerScores
  };

  return (
    <StoreContext.Provider value={storeValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
