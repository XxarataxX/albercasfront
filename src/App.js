import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './routes/Dashboard';
import PoolScreen from './routes/PoolScreen';
import PoolScreenView from './routes/PoolScreenView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pantalla/:poolId" element={<PoolScreen />} />
        <Route path="/pantallaView/:poolId" element={<PoolScreenView/>} />
      </Routes>
    </Router>
  );
}