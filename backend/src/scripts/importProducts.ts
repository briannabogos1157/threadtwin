/**
 * Legacy DB import script — disabled. Catalog is served via Manus (/api/products).
 */
async function importProducts() {
  console.log('Skipped: database import removed. Use Manus-backed API for products.');
}

if (require.main === module) {
  void importProducts();
}
