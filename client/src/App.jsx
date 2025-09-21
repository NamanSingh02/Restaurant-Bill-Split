import { Outlet, useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';


export default function App() {
return (
<div>
<Header />
<main className="max-w-5xl mx-auto p-4 md:p-6">
<Outlet />
</main>
</div>
);
}