import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CgDetailsMore } from "react-icons/cg";
import { db } from './db';

const Products = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [view, setView] = useState('list');
  const [productData, setProductData] = useState({ name: '', description: '' });
  const [bomData, setBomData] = useState([]); // Array of { materialId, quantity }
  const [expensesData, setExpensesData] = useState([]); // Array of { expenseTypeId, value }
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [profit, setProfit] = useState(0);

  const products = useLiveQuery(async () => {
    let collection = db.products.toCollection();

    if (activeSearch.trim()) {
      const lowerTerm = activeSearch.toLowerCase();
      return collection.filter(p => 
        p.name.toLowerCase().includes(lowerTerm) ||
        (p.description && p.description.toLowerCase().includes(lowerTerm)) ||
        p.id.toString().includes(lowerTerm)
      ).toArray();
    }

    return collection.toArray();
  }, [activeSearch]);

  const materialsList = useLiveQuery(() => db.materials.toArray());
  const materialPrices = useLiveQuery(() => db.materialPrices.toArray());
  const expenseTypes = useLiveQuery(() => db.expenseTypes.toArray());

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addBomRow = () => setBomData([...bomData, { materialId: '', quantity: 1 }]);

  const updateBomRow = (index, field, value) => {
    const newBom = [...bomData];
    newBom[index][field] = value;
    setBomData(newBom);
  };

  const addExpenseRow = () => setExpensesData([...expensesData, { expenseTypeId: '', value: 0 }]);

  const updateExpenseRow = (index, field, value) => {
    const newExpenses = [...expensesData];
    newExpenses[index][field] = value;
    setExpensesData(newExpenses);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    await db.transaction('rw', db.products, db.bom, db.productExpenses, async () => {
      const prodId = await db.products.add(productData);

      const bomItems = bomData.map(item => ({
        productId: prodId,
        materialId: parseInt(item.materialId),
        quantity: parseFloat(item.quantity)
      }));
      await db.bom.bulkAdd(bomItems);

      const productExpenses = expensesData.map(expense => ({
        productId: prodId,
        expenseTypeId: parseInt(expense.expenseTypeId),
        value: parseFloat(expense.value)
      }));
      await db.productExpenses.bulkAdd(productExpenses);
    });

    setView('list');
    setProductData({ name: '', description: '' });
    setBomData([]);
    setExpensesData([]);
  };

  const handleDetails = async (product) => {
    const bom = await db.bom.where('productId').equals(product.id).toArray();
    const expenses = await db.productExpenses.where('productId').equals(product.id).toArray();

    const bomWithPrices = bom.map(item => {
      const recentPrice = materialPrices
        ?.filter(p => p.materialId === item.materialId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return {
        ...item,
        selectedPriceId: recentPrice?.id || null,
      };
    });

    setDetailsProduct({ ...product, bom: bomWithPrices, expenses });
    setView('details');
  };

  const updateBomPriceSelection = (index, priceId) => {
    const updatedBom = [...detailsProduct.bom];
    updatedBom[index].selectedPriceId = priceId;
    setDetailsProduct({ ...detailsProduct, bom: updatedBom });
  };

  const calculateCosts = () => {
    const materialExpenses = detailsProduct.bom.reduce((sum, item) => {
      const selectedPrice = materialPrices?.find(p => p.id === item.selectedPriceId)?.price || 0;
      return sum + selectedPrice * item.quantity;
    }, 0);

    const otherExpenses = detailsProduct.expenses.reduce((sum, expense) => sum + expense.value, 0);
    const totalCost = materialExpenses + otherExpenses;
    const productPrice = totalCost + parseFloat(profit);

    return { materialExpenses, totalCost, productPrice };
  };

  return (
    <div className="table-container">
      {view === 'list' ? (
        <>
          <div className="controls" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Search" 
                style={{ padding: '8px' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-primary" onClick={handleSearch}>
                Search
              </button>
            </div>
            <button className="btn btn-add" onClick={() => setView('add')}>
              Add Product
            </button>
          </div>
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products?.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>
                    <button onClick={() => handleDetails(p)} className="btn-icon btn-icon-primary"><CgDetailsMore /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : view === 'details' ? (
        <div className="card-container">
          <div className="form-card">
            <h2>Product Details</h2>
            <p><strong>Name:</strong> {detailsProduct.name}</p>
            <p><strong>Description:</strong> {detailsProduct.description}</p>
            <h3>Materials</h3>
            {detailsProduct.bom.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span>{materialsList?.find(m => m.id === item.materialId)?.name || 'Unknown'}</span>
                <span>Quantity: {item.quantity}</span>
                <select
                  value={item.selectedPriceId || ''}
                  onChange={e => updateBomPriceSelection(index, parseInt(e.target.value))}
                >
                  {materialPrices
                    ?.filter(p => p.materialId === item.materialId)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.price} EUR (Date: {p.date})
                      </option>
                    ))}
                </select>
              </div>
            ))}
            <h3>Other Expenses</h3>
            {detailsProduct.expenses.map((expense, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span>{expenseTypes?.find(e => e.id === expense.expenseTypeId)?.name || 'Unknown'}</span>
                <span>Value: {expense.value}</span>
              </div>
            ))}
            <h3>Profit</h3>
            <input type="number" value={profit} onChange={e => setProfit(e.target.value)} />
            <h3>Calculations</h3>
            <div>
              {(() => {
                const { materialExpenses, totalCost, productPrice } = calculateCosts();
                return (
                  <>
                    <p><strong>Material Expenses:</strong> {materialExpenses.toFixed(2)} BGN</p>
                    <p><strong>Total Cost:</strong> {totalCost.toFixed(2)} BGN</p>
                    <p><strong>Product Price (with Profit):</strong> {productPrice.toFixed(2)} BGN</p>
                  </>
                );
              })()}
            </div>
            <button onClick={() => setView('list')} style={{ marginTop: '20px' }}>Back to List</button>
          </div>
        </div>
      ) : (
        <div className="card-container">
          <div className="form-card">
            <h2 style={{ textAlign: 'center' }}>Add Product</h2>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label>Product Name</label>
                <input required onChange={e => setProductData({...productData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input onChange={e => setProductData({...productData, description: e.target.value})} />
              </div>
              <hr />
              <h3>Bill of Materials (Materials)</h3>
              {bomData.map((row, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select required style={{flex: 2}} 
                          onChange={e => updateBomRow(index, 'materialId', e.target.value)}>
                    <option value="">Select Material</option>
                    {materialsList?.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <span>
                    {materialPrices
                      ?.filter(p => p.materialId === parseInt(row.materialId))
                      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.price || 0} BGN
                  </span>
                  <input type="number" placeholder="Qty" style={{flex: 1}} required
                         onChange={e => updateBomRow(index, 'quantity', e.target.value)} />
                </div>
              ))}
              <button type="button" className="btn" onClick={addBomRow} style={{marginBottom: '20px'}}>+ Add Material</button>
              <hr />
              <h3>Other Expenses</h3>
              {expensesData.map((row, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select required style={{flex: 2}}
                          onChange={e => updateExpenseRow(index, 'expenseTypeId', e.target.value)}>
                    <option value="">Select Expense Type</option>
                    {expenseTypes?.map(expense => (
                      <option key={expense.id} value={expense.id}>{expense.name}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Value" style={{flex: 1}} required
                         onChange={e => updateExpenseRow(index, 'value', e.target.value)} />
                </div>
              ))}
              <button type="button" className="btn" onClick={addExpenseRow} style={{marginBottom: '20px'}}>+ Add Expense</button>
              <button type="submit" className="btn btn-login">Save</button>
              <button type="button" onClick={() => setView('list')} className="btn" style={{marginTop: '10px', width: '100%'}}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;