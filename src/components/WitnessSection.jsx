import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addWitness, deleteWitness } from '../features/witnessSlice';

function WitnessSection() {
  const dispatch = useDispatch();
  const witnesses = useSelector((state) => state.witness.witnesses);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;
    dispatch(addWitness({ name, description }));
    setName('');
    setDescription('');
  };

  const handleDelete = (id) => {
    dispatch(deleteWitness(id));
  };

  return (
    <div>
      <h3>Witnesses</h3>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <button type="submit">Add Witness</button>
      </form>
      <ul>
        {witnesses.map((w) => (
          <li key={w.id}>
            <strong>{w.name}</strong>: {w.description}{' '}
            <button type="button" onClick={() => handleDelete(w.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WitnessSection;
