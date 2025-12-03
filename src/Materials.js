import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { CgDetailsMore } from "react-icons/cg";
import { db, isMaterialInUse } from './db';

const Materials = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({ name: '', description: '', unitId: '', price: '', date: '' });
  const [editId, setEditId] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [newUnit, setNewUnit] = useState('');
  const [priceList, setPriceList] = useState([{ price: '', date: '' }]);
  const [detailsMaterial, setDetailsMaterial] = useState(null);
  const [productsUsingMaterial, setProductsUsingMaterial] = useState([]);

  const materials = useLiveQuery(async () => {
    let collection = db.materials.toCollection();

    if (activeSearch.trim()) {
      const lowerTerm = activeSearch.toLowerCase();
      // Filter matching ID, Name, or Description (RQ-1) 
      return collection.filter(m => 
        m.name.toLowerCase().includes(lowerTerm) ||
        (m.description && m.description.toLowerCase().includes(lowerTerm)) ||
        m.id.toString().includes(lowerTerm)
      ).toArray();
    }
    
    return collection.toArray();
  }, [activeSearch]);
  const units = useLiveQuery(() => db.units.toArray(), []);
  //const materialPrices = useLiveQuery(() => db.materialPrices.toArray(), []);

  const handleSearch = () => setActiveSearch(searchInput);

  // Handler for pressing "Enter" in the search box
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddPriceRow = () => {
    setPriceList([...priceList, { price: '', date: '' }]);
  };

  const handleUpdatePriceRow = (index, field, value) => {
    const updatedPriceList = [...priceList];
    updatedPriceList[index][field] = value;
    setPriceList(updatedPriceList);
  };

  const handleRemovePriceRow = (index) => {
    const updatedPriceList = priceList.filter((_, i) => i !== index);
    setPriceList(updatedPriceList);
  };

  const savePriceList = async (materialId, view) => {
    if (view === 'add') {
        const formattedPrices = priceList.map(p => ({
            materialId: materialId,
            price: parseFloat(p.price),
            date: p.date
        }));
        await db.materialPrices.bulkAdd(formattedPrices);
        return;
    }

    const existingPrices = await db.materialPrices.where('materialId').equals(materialId).toArray();

    // Find newly added prices
    const newPrices = priceList.filter(p => !p.id);
    if (newPrices.length > 0) {
      const formattedNewPrices = newPrices.map(p => ({
        materialId: materialId,
        price: parseFloat(p.price),
        date: p.date
      }));
      await db.materialPrices.bulkAdd(formattedNewPrices);
    }

    // Find edited prices
    const editedPrices = priceList.filter(p => p.id && existingPrices.some(ep => ep.id === p.id && (ep.price !== parseFloat(p.price) || ep.date !== p.date)));
    for (const price of editedPrices) {
      await db.materialPrices.update(price.id, {
        price: parseFloat(price.price),
        date: price.date
      });
    }

    // Find removed prices
    const removedPrices = existingPrices.filter(ep => !priceList.some(p => p.id === ep.id));
    for (const price of removedPrices) {
      await db.materialPrices.delete(price.id);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (view === 'add') {
      const materialId = await db.materials.add({
        name: formData.name,
        description: formData.description,
        unitId: parseInt(formData.unitId)
      });
        await savePriceList(materialId, view);
    } else if (view === 'edit') {
      if (!isRestricted) {
        await db.materials.update(editId, {
          name: formData.name,
          description: formData.description,
          unitId: parseInt(formData.unitId)
        });
      }
      await savePriceList(editId, view);
    }
    setView('list');
    setFormData({ name: '', description: '', unitId: '', price: '', date: '' });
    setPriceList([{ price: '', date: '' }]);
  };

  const handleAddUnit = async () => {
    if (newUnit.trim()) {
      await db.units.add({ name: newUnit });
      setNewUnit('');
    }
  };

  const handleEdit = async (material) => {
    const inUse = await isMaterialInUse(material.id);
    setIsRestricted(inUse);
    setEditId(material.id);
    setFormData({
      name: material.name,
      description: material.description,
      unitId: material.unitId
    });
    const prices = await db.materialPrices.where('materialId').equals(material.id).toArray();
    setPriceList(prices.length > 0 ? prices.map(p => ({ price: p.price, date: p.date })) : [{ price: '', date: '' }]);
    setView('edit');
  };

  const handleDelete = async (id) => {
    const inUse = await isMaterialInUse(id);
    if (inUse) {
      alert("Cannot delete a material that is in use!");
    } else {
        const material = await db.materials.get(id);
        if (window.confirm(`Are you sure you want to delete material ${material.name}?`)) {
            await db.materials.delete(id);
        }
    }
  };

  const handleDetails = async (material) => {
    const products = await db.bom
      .where('materialId')
      .equals(material.id)
      .toArray();

    const productCounts = products.reduce((acc, bom) => {
      acc[bom.productId] = (acc[bom.productId] || 0) + bom.quantity;
      return acc;
    }, {});

    const productDetails = await Promise.all(
      Object.keys(productCounts).map(async (productId) => {
        const product = await db.products.get(parseInt(productId));
        return { ...product, count: productCounts[productId] };
      })
    );

    setDetailsMaterial(material);
    setProductsUsingMaterial(productDetails);
    setView('details');
  };

  const handleBackToList = () => {
    setView('list');
    setDetailsMaterial(null);
    setProductsUsingMaterial([]);
  };

  if (!materials || !units) return null;

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
            <button className="btn btn-add" onClick={() => { setView('add'); setFormData({ name: '', description: '', unitId: '', price: '', date: '' }); setPriceList([{ price: '', date: '' }]); }}>
              Add Material
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Description</th><th>Unit</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.name}</td>
                  <td>{m.description}</td>
                  <td>{units.find(u => u.id === m.unitId)?.name || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEdit(m)} className="btn-icon">
                        <FaEdit/>
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="btn-icon">
                        <MdDelete/>
                    </button>
                    <button onClick={() => handleDetails(m)} className="btn-icon">
                        <CgDetailsMore/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : view === 'details' ? (
        <div className="card-container">
          <div className="form-card">
            <h2 style={{ textAlign: 'center' }}>Material Details</h2>
            <p><strong>Name:</strong> {detailsMaterial.name}</p>
            <p><strong>Description:</strong> {detailsMaterial.description}</p>
            <p><strong>Unit:</strong> {units.find(u => u.id === detailsMaterial.unitId)?.name || 'N/A'}</p>
            <h3>Products Using This Material</h3>
            {productsUsingMaterial.length > 0 ? (
              <ul>
                {productsUsingMaterial.map(product => (
                  <li key={product.id}>
                    {product.name} ({product.count})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No products use this material.</p>
            )}
            <button className="btn" onClick={handleBackToList} style={{ marginTop: '20px' }}>Back to List</button>
          </div>
        </div>
      ) : (
        <div className="card-container">
          <div className="form-card">
            <h2 style={{ textAlign: 'center' }}>{view === 'add' ? 'Add New Material' : 'Edit Material'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input required type="text" value={formData.name} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={formData.description} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select required value={formData.unitId} disabled={isRestricted && view === 'edit'}
                        onChange={e => setFormData({...formData, unitId: e.target.value})}>
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>New Unit</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} />
                  <button type="button" className="btn" onClick={handleAddUnit}>Add Unit</button>
                </div>
              </div>

              {/* Price List Section */}
              <div className="form-group">
                <label>Prices</label>
                {priceList.map((row, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="number"
                      placeholder="Price"
                      value={row.price}
                      onChange={e => handleUpdatePriceRow(index, 'price', e.target.value)}
                      required
                    />
                    <input
                      type="date"
                      value={row.date}
                      onChange={e => handleUpdatePriceRow(index, 'date', e.target.value)}
                      required
                    />
                    {priceList.length > 1 && (
                      <button type="button" onClick={() => handleRemovePriceRow(index)}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn" onClick={handleAddPriceRow}>+ Add Price</button>
              </div>

              <button type="submit" className="btn btn-login">Save</button>
              <button type="button" onClick={() => setView('list')} className="btn" style={{marginTop: '10px', width: '100%'}}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;