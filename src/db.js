import Dexie from 'dexie';

export const db = new Dexie('BillOfMaterialsDB');

// Schema definition based on PDF Physical Model [cite: 106, 110, 117]
db.version(1).stores({
  // Materials: ID, Name, Description, Measure, Date, Price
  materials: '++id, name, description, measure, date, price', 
  
  // Products: ID, Name, Description
  products: '++id, name, description',
  
  // BOM: Link between Product and Material with Quantity
  bom: '++id, productId, materialId, quantity',
  
  // Expense Types (Nomenclature)
  expenseTypes: '++id, name',
  
  // Product Expenses: Link between Product and Expense Type with Value
  productExpenses: '++id, productId, expenseTypeId, value' 
});

// Helper to check if material is used in any BOM (RQ-3) 
export const isMaterialInUse = async (materialId) => {
  const count = await db.bom.where('materialId').equals(materialId).count();
  return count > 0;
};