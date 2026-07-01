import type { ComponentType } from 'react';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Play, Search, LayoutGrid, Tag, Code2, MessageSquare,
  Check, Loader2, RefreshCw, AlertTriangle, Eye, ChevronRight,
} from 'lucide-react';
import { generateAgentResponse } from '../utils/llm';
import type { AgentResult, AgentStatus } from '../types/agents';
import WorkspaceModal from './workspaces/WorkspaceModal';

// ─── Agent Definitions ──────────────────────────────────────

interface AgentCard {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  gradient: string;
}

const agents: AgentCard[] = [
  { id: 'research', name: 'Research Agent', icon: Search, color: 'text-sky-500', bg: 'bg-sky-50', gradient: 'from-sky-500 to-blue-600' },
  { id: 'strategy', name: 'Strategy Agent', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'content', name: 'Content Agent', icon: Tag, color: 'text-rose-500', bg: 'bg-rose-50', gradient: 'from-rose-500 to-pink-600' },
  { id: 'development', name: 'Development Agent', icon: Code2, color: 'text-emerald-500', bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'pitch', name: 'Pitch Agent', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', gradient: 'from-purple-500 to-violet-600' },
];

// ─── Status Labels ──────────────────────────────────────────

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Awaiting',
  queued: 'Queued',
  running: 'Generating...',
  completed: 'Output Ready',
  failed: 'Failed',
};

// ─── Component ──────────────────────────────────────────────

interface BusinessOrchestratorProps {
  externalAgentStatuses?: Record<string, AgentStatus>;
  setExternalAgentStatuses?: React.Dispatch<React.SetStateAction<Record<string, AgentStatus>>>;
}

export type { AgentStatus };

