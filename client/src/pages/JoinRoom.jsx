import { useState } from 'react';
import { api, setAuthToken } from '../api.js';
import { saveSession } from '../utils/auth.js';
import { useNavigate } from 'react-router-dom';

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [groups, setGroups] = useState(null);
  const [name, setName] = useState('');
  const [groupNumber, setGroupNumber] = useState(1);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    if (!roomCode.trim()) return alert('Enter room code');
    try {
      const res = await api.get(`/api/rooms/${roomCode.trim()}`);
      setGroups(res.data.groups);
      setGroupNumber(res.data.groups[0]?.number || 1);
    } catch (e) {
      alert(e?.response?.data?.message || 'Room not found');
    }
  };

  const join = async () => {
    if (!name.trim()) return alert('Enter your name');
    try {
      const res = await api.post('/api/rooms/join', { roomCode: roomCode.trim(), name: name.trim(), groupNumber });
      const { token, groups } = res.data;
      setAuthToken(token);
      const groupName = groups.find(g => g.number === Number(groupNumber))?.name;
      saveSession({ token, user: { name: name.trim(), groupNumber: Number(groupNumber), groupName, roomCode: roomCode.trim() } });
      navigate('/portal');
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to join room');
    }
  };

  return (
    <div className="card">
      <h2 className="h1 mb-4">Join Room</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="label">Enter room code</label>
          <input className="input" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button className="btn btn-outline w-full" onClick={fetchGroups}>Fetch Groups</button>
        </div>
      </div>

      {groups && (
        <div className="mt-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="font-semibold text-gray-700">Groups in this room</div>
            <ul className="text-sm text-gray-700 mt-2 list-disc ml-5">
              {groups.map(g => <li key={g.number}>Group {g.number}: {g.name}</li>)}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label">Your name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Select your group</label>
              <select className="input" value={groupNumber} onChange={e => setGroupNumber(Number(e.target.value))}>
                {groups.map(g => (
                  <option key={g.number} value={g.number}>Group {g.number}: {g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-primary mt-6" onClick={join}>Join</button>
        </div>
      )}
    </div>
  );
}
