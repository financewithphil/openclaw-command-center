import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ClientDetail from './components/ClientDetail';
import AddClientModal from './components/AddClientModal';

export default function App() {
  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onAddClient={() => setShowAddClient(true)} />
      <ClientDetail />
      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} />}
    </div>
  );
}
