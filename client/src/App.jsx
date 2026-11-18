import { useState } from 'react';
import TabBar from './components/TabBar.jsx';
import Home from './pages/Home.jsx';
import Discover from './pages/Discover.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <div className="app">
      <main className="screen">
        {activeTab === 'home' ? <Home /> : <Discover />}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
