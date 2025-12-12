import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { CgDetailsMore } from "react-icons/cg";
import { db, isMaterialInUse } from './db';
import { IoMdSearch } from 'react-icons/io';
import { IoMdAdd } from "react-icons/io";

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

      // Филтриране по номер, име и описание
      return collection.filter(m => 
        m.name.toLowerCase().includes(lowerTerm) ||
        (m.description && m.description.toLowerCase().includes(lowerTerm)) ||
        m.id.toString().includes(lowerTerm)
      ).toArray();
    }
    
    return collection.toArray();
  }, [activeSearch]);
  const units = useLiveQuery(() => db.units.toArray(), []);

  const handleSearch = () => setActiveSearch(searchInput);

  // При натискане на "Enter" в полето за търсене
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
      alert("Не може да се изтрива материал, който вече е използван!");
    } else {
        const material = await db.materials.get(id);
        if (window.confirm(`Искате ли да изтриете материала „${material.name}“?`)) {
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
      <h1>Материали</h1>
      
      {view === 'list' ? (
        <div>
          <div className="controls" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="..." 
                style={{ padding: '8px' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-primary" onClick={handleSearch}>
                <IoMdSearch style={{fontSize: 18}}/>
              </button>
            </div>
            <button className="btn btn-add" onClick={() => { setView('add'); setFormData({ name: '', description: '', unitId: '', price: '', date: '' }); setPriceList([{ price: '', date: '' }]); }}>
              Нов материал
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Име</th>
                <th>Описание</th>
                <th>Мерна единица</th>
                <th></th>
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
        </div>
      ) 
      : view === 'details' ? (
        <div className="card-container">
          <div className="form-card">
            <h2 style={{ textAlign: 'center' }}>Подробности за материал</h2>
            <p><strong>Име:</strong> {detailsMaterial.name}</p>
            <p><strong>Описание:</strong> {detailsMaterial.description}</p>
            <p><strong>Мерна единица:</strong> {units.find(u => u.id === detailsMaterial.unitId)?.name || 'N/A'}</p>
            <h3>Изделия, свързани с този материал</h3>
            {productsUsingMaterial.length > 0 ? (
              <ul>
                {productsUsingMaterial.map(product => (
                  <li key={product.id}>
                    {product.name} ({product.count})
                  </li>
                ))}
              </ul>
            ) : (
              <p>Няма</p>
            )}
            <button className="btn" onClick={handleBackToList} style={{ marginTop: '20px' }}>Обратно към списъка</button>
          </div>
        </div>
      ) : (
        <div className="card-container">
          <div className="form-card">
            <h2 style={{ textAlign: 'center' }}>{view === 'add' ? 'Нов материал' : 'Редактиране на материал'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Име</label>
                <input required type="text" value={formData.name} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input type="text" value={formData.description} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Мерна единица</label>
                <select required value={formData.unitId} disabled={isRestricted && view === 'edit'}
                        onChange={e => setFormData({...formData, unitId: e.target.value})}>
                  <option value="">-- Избери мерна единица --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Нова мерна единица</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} />
                  <button type="button" className="btn" onClick={handleAddUnit}><IoMdAdd style={{fontSize: 18}}/></button>
                </div>
              </div>

              {/* Price List Section */}
              <div className="form-group">
                <label>Ценова листа</label>
                {priceList.map((row, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="number"
                      placeholder="Цена"
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
                      <button type="button" onClick={() => handleRemovePriceRow(index)}>Изтрий</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn" onClick={handleAddPriceRow}>+ Добави</button>
              </div>

              <button type="submit" className="btn btn-form">Добави</button>
              <button type="button" onClick={() => setView('list')} className="btn" style={{marginTop: '10px', width: '100%'}}>Отказ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;