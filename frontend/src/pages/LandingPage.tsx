import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, Search, LayoutGrid, Tag, Code2, MessageSquare } from 'lucide-react';

const agents = [
  { name: 'Research', icon: Search, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100' },
  { name: 'Strategy', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  { name: 'Content', icon: Tag, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  { name: 'Development', icon: Code2, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100' },
  { name: 'Pitch', icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
];
const agentWords = [
  'Research Agent',
  'Strategy Agent',
  'Content Agent',
  'Development Agent',
  'Pitch Agent'
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % agentWords.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-dark">Comet Agent</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm text-slate-600 hover:text-dark transition-colors font-medium">Sign In</button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-dark text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors"
          >
            Start Building
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-4 pt-20 pb-16 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary-50 border border-primary-100 rounded-full mb-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Next-Gen Business Creation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.15] mb-8 tracking-tight">
            Your AI Workforce for
            <br />
            <span className="relative inline-block w-full h-[1.2em] overflow-hidden mt-2">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={index}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                  }}
                  className="absolute inset-0 w-full flex justify-center"
                >
                  {agentWords[index].split('').map((char, i) => (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { opacity: 0, filter: 'blur(10px)', y: 20, scale: 0.95 },
                        visible: { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 },
                        exit: { opacity: 0, filter: 'blur(10px)', y: -20, scale: 1 },
                      }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="inline-block whitespace-pre premium-gradient-text"
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              </AnimatePresence>
            </span>
          </h1>

          <p className="text-slate-500 text-base leading-relaxed mb-2 max-w-xl mx-auto">
            <span className="font-semibold text-dark">Problem:</span>{' '}
            Creators, founders, and indie hackers switch between multiple tools
            for research, strategy, content, development, and pitching.
          </p>
          <p className="text-slate-500 text-base leading-relaxed mb-12 max-w-xl mx-auto">
            <span className="font-semibold text-primary">Solution:</span>{' '}
            Comet Agent unifies everything through specialized AI agents and
            powerful orchestration.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-700 transition-all shadow-lg shadow-primary/25 text-sm"
            >
              Start Building <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-200 text-slate-700 font-semibold rounded-full hover:bg-slate-50 transition-all text-sm"
            >
              <Layers className="w-4 h-4 text-slate-400" /> Explore Agents
            </button>
          </div>
        </motion.div>
      </section>

      {/* Agent Pipeline */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-50/80 rounded-2xl border border-slate-100 p-8"
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">
            The Unified Agent Pipeline
          </p>
          <div className="grid grid-cols-5 gap-4">
            {agents.map((agent) => (
              <motion.div
                key={agent.name}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl border border-slate-100 hover:shadow-lg hover:shadow-slate-100 transition-shadow cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl ${agent.bg} ${agent.border} border flex items-center justify-center`}>
                  <agent.icon className={`w-5 h-5 ${agent.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">{agent.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
