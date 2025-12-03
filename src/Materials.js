import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isMaterialInUse } from './db';

const Materials = () => {
  // State for the input field text
  const [searchInput, setSearchInput] = useState('');
  // State for the actual active search query (updates only when button is clicked)
  const [activeSearch, setActiveSearch] = useState('');
  
  const [view, setView] = useState('list'); // 'list' or 'add' or 'edit'
  const [formData, setFormData] = useState({ name: '', description: '', measure: '', date: '', price: '' });
  const [editId, setEditId] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);

  // Updated Query Logic: Filters based on activeSearch
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

  // Handler for the Search Button
  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  // Handler for pressing "Enter" in the search box
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      measure: formData.measure,
      date: formData.date,
      price: parseFloat(formData.price)
    };

    if (view === 'add') {
      await db.materials.add(payload);
    } else if (view === 'edit') {
      if (isRestricted) {
        await db.materials.update(editId, { price: payload.price, date: payload.date });
      } else {
        await db.materials.update(editId, payload);
      }
    }
    setView('list');
    setFormData({ name: '', description: '', measure: '', date: '', price: '' });
  };

  const handleEdit = async (material) => {
    const inUse = await isMaterialInUse(material.id);
    setIsRestricted(inUse);
    setEditId(material.id);
    setFormData(material);
    setView('edit');
  };

  const handleDelete = async (id) => {
    const inUse = await isMaterialInUse(id);
    if (inUse) {
      alert("Не може да изтриете материал, който се използва в изделие!");
    } else {
      await db.materials.delete(id);
    }
  };

  if (!materials) return null;

  return (
    <div className="table-container">
      {view === 'list' ? (
        <>
          <div className="controls" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="btn" style={{ border: '1px solid #ccc' }}>
                <option>Филтър</option>
              </select>
              
              {/* Updated Search Input */}
              <input 
                type="text" 
                placeholder="Търсене" 
                style={{ padding: '8px' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown} 
              />
              
              {/* Updated Search Button */}
              <button className="btn btn-primary" onClick={handleSearch}>
                ТЪРСЕНЕ
              </button>
            </div>
            
            <button className="btn btn-add" onClick={() => { setView('add'); setIsRestricted(false); setFormData({ name: '', description: '', measure: '', date: '', price: '' }); }}>
              Добавяне на Материал
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th><th>Име</th><th>Описание</th><th>Мерна Единица</th><th>Дата</th><th>Цена</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {materials.length > 0 ? (
                materials.map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.name}</td>
                    <td>{m.description}</td>
                    <td>{m.measure}</td>
                    <td>{m.date}</td>
                    <td>{m.price}</td>
                    <td>
                      <button onClick={() => handleEdit(m)} style={{ marginRight: '5px' }}>✏️</button>
                      <button onClick={() => handleDelete(m.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                    Няма намерени резултати.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      ) : (
        <div className="card-container">
          <div className="form-card">
            <h2 style={{ textAlign: 'center' }}>{view === 'add' ? 'Добавяне на Материал' : 'Редакция'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Име на Материал</label>
                <input required type="text" value={formData.name} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input type="text" value={formData.description} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Мерна Единица</label>
                <input required type="text" value={formData.measure} disabled={isRestricted && view === 'edit'}
                       onChange={e => setFormData({...formData, measure: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Дата</label>
                <input required type="date" value={formData.date}
                       onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Цена</label>
                <input required type="number" step="0.01" value={formData.price}
                       onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-login">Запазване</button>
              <button type="button" onClick={() => setView('list')} className="btn" style={{marginTop: '10px', width: '100%'}}>Отказ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;