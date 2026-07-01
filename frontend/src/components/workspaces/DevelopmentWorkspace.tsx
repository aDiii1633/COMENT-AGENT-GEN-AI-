import type { SVGProps } from 'react';
import { Code2, Download, ExternalLink, Cpu, Layers, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { DevelopmentOutput } from '../../types/agents';

interface DevelopmentWorkspaceProps {
  data: Record<string, unknown>;
}

export default function DevelopmentWorkspace({ data }: DevelopmentWorkspaceProps) {
  const output = data as unknown as DevelopmentOutput;

  const handleDownloadHtml = () => {
    if (!output.htmlPrototype) return;
    const blob = new Blob([output.htmlPrototype], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Top Banner: HTML Generator */}
      <div className="bg-sky-50 rounded-2xl border border-sky-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-sky-900 mb-2 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-sky-600" /> HTML Landing Page Generator
          </h2>
          <p className="text-sky-700 text-sm">
            {output.htmlGeneratorText || "Your HTML landing page has been generated and is ready to download."}
          </p>
        </div>
        <button 
          onClick={handleDownloadHtml}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm shrink-0"
        >
          <Download className="w-5 h-5" /> Download HTML
        </button>
      </div>

      {/* Alternative Build Options Header */}
      <div className="flex items-center gap-2 text-slate-800 font-bold text-lg pt-4">
        <Layers className="w-5 h-5 text-sky-500" /> Alternative Build Options
      </div>

      {/* Lovable & Supabase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lovable */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col hover:border-blue-300 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cpu className="w-24 h-24" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Lovable Workflow</h3>
          <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-8">
            Export these requirements directly into Lovable.dev to automatically generate a functional React frontend within minutes. Best for rapid UI prototyping.
          </p>
          <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="text-sky-600 font-bold text-sm flex items-center gap-1 hover:text-sky-700 transition-colors w-fit">
            Open Lovable <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Supabase */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col hover:border-emerald-300 transition-colors relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DatabaseIcon className="w-24 h-24" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Supabase Workflow</h3>
          <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-8">
            Use Supabase for instant Postgres database, authentication, and edge functions. Seamlessly integrates with the Lovable frontend for a complete full-stack app.
          </p>
          <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:text-emerald-700 transition-colors w-fit">
            Open Supabase <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* Bottom Grid: Architecture & Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Product Architecture */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-2xl p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Layers className="w-32 h-32 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <Layers className="w-5 h-5 text-slate-300" /> Product Architecture
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed relative z-10">
            {output.architectureDescription || "The platform architecture description goes here."}
          </p>
        </div>

        {/* Recommended Stack */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-500" /> Recommended Stack
          </h3>
          <div className="space-y-4 flex-1">
            {output.recommendedStack?.map((stack, idx) => (
              <a 
                key={idx} 
                href={stack.url || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="block group"
              >
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:border-sky-200 hover:bg-sky-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 group-hover:text-sky-700">{stack.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {stack.description}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Technical Documentation Section */}
      {(output.folderStructure || output.howToRun || output.installation || output.dependencies || output.technologyStack || output.frontendExplanation || output.backendExplanation || output.databaseExplanation || output.deploymentGuide || output.githubSetup || output.hostingOptions || output.performanceTips || output.optimizationTips || output.securitySuggestions || output.alternativeManualDevelopmentGuide) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 mt-6">
          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
            Technical Implementation Guide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {output.installation && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Installation & Setup</div>
                <pre className="text-xs text-slate-800 bg-white p-3 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">{output.installation}</pre>
              </div>
            )}

            {output.howToRun && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">How to Run</div>
                <pre className="text-xs text-slate-800 bg-white p-3 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">{output.howToRun}</pre>
              </div>
            )}

            {output.folderStructure && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Recommended Folder Structure</div>
                <pre className="text-xs text-slate-800 bg-white p-3 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">{output.folderStructure}</pre>
              </div>
            )}

            {output.dependencies && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Key Dependencies</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.dependencies}</p>
              </div>
            )}

            {output.technologyStack && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Technology Stack</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.technologyStack}</p>
              </div>
            )}

            {output.frontendExplanation && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Frontend Architecture</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.frontendExplanation}</p>
              </div>
            )}

            {output.backendExplanation && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Backend Services</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.backendExplanation}</p>
              </div>
            )}

            {output.databaseExplanation && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Database Schema & RLS Rules</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.databaseExplanation}</p>
              </div>
            )}

            {output.deploymentGuide && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Deployment Workflow</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.deploymentGuide}</p>
              </div>
            )}

            {output.githubSetup && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">GitHub CI/CD Configuration</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.githubSetup}</p>
              </div>
            )}

            {output.hostingOptions && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Hosting Options</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.hostingOptions}</p>
              </div>
            )}

            {output.performanceTips && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Performance Optimization</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.performanceTips}</p>
              </div>
            )}

            {output.optimizationTips && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">SEO & Optimization Tips</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.optimizationTips}</p>
              </div>
            )}

            {output.securitySuggestions && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Security Suggestions</div>
                <p className="text-sm text-slate-600 leading-relaxed">{output.securitySuggestions}</p>
              </div>
            )}

            {output.alternativeManualDevelopmentGuide && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Manual Alternatives Guide</div>
                <p className="text-sm text-slate-700 leading-relaxed">{output.alternativeManualDevelopmentGuide}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW SECTION: Live HTML Preview */}
      {output.htmlPrototype && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-col mt-8 h-[800px]">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" /> Live HTML Prototype Preview
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>
          <iframe 
            srcDoc={output.htmlPrototype.replace(/\\n/g, '\n')} 
            className="w-full flex-1 rounded-b-xl"
            title="Live Prototype"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {/* NEW SECTION: Deep Dive Report */}
      {output.detailedReport && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-8">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <FileCode className="w-6 h-6 text-indigo-500" />
            <h3 className="text-2xl font-bold text-slate-900">Comprehensive Development Guide</h3>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
            <ReactMarkdown>{output.detailedReport}</ReactMarkdown>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback icon for Database if it wasn't imported (using svg)
function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
