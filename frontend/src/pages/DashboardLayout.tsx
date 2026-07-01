import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AgentPlayground from '../components/AgentPlayground';
import BusinessOrchestrator from '../components/BusinessOrchestrator';
import type { AgentStatus } from '../types/agents';

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'playground' | 'orchestrator'>('orchestrator');
  const [selectedAgent, setSelectedAgent] = useState('research');
  const navigate = useNavigate();

  // Lifted state from BusinessOrchestrator
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({
    research: 'idle',
    strategy: 'idle',
    content: 'idle',
    development: 'idle',
    pitch: 'idle',
  });

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        selectedAgent={selectedAgent}
        onSelectAgent={(id) => {
          setSelectedAgent(id);
          setActiveTab('playground');
        }}
        agentStatuses={agentStatuses}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-dark transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-dark leading-none tracking-wide">COMET AGENT</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">AI Workforce Platform</p>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'playground'
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Agent Playground
            </button>
            <button
              onClick={() => setActiveTab('orchestrator')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'orchestrator'
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Business Orchestrator
            </button>
          </div>
        </header>

        {/* Content Area */}
        {activeTab === 'playground' ? (
          <AgentPlayground selectedAgent={selectedAgent} />
        ) : (
          <main className="flex-1 overflow-hidden p-4 bg-slate-50/30">
            <BusinessOrchestrator 
              externalAgentStatuses={agentStatuses}
              setExternalAgentStatuses={setAgentStatuses}
            />
          </main>
        )}
      </div>
    </div>
  );
}
