import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

const Products = () => {
  const products = useLiveQuery(() => db.products.toArray());
  const materialsList = useLiveQuery(() => db.materials.toArray());
  
  const [view, setView] = useState('list');
  const [productData, setProductData] = useState({ name: '', description: '' });
  const [bomData, setBomData] = useState([]); // Array of { materialId, quantity }
  
  // Handlers for dynamic BOM rows
  const addBomRow = () => setBomData([...bomData, { materialId: '', quantity: 1 }]);
  
  const updateBomRow = (index, field, value) => {
    const newBom = [...bomData];
    newBom[index][field] = value;
    setBomData(newBom);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    // Transaction to save Product and BOM items
    await db.transaction('rw', db.products, db.bom, async () => {
      const prodId = await db.products.add(productData);
      const bomItems = bomData.map(item => ({
        productId: prodId,
        materialId: parseInt(item.materialId),
        quantity: parseFloat(item.quantity)
      }));
      await db.bom.bulkAdd(bomItems);
    });
    setView('list');
    setProductData({ name: '', description: '' });
    setBomData([]);
  };

  return (
    <div className="table-container">
      {view === 'list' ? (
        <>
           <div className="controls" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Търсене" style={{ padding: '8px' }} />
              <button className="btn btn-primary">ТЪРСЕНЕ</button>
            </div>
            <button className="btn btn-add" onClick={() => setView('add')}>
              Добавяне на Изделие
            </button>
          </div>
          <table>
            <thead>
              <tr><th>ID</th><th>Име</th><th>Описание</th></tr>
            </thead>
            <tbody>
              {products?.map(p => (
                <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.description}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="card-container">
          <div className="form-card" style={{ width: '600px' }}>
             <h2 style={{ textAlign: 'center' }}>Добавяне на Изделие</h2>
             <form onSubmit={handleSaveProduct}>
                <div className="form-group">
                  <label>Име на Изделие</label>
                  <input required onChange={e => setProductData({...productData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Описание</label>
                  <input onChange={e => setProductData({...productData, description: e.target.value})} />
                </div>
                
                <hr />
                <h3>Спецификация (Материали)</h3>
                {bomData.map((row, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select required style={{flex: 2}} 
                            onChange={e => updateBomRow(index, 'materialId', e.target.value)}>
                      <option value="">Избери материал</option>
                      {materialsList?.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.price} лв.)</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Кол." style={{flex: 1}} required
                           onChange={e => updateBomRow(index, 'quantity', e.target.value)} />
                  </div>
                ))}
                <button type="button" className="btn" onClick={addBomRow} style={{marginBottom: '20px'}}>+ Добави Материал</button>

                <button type="submit" className="btn btn-login">Запазване</button>
                <button type="button" onClick={() => setView('list')} className="btn" style={{marginTop: '10px', width: '100%'}}>Отказ</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;