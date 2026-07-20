import { Routes, Route } from 'react-router-dom';
import CreateCard from './pages/CreateCard';
import NightPage from './pages/NightPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateCard />} />
      <Route path="/night/:code" element={<NightPage />} />
    </Routes>
  );
}
