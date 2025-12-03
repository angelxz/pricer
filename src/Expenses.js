import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

const Expenses = () => {
  const expenseTypes = useLiveQuery(() => db.expenseTypes.toArray());
  const [isAddMode, setIsAddMode] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if(name) {
      await db.expenseTypes.add({ name });
      setIsAddMode(false);
      setName('');
    }
  };

  return (
    <div className="table-container">
      <div className="controls" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setIsAddMode(true)}>ДОБАВЯНЕ НА РАЗХОД</button>
      </div>

      {isAddMode && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#e0e0e0' }}>
           <input placeholder="Име на разход" value={name} onChange={e => setName(e.target.value)} style={{ marginRight: '10px', padding: '5px' }} />
           <button className="btn btn-primary" onClick={handleAdd}>Запиши</button>
           <button className="btn" onClick={() => setIsAddMode(false)}>Отказ</button>
        </div>
      )}

      <table>
        <thead>
          <tr><th>ID</th><th>Вид Разход</th></tr>
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