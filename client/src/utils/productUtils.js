export function getSaleDisplayProduct(item) {
  // PRIVACY: actualSpec is intentionally excluded here
  return {
    name: item.productName,
    spec: item.labelSpec,  // ONLY labelSpec, never actualSpec
    unit: item.unit,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount
  }
}
