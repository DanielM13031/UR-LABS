import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Login from './components/auth/Login';
import Home from './components/dashboard/Home.js';
import './App.css';

function App() {
  return (
  <Router>
    <Routes>
      <Route path='/' element={<Navigate to ='/login'/>}/>
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  </Router>
  );
}

export default App;
