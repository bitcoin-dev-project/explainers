import { useState, useEffect } from 'react';
import Home from '@/pages/Home';
import OffByOneVideo from '@/episodes/ep1-off-by-one/VideoTemplate';
import SegWitVideo from '@/episodes/ep2-segwit/VideoTemplate';
import SHA256Video from '@/episodes/ep3-sha256/VideoTemplate';

const ROUTES: Record<string, () => React.ReactNode> = {
  ep1: () => <OffByOneVideo />,
  ep2: () => <SegWitVideo />,
  ep3: () => <SHA256Video />,
};

function getRoute() {
  return window.location.hash.replace('#', '') || '';
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderVideo = ROUTES[route];

  if (!renderVideo) {
    return <Home />;
  }

  return (
    <div className="relative">
      <a
        href="#"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </a>
      {renderVideo()}
    </div>
  );
}
