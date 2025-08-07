import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Login from './components/auth/Login.js';
import Home from './components/dashboard/Home.js';
import Reservas from './components/dashboard/locker.js';
import ProtectedRoute from './components/auth/ProtectedRoute.js';
import Adminreservas from './components/dashboard/Adminreservas';
import './App.css';

function App() {
  return (
  <Router>
    <Routes>
      <Route path='/' element={<Navigate to ='/login'/>}/>

      <Route path="/login" element={<Login />} />

      <Route path="/home" element={
        <ProtectedRoute>
        <Home />
        </ProtectedRoute>
        } />

      <Route path="/reservas" element={
        <ProtectedRoute>
        <Reservas />
        </ProtectedRoute>
      } />

      <Route path="/admin/reservas" element={
        <ProtectedRoute>
          <Adminreservas />
        </ProtectedRoute>
      } />

    </Routes>
  </Router>
  );
}

export default App;
