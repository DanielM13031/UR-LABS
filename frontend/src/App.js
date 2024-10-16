import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import login from './components/auth/login.js';
import home from './components/dashboard/home.js';
import './App.css';

function App() {
  return (
  <Router>
    <Routes>
      <Route path="/login" element={<login />} />
      <Route path="/home" element={<home />} />
    </Routes>
  </Router>
  );
}

export default App;
