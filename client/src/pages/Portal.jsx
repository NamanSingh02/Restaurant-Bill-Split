import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { api, API_BASE, setAuthToken } from '../api.js';
import { getToken, getUser, clearSession } from '../utils/auth.js';
import AddFoodModal from '../components/AddFoodModal.jsx';

export default function Portal() {
  const navigate = useNavigate();
  const token = getToken();
  const sessionUser = getUser();

  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Avoid duplicates when POST adds locally and socket echoes the same item
  const upsertItem = (item) =>
    setItems(prev => (prev.some(i => i._id === item._id) ? prev : [...prev, item]));

  useEffect(() => {
    if (!token || !sessionUser) { navigate('/'); return; }
    setAuthToken(token);

    // Fetch groups for header display and modal
    api.get(`/api/rooms/${sessionUser.roomCode}`)
      .then(res => setGroups(res.data.groups))
      .catch(() => {});

    // Fetch existing items
    api.get(`/api/food/${sessionUser.roomCode}`)
      .then(res => setItems(res.data.items))
      .catch(err => {
        alert(err?.response?.data?.message || 'Room not found or expired');
        clearSession();
        navigate('/');
      });

    // Setup socket for live updates
    const socket = io(API_BASE, { auth: { token }, query: { roomCode: sessionUser.roomCode } });
    socket.on('foodItemAdded', (item) => {
      upsertItem(item);
    });
    return () => socket.disconnect();
  }, []);

  const addFood = async (payload) => {
    try {
      const res = await api.post(`/api/food/${sessionUser.roomCode}`, payload);
      // Optimistic add; upsert prevents double insert when the socket echoes
      upsertItem(res.data.item);
      setShowModal(false);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to add item');
    }
  };

  const calculate = async () => {
    try {
      const res = await api.get(`/api/food/${sessionUser.roomCode}/calc`);
      setBills(res.data.bills);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to calculate');
    }
  };

  // Totals for the two tables
  const totalFoodPrice = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price || 0), 0),
    [items]
  );

  const totalGroupBill = useMemo(
    () => (bills ? bills.reduce((sum, b) => sum + Number(b.bill || 0), 0) : 0),
    [bills]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge">You: {sessionUser?.name}</span>
        <span className="badge">Group: {sessionUser?.groupName}</span>
        <span className="badge">Room Code: {sessionUser?.roomCode}</span>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="h1">Food Items</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Food Item</button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="table">
            <thead>
              <tr className="text-left">
                <th className="th">SNo.</th>
                <th className="th">Food Item</th>
                <th className="th">Price</th>
                <th className="th">Group Names</th>
                <th className="th">Shared %</th>
                <th className="th">Person</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it._id}>
                  <td className="td">{idx + 1}</td>
                  <td className="td">{it.name}</td>
                  <td className="td">{Number(it.price).toFixed(2)}</td>
                  <td className="td">{it.groupNames.join(', ')}</td>
                  <td className="td">{it.percentages.join(', ')}</td>
                  <td className="td">{it.personName}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="td" colSpan={6}>No items yet. Click "Add Food Item" to get started.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="td" colSpan={2}>Total Bill</td>
                <td className="td">{totalFoodPrice.toFixed(2)}</td>
                <td className="td" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button className="btn btn-outline mt-4" onClick={calculate}>Calculate Group Bill</button>
      </div>

      {bills && (
        <div className="card">
          <h3 className="h1">Group Bills</h3>
          <div className="overflow-x-auto mt-4">
            <table className="table">
              <thead>
                <tr className="text-left">
                  <th className="th">Group Name</th>
                  <th className="th">Bill</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.groupNumber}>
                    <td className="td">Group {b.groupNumber}: {b.groupName}</td>
                    <td className="td">{b.bill.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="td">Total Bill</td>
                  <td className="td">{totalGroupBill.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <AddFoodModal
          groups={groups}
          onClose={() => setShowModal(false)}
          onSubmit={addFood}
        />
      )}
    </div>
  );
}
