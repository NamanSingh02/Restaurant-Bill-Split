import { useEffect, useMemo, useState } from 'react';

export default function AddFoodModal({ groups, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selected, setSelected] = useState([]); // groupNumber[]
  // Store percentages as strings so blanks stay blank in the UI
  const [percentages, setPercentages] = useState({}); // { [groupNumber]: string }

  // When selection changes, assign equal split by default (as strings)
  useEffect(() => {
    if (selected.length) {
      const eq = Math.floor(100 / selected.length);
      const rem = 100 - eq * selected.length;
      const next = {};
      selected.forEach((gnum, i) => {
        const val = i === 0 ? eq + rem : eq;
        next[gnum] = String(val);
      });
      setPercentages(next);
    } else {
      setPercentages({});
    }
  }, [selected]);

  // Compute total as numbers, treating blanks as 0
  const total = useMemo(
    () =>
      Object.values(percentages).reduce(
        (a, v) => a + (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0),
        0
      ),
    [percentages]
  );

  const toggle = (gnum) => {
    setSelected((prev) =>
      prev.includes(gnum) ? prev.filter((x) => x !== gnum) : [...prev, gnum]
    );
  };

  const submit = () => {
    if (!name.trim()) return alert('Enter food item name');
    const p = Number(price);
    if (isNaN(p) || p < 0) return alert('Enter a valid price');
    if (!selected.length) return alert('Select at least one group');
    if (Math.round(total) !== 100) return alert('Percentages must sum to 100');

    const groupNumbers = selected;
    // Convert to numbers for submission; blank -> 0
    const pct = groupNumbers.map((g) => {
      const raw = percentages[g];
      const num = parseFloat(raw);
      return Number.isFinite(num) ? num : 0;
    });

    onSubmit({
      name: name.trim(),
      price: p,
      groupNumbers,
      percentages: pct,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        <div className="flex items-center justify-between">
          <h3 className="h1">Add Food Item</h3>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label">What is the name of the food item?</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Price</label>
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Select the groups who have shared it</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {groups.map((g) => (
              <label
                key={g.number}
                className={`cursor-pointer px-3 py-2 rounded-xl border ${
                  selected.includes(g.number)
                    ? 'bg-sky-50 border-sky-400'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selected.includes(g.number)}
                  onChange={() => toggle(g.number)}
                />
                Group {g.number}: {g.name}
              </label>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="mt-4">
            <label className="label">
              Enter the Share Percentages (must sum to 100) of each group
            </label>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              {selected.map((gnum) => (
                <div key={gnum} className="flex items-center gap-2">
                  <div className="w-40 text-sm">
                    Group {gnum}: {groups.find((g) => g.number === gnum)?.name}
                  </div>
                  <input
                    className="input no-spin"
                    type="number"
                    // Keep blank if user clears the field
                    value={percentages[gnum] ?? ''}
                    onChange={(e) =>
                      setPercentages((prev) => ({
                        ...prev,
                        [gnum]: e.target.value, // store raw string ('' allowed)
                      }))
                    }
                  />
                  <span>%</span>
                </div>
              ))}
            </div>
            <div
              className={`mt-2 text-sm ${
                Math.round(total) === 100 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Total: {Number.isFinite(total) ? total : 0}%
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
