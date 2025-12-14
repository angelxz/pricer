import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { IoMdSearch } from 'react-icons/io';

const Expenses = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [name, setName] = useState('');

  const expenseTypes = useLiveQuery(async () => {
    let collection = db.expenseTypes.toCollection();

    if (activeSearch.trim()) {
      const lowerTerm = activeSearch.toLowerCase();

      // Търсене по № или име
      return collection.filter(e => 
        e.name.toLowerCase().includes(lowerTerm) ||
        e.id.toString().includes(lowerTerm)
      ).toArray();
    }

    return collection.toArray();
  }, [activeSearch]);

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAdd = async () => {
    if (name) {
      await db.expenseTypes.add({ name });
      setIsAddMode(false);
      setName('');
    }
  };

  return (
    <div className="table-container">
      <h1>Разходи</h1>
      <div className="controls" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Търси по № и име" 
            style={{ padding: '8px' }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            <IoMdSearch style={{fontSize: 18}}/>
          </button>
        </div>
        <button className="btn btn-add" onClick={() => setIsAddMode(true)}>Нов разход</button>
      </div>

      {isAddMode && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#e0e0e0' }}>
           <input placeholder="Име на разхода" value={name} onChange={e => setName(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
           <button className="btn btn-primary" onClick={handleAdd}>Добави</button>
           <button className="btn" onClick={() => setIsAddMode(false)}>Отказ</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Разход</th>
          </tr>
        </thead>
        <tbody>
          {expenseTypes?.map(e => (
            <tr key={e.id}><td>{e.id}</td><td>{e.name}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Expenses;