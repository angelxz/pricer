import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

const Expenses = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [name, setName] = useState('');

  // Updated Query Logic: Filters based on activeSearch
  const expenseTypes = useLiveQuery(async () => {
    let collection = db.expenseTypes.toCollection();

    if (activeSearch.trim()) {
      const lowerTerm = activeSearch.toLowerCase();
      // Filter matching ID or Name
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
        <button className="btn btn-primary" onClick={() => setIsAddMode(true)}>ADD EXPENSE</button>
      </div>

      {isAddMode && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#e0e0e0' }}>
           <input placeholder="Expense Name" value={name} onChange={e => setName(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
           <button className="btn btn-primary" onClick={handleAdd}>Save</button>
           <button className="btn" onClick={() => setIsAddMode(false)}>Cancel</button>
        </div>
      )}

      <table>
        <thead>
          <tr><th>ID</th><th>Expense Type</th></tr>
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