import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TrafficAccident from './pages/TrafficAccident';
import Diet from './pages/Diet';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/traffic-accident" element={<TrafficAccident />} />
        <Route path="/diet" element={<Diet />} />
      </Routes>
    </BrowserRouter>
  );
}
