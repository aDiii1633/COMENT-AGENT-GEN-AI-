import type { ComponentType } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutGrid, Tag, Code2, MessageSquare, Send, ArrowRight, Loader2 } from 'lucide-react';
import { generateAgentResponse } from '../utils/llm';

interface AgentData {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  capabilities: string[];
  prompts: string[];
  color: string;
  bg: string;
}

const agentMap: Record<string, AgentData> = {
  research: {
    id: 'research',
    name: 'Research Agent',
    icon: Search,
    description: 'Dedicated workspace for specialized AI tasks.',
    capabilities: ['Competitor Analysis', 'Market Research', 'Industry Trends', 'Audience Research'],
    prompts: ['Analyze my competitors', 'Find market opportunities', 'Research industry trends'],
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
  strategy: {
    id: 'strategy',
    name: 'Strategy Agent',
    icon: LayoutGrid,
    description: 'Build strategic frameworks and business models.',
    capabilities: ['Business Model Canvas', 'Pricing Strategy', 'Go-to-Market Plan', 'SWOT Analysis'],
    prompts: ['Create a pricing model', 'Draft a GTM strategy', 'Build a lean canvas'],
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  content: {
    id: 'content',
    name: 'Content Agent',
    icon: Tag,
    description: 'Generate marketing and brand content.',
    capabilities: ['Copywriting', 'Social Media Posts', 'Blog Content', 'Email Campaigns'],
    prompts: ['Write landing page copy', 'Create social media posts', 'Draft email sequences'],
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  development: {
    id: 'development',
    name: 'Development Agent',
    icon: Code2,
    description: 'Architecture planning and code generation.',
    capabilities: ['Tech Stack Selection', 'Database Schema', 'API Design', 'Code Generation'],
    prompts: ['Design the database schema', 'Plan the API architecture', 'Generate boilerplate code'],
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  pitch: {
    id: 'pitch',
    name: 'Pitch Agent',
    icon: MessageSquare,
    description: 'Create investor-ready pitch materials.',
    capabilities: ['Pitch Deck', 'Elevator Pitch', 'Financial Projections', 'Investor Brief'],
    prompts: ['Build a pitch deck', 'Write an elevator pitch', 'Create financial projections'],
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
};

interface Props {
  selectedAgent: string;
}

export default function AgentPlayground({ selectedAgent }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const agent = agentMap[selectedAgent] || agentMap.research;
  const Icon = agent.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const result = await generateAgentResponse(agent.id, userMsg);
      const data = result.data as Record<string, unknown>;
      // Extract a readable summary from the structured output
      const summary = (data?.executiveSummary as string) || (data?.projectOverview as string) || JSON.stringify(data, null, 2);
      const prefix = result.success ? '' : '⚠️ (Sample data) ';
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text: `${prefix}${summary}` },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text: 'Sorry, there was an error communicating with the agent.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-8">
        <motion.div
          key={selectedAgent}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          {/* Agent Header Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl ${agent.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-7 h-7 ${agent.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark">{agent.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{agent.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Capabilities */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">
                  Capabilities
                </p>
                <ul className="space-y-2.5">
                  {agent.capabilities.map((cap) => (
                    <li key={cap} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Prompts */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">
                  Suggested Prompts
                </p>
                <ul className="space-y-2.5">
                  {agent.prompts.map((prompt) => (
                    <li
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary-700 cursor-pointer transition-colors group"
                    >
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      {prompt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Messages */}
          {messages.length > 0 ? (
            <div className="space-y-4 mb-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] rounded-2xl px-5 py-3 text-sm bg-white border border-slate-100 text-slate-400 rounded-bl-md shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>{agent.name} is thinking...</span>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Workspace Status */
            <div className="text-center py-8">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-sm font-medium text-slate-500">{agent.name} is generating...</span>
                </div>
              ) : (
                <span className="text-sm font-medium text-primary">Workspace Initialized</span>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Sticky Chat Input */}
      <div className="shrink-0 px-8 pb-6 pt-3 bg-gradient-to-t from-slate-50/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className={`flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-2 shadow-sm focus-within:border-primary-200 focus-within:shadow-md focus-within:shadow-primary/5 transition-all ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={loading ? 'Please wait for response...' : `Ask ${agent.name} to do something...`}
              className="flex-1 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-700 transition-colors shrink-0 shadow-sm shadow-primary/20 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
