import type { ComponentType } from 'react';
import { Search, LayoutGrid, Tag, Code2, MessageSquare, Check, Loader2 } from 'lucide-react';
import type { AgentStatus } from '../types/agents';

interface Agent {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
}

const agents: Agent[] = [
  { id: 'research', name: 'Research Agent', icon: Search },
  { id: 'strategy', name: 'Strategy Agent', icon: LayoutGrid },
  { id: 'content', name: 'Content Agent', icon: Tag },
  { id: 'development', name: 'Development Agent', icon: Code2 },
  { id: 'pitch', name: 'Pitch Agent', icon: MessageSquare },
];

const pipeline = [
  { num: 1, id: 'research', name: 'Research' },
  { num: 2, id: 'strategy', name: 'Strategy' },
  { num: 3, id: 'content', name: 'Content', parallel: true },
  { num: 4, id: 'development', name: 'Development', parallel: true },
  { num: 5, id: 'pitch', name: 'Pitch', parallel: true },
];

interface SidebarProps {
  activeTab: 'playground' | 'orchestrator';
  selectedAgent: string;
  onSelectAgent: (id: string) => void;
  agentStatuses?: Record<string, AgentStatus>;
}

export default function Sidebar({ activeTab, selectedAgent, onSelectAgent, agentStatuses }: SidebarProps) {
  return (
    <aside className="w-56 h-screen flex flex-col border-r border-slate-100 bg-white shrink-0 overflow-hidden relative z-20">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 whitespace-nowrap">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          AI Workforce
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {activeTab === 'orchestrator' ? 'Orchestrator manages all agents' : 'Select an agent'}
        </p>
      </div>

      {/* Agent List */}
      <div className="px-3 space-y-1 flex-1 mt-2">
        {agents.map((agent) => {
          const isSelected = activeTab === 'playground' && selectedAgent === agent.id;
          const status = agentStatuses?.[agent.id] || 'idle';
          const Icon = agent.icon;
          
          let statusText = 'Ready';
          let statusDot = 'bg-green-500';
          
          if (status === 'completed') {
            statusText = 'Complete';
            statusDot = 'bg-green-500';
          } else if (status === 'running') {
            statusText = 'Working';
            statusDot = 'bg-primary';
          } else if (status === 'failed') {
            statusText = 'Error';
            statusDot = 'bg-red-500';
          }

          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-primary-400'}`} />
              <div className="min-w-0 whitespace-nowrap">
                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                  {agent.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {status === 'running' ? (
                     <Loader2 className={`w-2.5 h-2.5 animate-spin ${isSelected ? 'text-blue-100' : 'text-primary'}`} />
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected && status === 'completed' ? 'bg-green-300' : statusDot}`} />
                  )}
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Workflow Pipeline */}
        <div className="pt-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 mb-3 whitespace-nowrap">
            Workflow Pipeline
          </p>
          <div className="space-y-3 px-3">
            {pipeline.map((step, i) => {
              const status = agentStatuses?.[step.id] || 'idle';
              const isCompleted = status === 'completed';
              
              return (
                <div key={step.num}>
                  {step.parallel && i === 2 && (
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.15em] mb-2 mt-3 pl-1 whitespace-nowrap">
                      Parallel
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-5 flex justify-center shrink-0">
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-green-500 stroke-[3]" />
                      ) : status === 'running' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">{step.num}</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium whitespace-nowrap ${isCompleted ? 'text-green-600' : status === 'running' ? 'text-primary font-semibold' : 'text-slate-500'}`}>
                      {step.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-white">C</span>
          </div>
          <div>
            <p className="text-xs font-bold text-dark tracking-wide">COMET AGENT</p>
            <p className="text-[10px] text-slate-400">v2.0 • Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
