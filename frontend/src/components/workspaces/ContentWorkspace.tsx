import { useState } from 'react';
import { 
  Camera, 
  Briefcase, 
  MessageCircle, 
  Video, 
  FileText, 
  Mail, 
  Copy,
  Hash,
  Heart,
  LayoutTemplate,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ContentOutput } from '../../types/agents';

interface ContentWorkspaceProps {
  data: Record<string, unknown>;
}

export default function ContentWorkspace({ data }: ContentWorkspaceProps) {
  const output = data as unknown as ContentOutput;
  const [activePlatform, setActivePlatform] = useState(output.platforms?.[0]?.platform || '');
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Camera className="w-4 h-4" />;
      case 'linkedin': return <Briefcase className="w-4 h-4" />;
      case 'x (twitter)':
      case 'twitter': return <MessageCircle className="w-4 h-4" />;
      case 'youtube': return <Video className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'newsletter': return <Mail className="w-4 h-4" />;
      default: return <LayoutTemplate className="w-4 h-4" />;
    }
  };

  const activeContent = output.platforms?.find(p => p.platform === activePlatform);

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6">
      
      {/* Top Navigation Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-slate-200">
        {output.platforms?.map((p) => {
          const isActive = p.platform === activePlatform;
          return (
            <button
              key={p.platform}
              onClick={() => setActivePlatform(p.platform)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                isActive 
                  ? 'bg-white text-sky-600 border-sky-200 shadow-sm ring-1 ring-sky-100' 
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {getPlatformIcon(p.platform)}
              {p.platform}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'}`}>
                {p.ideas?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeContent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
            {activeContent.ideas?.map((idea, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                    {getPlatformIcon(activeContent.platform)}
                    {activeContent.platform}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Hook */}
                  <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-100">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                      ✨ Trending Hook
                    </div>
                    <p className="text-amber-900 font-medium text-sm leading-relaxed">
                      {idea.hook}
                    </p>
                  </div>

                  {/* Caption */}
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap flex-1 mb-6">
                    {idea.caption}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mb-6">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                      <Copy className="w-3.5 h-3.5" /> Copy Caption
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                      <Hash className="w-3.5 h-3.5" /> Copy Hashtags
                    </button>
                  </div>

                  {/* Call To Action Box */}
                  <div className="bg-sky-50 rounded-lg p-4 border border-sky-100 mb-4">
                    <div className="text-[10px] font-bold text-sky-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                      → Call to Action
                    </div>
                    <p className="text-sky-900 font-medium text-sm leading-relaxed">
                      {idea.cta}
                    </p>
                  </div>

                  {/* Expander Toggle */}
                  <button 
                    onClick={() => setExpandedIdea(expandedIdea === idx ? null : idx)}
                    className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 border-t border-slate-100 mt-2"
                  >
                    {expandedIdea === idx ? (
                      <><ChevronUp className="w-4 h-4" /> Hide Advanced Details</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> Show Advanced Details</>
                    )}
                  </button>

                  {/* Expanded Content Area */}
                  {expandedIdea === idx && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      
                      {/* SEO Data */}
                      {(idea.seoTitle || idea.seoDescription || idea.keywords) && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">SEO Data</div>
                          {idea.seoTitle && <div className="text-sm font-semibold text-slate-800 mb-1">Title: <span className="font-normal">{idea.seoTitle}</span></div>}
                          {idea.seoDescription && <div className="text-sm font-semibold text-slate-800 mb-1">Desc: <span className="font-normal">{idea.seoDescription}</span></div>}
                          {idea.keywords && <div className="text-xs text-sky-600 mt-2">{idea.keywords.join(', ')}</div>}
                        </div>
                      )}

                      {/* Variations */}
                      {(idea.emojiVersion || idea.casualVersion || idea.professionalVersion) && (
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Variations</div>
                          {idea.emojiVersion && (
                            <div className="text-sm text-slate-700 bg-white border border-slate-200 p-2 rounded">
                              <span className="text-xs font-bold text-slate-400 block mb-1">Emoji Version</span>
                              {idea.emojiVersion}
                            </div>
                          )}
                          {idea.professionalVersion && (
                            <div className="text-sm text-slate-700 bg-white border border-slate-200 p-2 rounded">
                              <span className="text-xs font-bold text-slate-400 block mb-1">Professional</span>
                              {idea.professionalVersion}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video/Reel/Social specific expanded */}
                      {(idea.reelScript || idea.videoDescription || idea.storyContent || idea.reel || idea.story || idea.videoDescription || idea.thumbnailIdea) && (
                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Video & Stories</div>
                          {(idea.reelScript || idea.reel) && (
                            <div className="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 p-2 rounded">
                              <span className="text-xs font-bold text-emerald-600 block mb-1">Reel Script / Reel Details</span>
                              {idea.reel || idea.reelScript}
                            </div>
                          )}
                          {(idea.storyContent || idea.story) && (
                            <div className="text-sm text-slate-700 bg-pink-50 border border-pink-100 p-2 rounded">
                              <span className="text-xs font-bold text-pink-600 block mb-1">Story Idea</span>
                              {idea.story || idea.storyContent}
                            </div>
                          )}
                          {idea.videoDescription && (
                            <div className="text-sm text-slate-700 bg-blue-50 border border-blue-100 p-2 rounded">
                              <span className="text-xs font-bold text-blue-600 block mb-1">Video Description</span>
                              {idea.videoDescription}
                            </div>
                          )}
                          {idea.thumbnailIdea && (
                            <div className="text-sm text-slate-700 bg-amber-50 border border-amber-100 p-2 rounded">
                              <span className="text-xs font-bold text-amber-600 block mb-1">Thumbnail Idea</span>
                              {idea.thumbnailIdea}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Extra Hooks and Carousels */}
                      {(idea.hooks || idea.carousel) && (
                        <div className="space-y-3">
                          {idea.hooks && idea.hooks.length > 0 && (
                            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                              <div className="text-[10px] font-bold text-amber-700 uppercase mb-2">Alternate Hooks</div>
                              <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
                                {idea.hooks.map((h, i) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {idea.carousel && idea.carousel.length > 0 && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                              <div className="text-[10px] font-bold text-slate-700 uppercase mb-2">Carousel Slides</div>
                              <ol className="list-decimal list-inside text-xs text-slate-800 space-y-1">
                                {idea.carousel.map((slide, i) => (
                                  <li key={i}>{slide}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Strategy */}
                      {(idea.postingTimeSuggestion || idea.audienceType || idea.trendingAngle || idea.postingTime || idea.targetAudience) && (
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                           <div className="text-[10px] font-bold text-indigo-500 uppercase mb-2">Strategy Tips</div>
                           {(idea.postingTimeSuggestion || idea.postingTime) && <div className="text-xs font-medium text-indigo-900"><span className="text-indigo-400">Time:</span> {idea.postingTime || idea.postingTimeSuggestion}</div>}
                           {(idea.audienceType || idea.targetAudience) && <div className="text-xs font-medium text-indigo-900 mt-1"><span className="text-indigo-400">Audience:</span> {idea.targetAudience || idea.audienceType}</div>}
                           {idea.trendingAngle && <div className="text-xs font-medium text-indigo-900 mt-1"><span className="text-indigo-400">Angle:</span> {idea.trendingAngle}</div>}
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                  <div className="flex-1 truncate pr-4 text-xs font-medium text-sky-600">
                    {idea.hashtags?.join(' ')}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium text-slate-400">{idea.charCount || idea.caption?.length || 0} chars</span>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <Heart className="w-3 h-3 fill-current" /> {idea.score || 85}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* NEW SECTION: Deep Dive Report */}
        {output.detailedReport && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <FileText className="w-6 h-6 text-indigo-500" />
              <h3 className="text-2xl font-bold text-slate-900">Comprehensive Content Strategy</h3>
            </div>
            <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
              <ReactMarkdown>{output.detailedReport}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
