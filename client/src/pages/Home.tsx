import { motion } from 'framer-motion';

// Episodes currently in the working tree. Updated by the pipeline during build
// and cleaned by archive-episode.sh when done.
const EPISODES: {
  id: string;
  number: number;
  title: string;
  description: string;
  scenes: number;
  duration: string;
  status: 'published' | 'draft';
}[] = [
  // New episodes are added here by the build phase of auto-episode.sh.
  // After recording, archive-episode.sh removes the entry.
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-light">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary">
              Bitcoin Explainers
            </h1>
            <p className="mt-3 text-lg text-text-muted">
              Visual explainers that break down how Bitcoin works.
            </p>
          </div>

          {EPISODES.length === 0 ? (
            <div className="rounded-xl border border-text-primary/10 bg-white/50 p-12 text-center">
              <p className="text-text-muted">
                No episodes in the working tree. Run <code className="rounded bg-text-primary/5 px-1.5 py-0.5 font-mono text-sm">auto-episode.sh</code> to generate one.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {EPISODES.map((ep, i) => (
                <motion.a
                  key={ep.id}
                  href={`#${ep.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  className="group flex gap-5 rounded-xl border border-text-primary/10 bg-white/50 p-5 transition-all hover:border-primary/40 hover:bg-white/80 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-lg font-bold text-primary">
                    {ep.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {ep.title}
                      </h2>
                      {ep.status === 'draft' && (
                        <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-xs font-medium text-text-muted">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">
                      {ep.description}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-text-muted/70 font-mono">
                      <span>{ep.scenes} scenes</span>
                      <span>{ep.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-text-muted/40 group-hover:text-primary transition-colors">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
