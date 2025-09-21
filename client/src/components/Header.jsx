import { useNavigate, useLocation } from 'react-router-dom';
import { clearSession, getUser } from '../utils/auth.js';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const onHome = location.pathname === '/';
  const showSessionBadges = !!user && !onHome;  // hide badges on Home
  const showLeave = !!user && !onHome;          // hide button on Home

  return (
    <header className="navbar">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <h1 className="font-bold text-lg md:text-xl text-gray-800">
          Welcome to <span className="text-sky-600">Restaurant Bill Split</span> by Naman Singh
        </h1>
        <div className="flex items-center gap-3">
          {showSessionBadges && (
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <span className="badge">{user.name}</span>
              <span className="badge">{user.groupName}</span>
              <span className="badge">Room {user.roomCode}</span>
            </div>
          )}
          {showLeave && (
            <button
              className="btn btn-outline"
              onClick={() => {
                clearSession();
                navigate('/');
              }}
            >
              Leave Page
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
