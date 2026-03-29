import { useState, useEffect } from 'react';
import Home from '@/pages/Home';
import OffByOneVideo from '@/episodes/ep1-off-by-one/VideoTemplate';
import SegWitVideo from '@/episodes/ep2-segwit/VideoTemplate';
import SHA256Video from '@/episodes/ep3-sha256/VideoTemplate';
import GarbledCircuitsVideo from '@/episodes/ep4-garbled-circuits/VideoTemplate';
import SixtyFourByteVideo from '@/episodes/ep5-64byte-tx/VideoTemplate';
import DuplicateTxidVideo from '@/episodes/ep6-duplicate-txid/VideoTemplate';
import OverwriteVideo from '@/episodes/ep7-duplicate-tx-bip54/VideoTemplate';
import KeccakVideo from '@/episodes/ep8-keccak-sha3/VideoTemplate';
import WorstCaseBlockVideo from '@/episodes/ep9-worst-case-block/VideoTemplate';
import BIP54OverviewVideo from '@/episodes/ep10-bip54-overview/VideoTemplate';


const ROUTES: Record<string, () => React.ReactNode> = {
  ep1: () => <OffByOneVideo />,
  ep2: () => <SegWitVideo />,
  ep3: () => <SHA256Video />,
  ep4: () => <GarbledCircuitsVideo />,
  ep5: () => <SixtyFourByteVideo />,
  ep6: () => <DuplicateTxidVideo />,
  ep7: () => <OverwriteVideo />,
  ep8: () => <KeccakVideo />,
  ep9: () => <WorstCaseBlockVideo />,
  ep10: () => <BIP54OverviewVideo />,
};

function getRoute() {
  return window.location.hash.replace('#', '').split('?')[0] || '';
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderVideo = ROUTES[route];
  const isRecording = window.location.hash.includes('record');

  if (!renderVideo) {
    return <Home />;
  }

  return (
    <div className="relative">
      {!isRecording && (
        <a
          href="#"
          className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </a>
      )}
      {renderVideo()}
    </div>
  );
}
