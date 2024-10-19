import react from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Login from './components/auth/Login.js';
import Home from './components/dashboard/Home.js';
import ProtectedRoute from './components/auth/ProtectedRoute.js' 
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
    </Routes>
  </Router>
  );
}

export default App;
