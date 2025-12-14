import Dexie from 'dexie';

export const db = new Dexie('BillOfMaterialsDB');

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

db.version(2).stores({
  // Materials: ID, Name, Description, Unit ID
  materials: '++id, name, description, unitId',
  
  // Units: ID, Name
  units: '++id, name',
  
  // Material Prices: ID, Material ID, Price, Date
  materialPrices: '++id, materialId, price, date',
  
  // Products: ID, Name, Description
  products: '++id, name, description',
  
  // BOM: Link between Product and Material with Quantity
  bom: '++id, productId, materialId, quantity',
  
  // Expense Types
  expenseTypes: '++id, name',
  
  // Product Expenses: Link between Product and Expense Type with Value
  productExpenses: '++id, productId, expenseTypeId, value'
});

// Вложен ли е материала в който и да е продукт?
export const isMaterialInUse = async (materialId) => {
  const count = await db.bom.where('materialId').equals(materialId).count();
  return count > 0;
};