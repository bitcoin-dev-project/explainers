import { useState, useEffect } from 'react';
import Home from '@/pages/Home';
import OffByOneVideo from '@/episodes/ep1-off-by-one/VideoTemplate';
import SegWitVideo from '@/episodes/ep2-segwit/VideoTemplate';
import SHA256Video from '@/episodes/ep3-sha256/VideoTemplate';
import GarbledCircuitsVideo from '@/episodes/ep4-garbled-circuits/VideoTemplate';
import SixtyFourByteVideo from '@/episodes/ep5-64byte-tx/VideoTemplate';
import DuplicateTxidVideo from '@/episodes/ep6-duplicate-txid/VideoTemplate';
import OverwriteVideo from '@/episodes/ep7-duplicate-tx-bip54/VideoTemplate';
import BIP54CleanupVideo from '@/episodes/ep7-bip54/VideoTemplate';
import KeccakVideo from '@/episodes/ep8-keccak-sha3/VideoTemplate';
import WorstCaseBlockVideo from '@/episodes/ep9-worst-case-block/VideoTemplate';
import BIP54OverviewVideo from '@/episodes/ep10-bip54-overview/VideoTemplate';
import QuantumThreatVideo from '@/episodes/ep7-quantum-threat/VideoTemplate';
import WorstCaseValidationVideo from '@/episodes/ep111-worst-case-validation/VideoTemplate';
import CoinbaseUniquenessVideo from '@/episodes/ep112-coinbase-uniqueness/VideoTemplate';
import QuantumVsBitcoinVideo from '@/episodes/ep133-quantum-vs-bitcoin/VideoTemplate';
import CharacterDemo from '@/pages/CharacterDemo';

declare global {
  interface Window {
    __recordingHarness?: {
      start: (scene?: number) => void;
    };
    __recordingStartScene?: number;
  }
}

const ROUTES: Record<string, () => React.ReactNode> = {
  ep1: () => <OffByOneVideo />,
  ep2: () => <SegWitVideo />,
  ep3: () => <SHA256Video />,
  ep4: () => <GarbledCircuitsVideo />,
  ep5: () => <SixtyFourByteVideo />,
  ep6: () => <DuplicateTxidVideo />,
  ep7: () => <BIP54CleanupVideo />,
  ep7b: () => <OverwriteVideo />,
  'ep7-overwrite': () => <OverwriteVideo />,
  ep8: () => <KeccakVideo />,
  ep9: () => <WorstCaseBlockVideo />,
  ep10: () => <BIP54OverviewVideo />,
  ep11: () => <QuantumThreatVideo />,
  'ep7-quantum': () => <QuantumThreatVideo />,
  ep12: () => <WorstCaseValidationVideo />,
  ep111: () => <WorstCaseValidationVideo />,
  ep13: () => <CoinbaseUniquenessVideo />,
  ep112: () => <CoinbaseUniquenessVideo />,
  ep14: () => <QuantumVsBitcoinVideo />,
  ep133: () => <QuantumVsBitcoinVideo />,
  characters: () => <CharacterDemo />,
};

function getRoute() {
  return window.location.hash.replace('#', '').split('?')[0] || '';
}

function getHashParams() {
  return new URLSearchParams(window.location.hash.split('?')[1] || '');
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [recordShouldRender, setRecordShouldRender] = useState(() => !getHashParams().has('arm'));
  const [recordMountVersion, setRecordMountVersion] = useState(0);

  useEffect(() => {
    const syncFromHash = () => {
      setRoute(getRoute());

      const params = getHashParams();
      const isRecording = params.has('record');
      const isArmed = params.has('arm');

      if (!isRecording || !isArmed) {
        setRecordShouldRender(true);
        delete window.__recordingHarness;
        delete window.__recordingStartScene;
        return;
      }

      setRecordShouldRender(false);
      window.__recordingHarness = {
        start: (scene = 0) => {
          window.__recordingStartScene = scene;
          setRecordMountVersion(v => v + 1);
          setRecordShouldRender(true);
        },
      };
    };

    syncFromHash();
    const onHashChange = () => syncFromHash();
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      delete window.__recordingHarness;
      delete window.__recordingStartScene;
    };
  }, []);

  const renderVideo = ROUTES[route];
  const hashParams = getHashParams();
  const isRecording = hashParams.has('record');
  const isArmedRecording = isRecording && hashParams.has('arm');

  if (!renderVideo) {
    return <Home />;
  }

  if (isArmedRecording && !recordShouldRender) {
    return <div className="h-screen w-full bg-black" data-record-ready="false" />;
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
      <div key={isArmedRecording ? `${route}:${recordMountVersion}` : route}>
        {renderVideo()}
      </div>
    </div>
  );
}
