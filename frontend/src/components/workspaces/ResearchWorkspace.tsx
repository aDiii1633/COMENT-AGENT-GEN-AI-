import { Lightbulb, Activity, Target, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ResearchOutput } from '../../types/agents';

interface ResearchWorkspaceProps {
  data: Record<string, unknown>;
}

export default function ResearchWorkspace({ data }: ResearchWorkspaceProps) {
  const output = data as unknown as ResearchOutput;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Executive Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Executive Summary
        </h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg leading-relaxed text-slate-700">
            {output.executiveSummary || "Market research analysis completed."}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Market Potential */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-sky-600 font-semibold">
            <Activity className="w-5 h-5" />
            Market Potential
          </div>
          <p className="text-sm text-slate-600 leading-relaxed flex-1">
            {output.marketPotential || "Demand remains robust across all segments."}
          </p>
        </div>

        {/* Competition */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-purple-600 font-semibold">
            <Target className="w-5 h-5" />
            Competition
          </div>
          <div className="flex-1 flex items-center">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
              output.competitionLevel === 'High' ? 'bg-red-50 text-red-600' :
              output.competitionLevel === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
              'bg-green-50 text-green-600'
            }`}>
              {output.competitionLevel || 'High'}
            </span>
          </div>
        </div>

        {/* Opportunity Score */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 font-semibold">
            <TrendingUp className="w-5 h-5" />
            Opportunity Score
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-slate-900">{output.opportunityScore || 68}</span>
              <span className="text-sm font-medium text-slate-400">/100</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${output.opportunityScore || 68}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Market Size & Competitors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Market Size Analysis (Placeholder Donut) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Market Size Analysis</h3>
          <div className="aspect-square max-w-[280px] mx-auto relative flex items-center justify-center">
             <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
               <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
               <circle 
                 cx="50" cy="50" r="40" fill="transparent" stroke="#0ea5e9" 
                 strokeWidth="16" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.3} 
               />
               <circle 
                 cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" 
                 strokeWidth="16" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.85} 
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
               <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Addressable</span>
               <span className="text-2xl font-bold text-slate-900">$4.2B</span>
             </div>
          </div>
        </div>

        {/* Top Competitors Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Competitors</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Strength</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {output.topCompetitors?.map((comp, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-4 pr-4 font-semibold text-slate-900 align-top">
                      {comp.company}
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600 align-top">
                      {comp.strength}
                    </td>
                    <td className="py-4 text-sm text-sky-600 font-medium align-top">
                      {comp.position}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* NEW SECTION: Deep Research Data */}
      {(output.marketTrends || output.targetDemographics || output.keyRisks) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Trends */}
          {output.marketTrends && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Key Market Trends
              </h3>
              <ul className="space-y-3">
                {output.marketTrends.map((trend, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">•</span>
                    <span>{trend}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Demographics */}
          {output.targetDemographics && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-500" /> Target Demographics
              </h3>
              <ul className="space-y-3">
                {output.targetDemographics.map((demo, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-pink-400 mt-1">•</span>
                    <span>{demo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {output.keyRisks && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" /> Risk Analysis
              </h3>
              <ul className="space-y-3">
                {output.keyRisks.map((risk, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* NEW SECTION: Deep Dive Report */}
      {output.detailedReport && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-8">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            <h3 className="text-2xl font-bold text-slate-900">Comprehensive Research Report</h3>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
            <ReactMarkdown>{output.detailedReport}</ReactMarkdown>
          </div>
        </div>
      )}

    </div>
  );
}