export default function BusinessOrchestrator({
  externalAgentStatuses,
  setExternalAgentStatuses,
}: BusinessOrchestratorProps) {
  const [goal, setGoal] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(agents.map(a => a.id)));
  const [orchestratorStatus, setOrchestratorStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const [localAgentStatuses, setLocalAgentStatuses] = useState<Record<string, AgentStatus>>(
    agents.reduce((acc, a) => ({ ...acc, [a.id]: 'idle' as AgentStatus }), {} as Record<string, AgentStatus>)
  );

  const agentStatuses = externalAgentStatuses || localAgentStatuses;
  const setAgentStatuses = setExternalAgentStatuses || setLocalAgentStatuses;

  // Output cache — survives re-renders, reopens are instant
  const outputCache = useRef<Record<string, AgentResult<unknown>>>({});
  const [agentOutputs, setAgentOutputs] = useState<Record<string, AgentResult<unknown>>>({});
  const [activeViewOutput, setActiveViewOutput] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const toggleAgent = (id: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedAgents(new Set(agents.map(a => a.id)));
  const selectNone = () => setSelectedAgents(new Set());

  // ─── Run Single Agent ──────────────────────────────────────

  const runSingleAgent = useCallback(async (agentId: string, goalText: string, context?: string) => {
    setAgentStatuses(prev => ({ ...prev, [agentId]: 'running' }));
    setErrorMessages(prev => { const next = { ...prev }; delete next[agentId]; return next; });

    try {
      const prompt = `Generate comprehensive business deliverables for: "${goalText}"`;
      const result = await generateAgentResponse(agentId, prompt, context);

      // Store in cache + state
      outputCache.current[agentId] = result;
      setAgentOutputs(prev => ({ ...prev, [agentId]: result }));

      if (result.success) {
        setAgentStatuses(prev => ({ ...prev, [agentId]: 'completed' }));
      } else {
        // Mock fallback was used — still mark as completed but note the error
        setAgentStatuses(prev => ({ ...prev, [agentId]: 'completed' }));
        setErrorMessages(prev => ({ ...prev, [agentId]: result.error || 'Using sample data' }));
      }
    } catch (error) {
      console.error(`[COMET] Fatal error for ${agentId}:`, error);
      setAgentStatuses(prev => ({ ...prev, [agentId]: 'failed' }));
      setErrorMessages(prev => ({
        ...prev,
        [agentId]: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [setAgentStatuses]);

  // ─── Run Orchestrator ──────────────────────────────────────

  const runOrchestrator = async () => {
    if (!goal.trim() || selectedAgents.size === 0 || orchestratorStatus === 'running') return;

    setOrchestratorStatus('running');
    setAgentOutputs({});
    setActiveViewOutput(null);
    setErrorMessages({});
    outputCache.current = {};

    // Set all selected to queued
    const initialStatuses = agents.reduce((acc, a) => ({
      ...acc,
      [a.id]: selectedAgents.has(a.id) ? 'queued' as AgentStatus : 'idle' as AgentStatus,
    }), {} as Record<string, AgentStatus>);
    setAgentStatuses(initialStatuses);

    const runOrder = ['research', 'strategy', 'content', 'development', 'pitch'];
    let cumulativeContext = '';

    for (const agentId of runOrder) {
      if (!selectedAgents.has(agentId)) continue;

      // Inter-agent delay to avoid rate limiting
      if (cumulativeContext) {
        await new Promise(r => setTimeout(r, 1500));
      }

      await runSingleAgent(agentId, goal, cumulativeContext || undefined);

      // Accumulate context from successful agents for downstream agents
      const output = outputCache.current[agentId];
      if (output?.success) {
        const summary = (output.data as Record<string, unknown>)?.executiveSummary || '';
        cumulativeContext += `\n\n### [${agentId.toUpperCase()} AGENT SUMMARY]\n${summary}`;
      }
    }

    setOrchestratorStatus('completed');
  };

  // ─── Retry Single Agent ────────────────────────────────────

  const retryAgent = async (agentId: string) => {
    if (!goal.trim()) return;
    await runSingleAgent(agentId, goal);
  };

  // ─── Render ────────────────────────────────────────────────

  const completedCount = agents.filter(a => agentStatuses[a.id] === 'completed').length;
  const failedCount = agents.filter(a => agentStatuses[a.id] === 'failed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl mx-auto flex flex-col gap-6 h-full"
    >
      {/* ── Goal Input Card ── */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shrink-0">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] block mb-3">
          What is your business goal?
        </label>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          disabled={orchestratorStatus === 'running'}
          placeholder="e.g., I want to launch a fitness app for busy professionals"
          rows={2}
          className="w-full p-3.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 resize-none transition-all disabled:opacity-60"
        />

        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400 font-medium">Agents:</span>
            <button onClick={selectAll} disabled={orchestratorStatus === 'running'}
              className={`text-sm font-semibold transition-all ${selectedAgents.size === agents.length ? 'text-primary' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-50`}>
              All
            </button>
            <button onClick={selectNone} disabled={orchestratorStatus === 'running'}
              className={`text-sm font-semibold transition-all ${selectedAgents.size === 0 ? 'text-primary' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-50`}>
              None
            </button>
          </div>

          <button onClick={runOrchestrator}
            disabled={!goal.trim() || selectedAgents.size === 0 || orchestratorStatus === 'running'}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white text-sm font-semibold rounded-2xl hover:bg-primary-600 transition-all shadow-md shadow-primary/20 disabled:bg-slate-300 disabled:cursor-not-allowed">
            {orchestratorStatus === 'running' ? (
              <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4.5 h-4.5" /> Generate Outputs <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>

      {/* ── Status Summary Bar ── */}
      {orchestratorStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl border border-slate-100 px-5 py-3 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-6 text-sm">
            {completedCount > 0 && (
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <Check className="w-4 h-4" /> {completedCount} completed
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <AlertTriangle className="w-4 h-4" /> {failedCount} failed
              </span>
            )}
            {orchestratorStatus === 'running' && (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <Loader2 className="w-4 h-4 animate-spin" /> In progress
              </span>
            )}
          </div>
          {orchestratorStatus === 'completed' && failedCount > 0 && (
            <button
              onClick={() => {
                agents.filter(a => agentStatuses[a.id] === 'failed').forEach(a => retryAgent(a.id));
              }}
              className="text-sm font-semibold text-primary hover:text-primary-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Failed
            </button>
          )}
        </motion.div>
      )}

      {/* ── Agent Cards Grid ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4 px-1 shrink-0">
          <h3 className="text-xl font-bold text-slate-800">Agent Output Panel</h3>
          <div className="bg-slate-100 px-3 py-1 rounded-full">
            <span className="text-xs text-slate-500 font-medium">
              {selectedAgents.size} of {agents.length} selected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 min-h-0">
          {agents.map(agent => {
            const Icon = agent.icon;
            const isSelected = selectedAgents.has(agent.id);
            const status = agentStatuses[agent.id];
            const hasOutput = !!agentOutputs[agent.id];
            const isFailed = status === 'failed';
            const errorMsg = errorMessages[agent.id];

            return (
              <motion.div
                key={agent.id}
                whileHover={{ y: -2, scale: 1.01 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`bg-white rounded-2xl border p-4 transition-all flex flex-col justify-between shadow-sm min-h-[200px] ${
                  status === 'running' ? 'ring-2 ring-primary-200 border-primary-100' :
                  isFailed ? 'border-red-200 bg-red-50/30' :
                  status === 'completed' ? 'border-green-200' :
                  'border-slate-100'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-center">
                        {status === 'running' ? (
                          <Loader2 className={`w-4 h-4 animate-spin ${agent.color}`} />
                        ) : (
                          <Icon className={`w-4 h-4 ${agent.color}`} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark leading-tight">{agent.name}</p>
                        <p className={`text-xs mt-1 font-medium ${
                          isFailed ? 'text-red-500' :
                          status === 'completed' ? 'text-green-600' :
                          status === 'running' ? 'text-primary' :
                          'text-slate-400'
                        }`}>
                          {isFailed ? '❌ ' : status === 'completed' ? '✅ ' : ''}
                          {STATUS_LABELS[status]}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      disabled={orchestratorStatus === 'running'}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : 'border-2 border-slate-200 hover:border-slate-300'
                      } disabled:opacity-50`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {isFailed && errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                      >
                        <p className="text-xs text-red-600 font-medium">Unable to generate output.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mock data warning */}
                  {hasOutput && errorMsg && !isFailed && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-amber-600 font-medium">⚠ Sample data shown</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5">
                  {/* View Output */}
                  <button
                    onClick={() => setActiveViewOutput(agent.id)}
                    disabled={!hasOutput}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-50 text-sm font-semibold text-primary rounded-xl transition-all border border-primary-100 disabled:opacity-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" /> View Output <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-2">
                    {/* Retry / Regen */}
                    <button
                      onClick={() => retryAgent(agent.id)}
                      disabled={!goal.trim() || status === 'running' || orchestratorStatus === 'running'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl transition-all border ${
                        isFailed
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isFailed ? (
                        <><RefreshCw className="w-3 h-3" /> Retry</>
                      ) : (
                        <><Play className="w-3 h-3" /> Regen</>
                      )}
                    </button>

                    {/* Export */}
                    <button
                      disabled={!hasOutput}
                      onClick={() => {
                        const output = agentOutputs[agent.id];
                        if (!output?.data) return;
                        const blob = new Blob([JSON.stringify(output.data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${agent.id}_output.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white text-xs font-medium text-slate-600 rounded-xl transition-all border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ↓ Export
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Workspace Modal ── */}
        <WorkspaceModal
          isOpen={!!activeViewOutput}
          onClose={() => setActiveViewOutput(null)}
          agentId={activeViewOutput}
          agentName={agents.find(a => a.id === activeViewOutput)?.name || ''}
          agentColor={agents.find(a => a.id === activeViewOutput)?.color || ''}
          agentBg={agents.find(a => a.id === activeViewOutput)?.bg || ''}
          agentGradient={agents.find(a => a.id === activeViewOutput)?.gradient || ''}
          result={activeViewOutput ? agentOutputs[activeViewOutput] : undefined}
        />
      </div>
    </motion.div>
  );
}
