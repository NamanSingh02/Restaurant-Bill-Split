import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="grid md:grid-cols-2 gap-6 mt-8">
      <div className="card">
        <h2 className="h1">Start a new room</h2>
        <p className="text-gray-600 mt-2">Create a room, name the groups, and invite others using the 5-digit code.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/create')}>Create Room</button>
      </div>

      <div className="card">
        <h2 className="h1">Join an existing room</h2>
        <p className="text-gray-600 mt-2">Enter a room code to join your group and collaborate live.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/join')}>Join Room</button>
      </div>

      {/* Helper text card */}
      <div className="card md:col-span-2">
        <div className="font-bold text-gray-800">What is the meaning of Groups?</div>
        <div className="text-gray-700 mt-2 space-y-1">
          <p>A Group can be a family or an individual.</p>
          <p>example 1: If 2 families go out for dinner, the number of groups is 2.</p>
          <p>example 2: If 3 friends go out for dinner, the number of groups is 3.</p>
          <p className="mt-2">Basically the website calculates each group's share of the bill.</p>
        </div>
      </div>
    </div>
  );
}
