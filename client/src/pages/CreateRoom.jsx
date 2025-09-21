import { useState } from 'react';
import { api, setAuthToken } from '../api.js';
import { saveSession } from '../utils/auth.js';
import { useNavigate } from 'react-router-dom';

export default function CreateRoom() {
  const [numGroups, setNumGroups] = useState(3);
  const [groupNames, setGroupNames] = useState(['', '', '']);
  const [creatorName, setCreatorName] = useState('');
  const [creatorGroupNumber, setCreatorGroupNumber] = useState(1);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const updateCount = (n) => {
    const count = Math.max(1, Number(n) || 1);
    setNumGroups(count);
    setGroupNames(prev => {
      const arr = [...prev];
      if (arr.length < count) {
        while (arr.length < count) arr.push('');
      } else if (arr.length > count) {
        arr.length = count;
      }
      return arr;
    });
    if (creatorGroupNumber > count) setCreatorGroupNumber(1);
  };

  const submit = async () => {
    if (!creatorName.trim()) return alert('Please enter your name');
    if (groupNames.some(n => !n.trim())) return alert('Please fill all group names');
    if (creatorGroupNumber < 1 || creatorGroupNumber > numGroups) return alert('Invalid creator group number');

    try {
      setCreating(true);
      const res = await api.post('/api/rooms', {
        numGroups, groupNames, creatorName: creatorName.trim(), creatorGroupNumber
      });
      const { roomCode, groups, token } = res.data;
      setAuthToken(token);
      const groupName = groups.find(g => g.number === Number(creatorGroupNumber))?.name;
      saveSession({ token, user: { name: creatorName.trim(), groupNumber: Number(creatorGroupNumber), groupName, roomCode } });
      navigate('/portal');
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="card">
      <h2 className="h1 mb-4">Create Room</h2>

      <div className="mb-4">
        <label className="label">How many groups are involved?</label>
        <input className="input" type="number" min={1} value={numGroups}
               onChange={e => updateCount(e.target.value)} />
      </div>

      <h3 className="h2">Room Details</h3>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        {groupNames.map((val, idx) => (
          <div key={idx}>
            <label className="label">Group {idx + 1} name</label>
            <input className="input" value={val}
                   onChange={e => setGroupNames(g => {
                     const arr = [...g];
                     arr[idx] = e.target.value;
                     return arr;
                   })} />
          </div>
        ))}
      </div>

      <h3 className="h2 mt-6">User Details</h3>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div>
          <label className="label">Your name</label>
          <input className="input" value={creatorName} onChange={e => setCreatorName(e.target.value)} />
        </div>
        <div>
          <label className="label">Your group number (1–{numGroups})</label>
          <input className="input" type="number" min={1} max={numGroups}
                 value={creatorGroupNumber}
                 onChange={e => setCreatorGroupNumber(Number(e.target.value))} />
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="font-semibold text-gray-700">Summary</div>
        <ul className="text-sm text-gray-700 mt-2 list-disc ml-5">
          <li>Groups: {groupNames.map((n, i) => `Group ${i+1}: ${n || '(blank)'}`).join(', ')}</li>
          <li>Your name: {creatorName || '(blank)'}</li>
          <li>Your group number: {creatorGroupNumber}</li>
        </ul>
      </div>

      <button className="btn btn-primary mt-6" onClick={submit} disabled={creating}>
        {creating ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  );
}
