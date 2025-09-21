import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import CreateRoom from './pages/CreateRoom.jsx';
import JoinRoom from './pages/JoinRoom.jsx';
import Portal from './pages/Portal.jsx';


const router = createBrowserRouter([
{ path: '/', element: <App />, children: [
{ index: true, element: <Home /> },
{ path: 'create', element: <CreateRoom /> },
{ path: 'join', element: <JoinRoom /> },
{ path: 'portal', element: <Portal /> },
]}
]);


ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<RouterProvider router={router} />
</React.StrictMode>
);