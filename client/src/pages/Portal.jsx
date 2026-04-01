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

  const [enteredBillTotal, setEnteredBillTotal] = useState('');
  const [ratio, setRatio] = useState(null);

  const upsertItem = (item) =>
    setItems(prev => (prev.some(i => i._id === item._id) ? prev : [...prev, item]));

  const removeItem = (itemId) =>
    setItems(prev => prev.filter(i => i._id !== itemId));

  useEffect(() => {
    if (!token || !sessionUser) {
      navigate('/');
      return;
    }

    setAuthToken(token);

    api.get(`/api/rooms/${sessionUser.roomCode}`)
      .then(res => {
        setGroups(res.data.groups);
        setEnteredBillTotal(
          res.data.enteredBillTotal === null || res.data.enteredBillTotal === undefined
            ? ''
            : String(res.data.enteredBillTotal)
        );
      })
      .catch(() => {});

    api.get(`/api/food/${sessionUser.roomCode}`)
      .then(res => setItems(res.data.items))
      .catch(err => {
        alert(err?.response?.data?.message || 'Room not found or expired');
        clearSession();
        navigate('/');
      });

    const socket = io(API_BASE, {
      auth: { token },
      query: { roomCode: sessionUser.roomCode }
    });

    socket.on('foodItemAdded', (item) => {
      upsertItem(item);
      setEnteredBillTotal('');
      setRatio(null);
      setBills(null);
    });

    socket.on('foodItemDeleted', ({ itemId }) => {
      removeItem(itemId);
      setEnteredBillTotal('');
      setRatio(null);
      setBills(null);
    });

    socket.on('enteredBillTotalUpdated', ({ enteredBillTotal }) => {
      setEnteredBillTotal(
        enteredBillTotal === null || enteredBillTotal === undefined
          ? ''
          : String(enteredBillTotal)
      );
      setRatio(null);
      setBills(null);
    });

    socket.on('enteredBillTotalCleared', () => {
      setEnteredBillTotal('');
      setRatio(null);
      setBills(null);
    });

    return () => socket.disconnect();
  }, []);

  const addFood = async (payload) => {
    try {
      const res = await api.post(`/api/food/${sessionUser.roomCode}`, payload);
      upsertItem(res.data.item);
      setEnteredBillTotal('');
      setRatio(null);
      setBills(null);
      setShowModal(false);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to add item');
    }
  };

  const deleteFood = async (itemId) => {
    const confirmed = window.confirm('Are you sure you want to delete this food item?');
    if (!confirmed) return;

    try {
      await api.delete(`/api/food/${sessionUser.roomCode}/${itemId}`);
      removeItem(itemId);
      setEnteredBillTotal('');
      setRatio(null);
      setBills(null);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete item');
    }
  };

  const updateEnteredBillTotal = async (value) => {
    setEnteredBillTotal(value);

    try {
      await api.put(`/api/rooms/${sessionUser.roomCode}/entered-total`, {
        enteredBillTotal: value === '' ? null : Number(value)
      });
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to update total amount');
    }
  };

  const calculate = async () => {
    try {
      const res = await api.get(`/api/food/${sessionUser.roomCode}/calc`);
      setBills(res.data.bills);
      setRatio(res.data.ratio);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to calculate');
    }
  };

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
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Food Item
          </button>
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
                <th className="th"></th>
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
                  <td className="td">
                    <button
                      type="button"
                      onClick={() => deleteFood(it._id)}
                      className="text-red-600 hover:text-red-800 text-lg"
                      title="Delete food item"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="td" colSpan={7}>
                    No items yet. Click "Add Food Item" to get started.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="td" colSpan={2}>Total Bill</td>
                <td className="td">{totalFoodPrice.toFixed(2)}</td>
                <td className="td" colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button className="btn btn-outline mt-4" onClick={calculate}>
          Calculate Group Bill
        </button>

        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800">
            Incorporate proportional taxes, service charges, and tips
          </h4>

          <div className="mt-3">
            <label className="label">
              Enter the total amount on your bill (including all extra charges)
            </label>
            <input
              className="input mt-2 max-w-sm"
              type="number"
              min="0"
              step="0.01"
              value={enteredBillTotal}
              onChange={(e) => updateEnteredBillTotal(e.target.value)}
            />
          </div>

          {enteredBillTotal !== '' && (
            <div className="mt-3 text-sm text-gray-700">
              This amount is shared across the room and can be changed by anyone.
            </div>
          )}

          {ratio !== null && (
            <div className="mt-3 text-sm font-medium text-sky-700">
              Proportional ratio applied: {ratio.toFixed(6)}
            </div>
          )}
        </div>
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