export type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
  timestamp: string;
}

// Common Sub-types
export interface Deliverable {
  filename: string;
  content: string;
}

export interface AIPrompt {
  tool: string;
  prompt: string;
}

// 1. Research Agent
export interface Competitor {
  company: string;
  strength: string;
  weakness?: string;
  position: string;
}

export interface ResearchOutput {
  executiveSummary: string;
  marketPotential: string;
  competitionLevel: 'Low' | 'Medium' | 'High';
  opportunityScore: number;
  topCompetitors: Competitor[];
  marketSizeData?: { label: string; value: number }[]; // optional, for the donut chart
  marketTrends?: string[];
  targetDemographics?: string[];
  keyRisks?: string[];
  detailedReport?: string;
  deliverables?: Deliverable[];
}

// 2. Strategy Agent
export interface StrategyOutput {
  businessName: string;
  tagline: string;
  uniqueSellingProposition: string;
  customers: string[];
  value: string[];
  channels: string[];
  revenue: string[];
  keyMilestones?: string[];
  marketingTactics?: string[];
  detailedReport?: string;
  deliverables?: Deliverable[];
}

// 3. Content Agent
export interface ContentIdea {
  caption: string;
  hook: string;
  cta: string;
  hashtags: string[];
  imagePrompt?: string;
  thumbnailPrompt?: string;
  charCount?: number;
  score?: number;
  emojiVersion?: string;
  professionalVersion?: string;
  casualVersion?: string;
  longCaption?: string;
  shortCaption?: string;
  carouselContent?: string[];
  storyContent?: string;
  reelScript?: string;
  videoDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  altText?: string;
  thumbnailIdea?: string;
  trendingAngle?: string;
  postingTimeSuggestion?: string;
  audienceType?: string;
  contentCalendarSuggestion?: string;
  repurposeSuggestions?: string[];
  
  // Exact names requested by user
  hooks?: string[];
  postingTime?: string;
  targetAudience?: string;
  carousel?: string[];
  story?: string;
  reel?: string;
}

export interface PlatformContent {
  platform: string;
  ideas: ContentIdea[];
  seoScore?: number;
  postingTime?: string;
  engagementPrediction?: string;
}

export interface ContentOutput {
  executiveSummary: string;
  platforms: PlatformContent[];
  detailedReport?: string;
  deliverables?: Deliverable[];
}

// 4. Development Agent
export interface RecommendedStackItem {
  name: string;
  description: string;
  url?: string;
}

export interface DevelopmentOutput {
  htmlGeneratorText: string;
  architectureDescription: string;
  recommendedStack: RecommendedStackItem[];
  htmlPrototype?: string;
  folderStructure?: string;
  howToRun?: string;
  installation?: string;
  dependencies?: string;
  technologyStack?: string;
  frontendExplanation?: string;
  backendExplanation?: string;
  databaseExplanation?: string;
  deploymentGuide?: string;
  githubSetup?: string;
  hostingOptions?: string;
  performanceTips?: string;
  optimizationTips?: string;
  securitySuggestions?: string;
  alternativeManualDevelopmentGuide?: string;
  usefulDocumentationLinks?: string[];
  officialResources?: string[];
  learningResources?: string[];
  detailedReport?: string;
  deliverables?: Deliverable[];
}

// 5. Pitch Agent
export interface PitchSlide {
  title: string;
  content: string;
  keyMetric?: string;
  keyMetricLabel?: string;
  speakerNotes: string;
}

export interface PitchOutput {
  executiveSummary: string;
  slides: PitchSlide[];
  detailedReport?: string;
  deliverables?: Deliverable[];
}

// Union Type
export type AgentOutputData = 
  | ResearchOutput 
  | StrategyOutput 
  | ContentOutput 
  | DevelopmentOutput 
  | PitchOutput;
