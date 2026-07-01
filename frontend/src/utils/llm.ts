// ============================================================
// COMET Agent V2 — LLM Engine with Retry, Timeout & Validation
// ============================================================

import type {
  AgentResult,
} from '../types/agents';

// ===== API Configuration =====
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getGeminiUrl = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || '';
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
};

// ===== Constants =====
const API_TIMEOUT_MS = 45_000;
const MAX_RETRIES_PER_PROVIDER = 2;
const RETRY_BASE_DELAY_MS = 1500;

// ===== Agent-Specific System Prompts =====

const RESEARCH_PROMPT = `You are the COMET Research Agent. Generate a highly simplified Market Intelligence report using simple, beginner-friendly terms (NO complex business jargon like TAM/SAM/SOM or SWOT). Explain everything as if to a beginner.
You MUST respond with ONLY a valid JSON object (no markdown fences, no explanation). Match this exact structure:
{
  "executiveSummary": "Opening a local gym presents a consistent market opportunity driven by...",
  "marketPotential": "The demand for health and fitness services remains robust...",
  "competitionLevel": "High",
  "opportunityScore": 68,
  "topCompetitors": [
    { "company": "Budget Chain Gym", "strength": "Low membership cost...", "position": "Mass market..." }
  ],
  "marketSizeData": [{ "label": "Segment A", "value": 40 }, { "label": "Segment B", "value": 60 }],
  "marketTrends": ["Trend 1 with detailed explanation", "Trend 2...", "Trend 3...", "Trend 4...", "Trend 5..."],
  "targetDemographics": ["Demographic 1: highly specific details", "Demographic 2...", "Demographic 3..."],
  "keyRisks": ["Risk 1: detailed mitigation strategy", "Risk 2..."],
  "detailedReport": "# Complete Market Research Report\\n\\n## Introduction\\n..."
}
Generate highly detailed, exhaustive specific data based on the user's business goal. Generate at least 5 competitors, 5 trends, 3 demographics, and 3 risks.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, structured into these sections: Introduction, Overview, Best Practices, Common Mistakes, Advanced Tips, Professional Examples, Real-world Use Cases, Step-by-step Guide, Checklist, Summary, Resources, Next Steps, FAQs, Expert Recommendations. Do NOT use placeholder text or summarize sections. Write everything out in full.`;

const STRATEGY_PROMPT = `You are the COMET Strategy Agent. Generate a highly simplified Business Strategy using simple, beginner-friendly terms (NO complex business jargon like Lean Canvas, KPI, or Customer Segments). Explain everything simply.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "businessName": "Anchor Wellness Collective",
  "tagline": "Your Local Hub for Holistic Health & Connection.",
  "uniqueSellingProposition": "A supportive, community-driven wellness hub offering holistic fitness...",
  "customers": ["Detailed Profile 1...", "Profile 2...", "Profile 3...", "Profile 4...", "Profile 5...", "Profile 6..."],
  "value": ["Strong value proposition 1...", "Value 2...", "Value 3...", "Value 4...", "Value 5...", "Value 6..."],
  "channels": ["Specific Channel 1...", "Channel 2...", "Channel 3...", "Channel 4...", "Channel 5...", "Channel 6..."],
  "revenue": ["Revenue Stream 1...", "Stream 2...", "Stream 3...", "Stream 4...", "Stream 5..."],
  "keyMilestones": ["Month 1: specific goal", "Month 3: specific goal", "Month 6...", "Year 1..."],
  "marketingTactics": ["Tactic 1: highly detailed execution plan", "Tactic 2...", "Tactic 3..."],
  "detailedReport": "# Complete Strategy Report\\n\\n## Overview\\n..."
}
Generate exhaustive, highly detailed data based on the user's business goal. Generate at least 6 items for customers, value, and channels arrays. Generate 4+ milestones and 5+ tactics.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown covering Business Strategy, Execution Roadmap, KPIs, Timeline, Risks, Budget, Growth Strategy, Best Practices, Common Mistakes, Step-by-step Guide, Checklist, Summary, Next Steps, FAQs, Expert Recommendations. Write everything out in full, no summary or placeholders.`;

const CONTENT_PROMPT = `You are the COMET Content Agent. Generate marketing content for multiple platforms, providing exactly 3 distinct content ideas for each platform.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "executiveSummary": "2-3 sentence content strategy summary",
  "platforms": [
    {
      "platform": "LinkedIn",
      "ideas": [
        {
          "caption": "Full caption text with emojis",
          "hook": "Attention-grabbing first line",
          "hooks": ["Hook variation 1", "Hook variation 2"],
          "cta": "Call to action",
          "hashtags": ["#hashtag1", "#hashtag2"],
          "seoTitle": "...",
          "seoDescription": "...",
          "keywords": ["...", "..."],
          "postingTime": "...",
          "targetAudience": "...",
          "carousel": ["slide 1 text", "slide 2 text"],
          "story": "...",
          "reel": "...",
          "longCaption": "...",
          "shortCaption": "...",
          "thumbnailIdea": "...",
          "videoDescription": "...",
          "charCount": 235,
          "score": 88
        }
      ]
    }
  ],
  "detailedReport": "# Complete Content Strategy Report\\n\\n## Overview\\n..."
}
Generate content for ALL of these platforms: Instagram, Facebook, Threads, X, Pinterest, Reddit, YouTube, YouTube Shorts, TikTok, Medium, Substack, Telegram, Discord, WhatsApp Channel, Blog, Email Newsletter.
Each platform object MUST have exactly 5 objects in the "ideas" array filled with deeply researched, highly engaging, long-form content. Include all specified caption variations and SEO data.
For every single platform, you MUST generate: Hooks, Captions, Hashtags, CTA, SEO Title, SEO Description, Keywords, Posting Time, Target Audience, Carousel, Story, Reel, Long Caption, Short Caption, Thumbnail Idea, Video Description. Do not use placeholders or generic samples.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, including a Content Calendar Suggestion, Repurpose Suggestions, and Best Practices.`;

const DEVELOPMENT_PROMPT = `You are the COMET Development Agent. Generate a complete technical workspace, including a single-file HTML prototype and manual setup instructions using Lovable and Supabase.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "htmlGeneratorText": "Your HTML landing page has been generated and is ready to download.",
  "architectureDescription": "The Anchor Wellness Collective digital platform will be a modern, community-focused web application designed to manage memberships...",
  "recommendedStack": [
    { "name": "Lovable", "description": "UI Builder / Design System", "url": "https://lovable.dev" },
    { "name": "Supabase", "description": "Database & Backend-as-a-Service (BaaS)", "url": "https://supabase.com" }
  ],
  "htmlPrototype": "<!DOCTYPE html><html>...</html>",
  "folderStructure": "src/\\n  components/\\n...",
  "howToRun": "npm start...",
  "installation": "npm install...",
  "dependencies": "React, Tailwind...",
  "technologyStack": "...",
  "frontendExplanation": "...",
  "backendExplanation": "...",
  "databaseExplanation": "...",
  "deploymentGuide": "...",
  "githubSetup": "...",
  "hostingOptions": "...",
  "performanceTips": "...",
  "optimizationTips": "...",
  "securitySuggestions": "...",
  "alternativeManualDevelopmentGuide": "...",
  "detailedReport": "# Complete Development Guide\n\n## Architecture Overview\n..."
}
Generate realistic technical content for the user's business goal. 
CRITICAL: The htmlPrototype MUST be a massive, fully functional, production-ready multi-section landing page (Hero, Navbar, Features, Testimonials, Pricing, Footer). Use Tailwind CSS. Add interactivity with JS. Do not output a simple stub or basic template. Write at least 400+ lines of clean HTML, CSS, and JS with zero placeholders, dummy tags, or generic text. Do not use escaped newline characters (\n) in the page; write actual literal newlines.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, explaining: Folder structure, Tech Stack, Backend, Frontend, Database, Deployment, GitHub, Hosting, Performance, Security, Alternative Manual Development Guide, Useful Documentation Links, Official Resources, Learning Resources. Write all of this in full detail.`;

const PITCH_PROMPT = `You are the COMET Pitch Agent. Generate an investor pitch deck as structured slide data.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "executiveSummary": "2-3 sentence elevator pitch",
  "slides": [
    { "title": "The Problem", "content": "Markdown content for this slide with bullet points and key stats", "speakerNotes": "What to say when presenting this slide", "keyMetric": "$4.2B", "keyMetricLabel": "Market Size" },
    { "title": "Our Solution", "content": "...", "speakerNotes": "...", "keyMetric": "10x", "keyMetricLabel": "Faster" },
    { "title": "Market Opportunity", "content": "...", "speakerNotes": "..." },
    { "title": "Business Model", "content": "...", "speakerNotes": "..." },
    { "title": "Competition", "content": "...", "speakerNotes": "..." },
    { "title": "Revenue & Traction", "content": "...", "speakerNotes": "...", "keyMetric": "$50K", "keyMetricLabel": "MRR" },
    { "title": "Financials", "content": "...", "speakerNotes": "..." },
    { "title": "Roadmap", "content": "...", "speakerNotes": "..." },
    { "title": "The Team", "content": "...", "speakerNotes": "..." },
    { "title": "The Ask", "content": "...", "speakerNotes": "...", "keyMetric": "$500K", "keyMetricLabel": "Seed Round" }
  ],
  "detailedReport": "# Complete Pitch Deck Strategy\\n\\n## Presentation Script\\n..."
}
Generate exactly 15 highly detailed, compelling, distinct slides for investors. The slides MUST be Cover, Agenda, Problem, Market, Solution, Architecture, Features, Workflow, Business Model, Competitors, Roadmap, Future, Demo, Conclusion, Thank You. Ensure slide content uses rich markdown with bullet points and bold text. No placeholder text. Include Speaker Notes, Presentation Script, Icons, and Animations.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, including Presentation Script, Images Suggestions, Animation Suggestions, Charts Suggestions, and Professional Layout Suggestions.`;

export const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  research: RESEARCH_PROMPT,
  strategy: STRATEGY_PROMPT,
  content: CONTENT_PROMPT,
  development: DEVELOPMENT_PROMPT,
  pitch: PITCH_PROMPT,
};

// ===== Fetch with Timeout =====

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ===== Provider Implementations =====

async function callOpenRouter(messages: Array<{role: string; content: string}>, temperature: number): Promise<string> {
  console.log('[COMET] Trying OpenRouter...');
  const response = await fetchWithTimeout(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'COMET Agent',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages,
      temperature,
      max_tokens: 4096,
    }),
  }, API_TIMEOUT_MS);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned empty content');
  console.log('[COMET] ✅ OpenRouter success');
  return content;
}

async function callGemini(systemPrompt: string, userPrompt: string, temperature: number): Promise<string> {
  console.log('[COMET] Trying Gemini 2.0 Flash...');
  const response = await fetchWithTimeout(getGeminiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature, maxOutputTokens: 8192 },
    }),
  }, API_TIMEOUT_MS);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Gemini returned empty content');
  console.log('[COMET] ✅ Gemini success');
  return content;
}

// ===== JSON Cleaning & Validation =====

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  // Remove markdown fences
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  cleaned = cleaned.trim();
  return cleaned;
}

function validateAgentOutput(agentId: string, data: Record<string, unknown>): boolean {
  switch (agentId) {
    case 'research':
      return !!(data.executiveSummary && data.marketPotential && data.competitionLevel && Array.isArray(data.marketTrends));
    case 'strategy':
      return !!(data.businessName && data.uniqueSellingProposition && Array.isArray(data.customers) && Array.isArray(data.keyMilestones));
    case 'content':
      return !!(data.executiveSummary && data.platforms && Array.isArray(data.platforms));
    case 'development':
      return !!(data.htmlGeneratorText && data.architectureDescription && Array.isArray(data.recommendedStack));
    case 'pitch':
      return !!(data.executiveSummary && data.slides && Array.isArray(data.slides));
    default:
      return !!data.executiveSummary || !!data.simpleSummary;
  }
}

// ===== Retry Logic =====

async function callWithRetry(fn: () => Promise<string>, maxRetries: number): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[COMET] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`[COMET] Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error('All retry attempts failed');
}

// ===== Mock Fallback Data =====

function getMockFallback(agentId: string): Record<string, unknown> {
  const mocks: Record<string, Record<string, unknown>> = {
    research: {
      executiveSummary: "Opening a local gym presents a consistent market opportunity driven by increasing health awareness and a desire for community-centric wellness solutions.",
      marketPotential: "The demand for health and fitness services remains robust, driven by increasing health consciousness and diverse workout preferences across demographics.",
      competitionLevel: "High",
      opportunityScore: 68,
      topCompetitors: [
        { company: "Budget Chain Gym (e.g., Planet Fitness)", strength: "Low membership cost, widespread accessibility", weakness: "Often crowded, limited personalized attention", position: "Mass market, value-driven" },
        { company: "Boutique Fitness Studio", strength: "Highly specialized programs, strong community", weakness: "High price point, niche appeal", position: "Niche market, premium experience" },
        { company: "Local Crossfit Box", strength: "Intense community bond, strong coaching presence", weakness: "Intimidating to newcomers, high injury perception", position: "High-performance fitness market" },
        { company: "YMCA / Community Centers", strength: "Family-friendly, subsidized memberships, pool access", weakness: "Older equipment, less modern aesthetic", position: "Subsidized family & senior market" },
        { company: "Corporate Wellness Programs", strength: "Direct channel to employees, subsidized costs", weakness: "Lacks specialized trainers, limited community focus", position: "B2B employee benefit market" }
      ],
      marketSizeData: [{ label: "Budget Chains", value: 35 }, { label: "Boutique Studios", value: 45 }, { label: "Local Independent Gyms", value: 20 }],
      marketTrends: [
        "Rising demand for hybrid wellness (fitness + mental health)",
        "Shift towards hyper-local community hubs",
        "Increased focus on longevity and active aging",
        "Integration of wearables and bio-tracking",
        "Demand for flexible, non-contractual memberships"
      ],
      targetDemographics: [
        "Millennial professionals (28-40) seeking work-life balance and high-end class settings",
        "Active seniors (60+) requiring functional movement and social connection hubs",
        "Local families needing coordinated fitness schedules and child watch services"
      ],
      keyRisks: [
        "Economic downturn reducing disposable income for premium memberships",
        "High staff turnover for specialized trainers",
        "Intense local competition from established chains"
      ],
      detailedReport: `# Comprehensive Research Report: Health & Wellness Market Intelligence

## Introduction
The health and wellness sector has undergone a structural transformation over the past five years. No longer restricted to bodybuilders or elite athletes, fitness is now recognized as a foundational pillar of preventive healthcare, mental health, and community connection. This report details the market dynamics, opportunities, competitive landscapes, and best practices for establishing a modern fitness and wellness brand in a competitive urban landscape.

---

## Market Overview
The global wellness economy is valued at over $5.6 trillion, with physical activity representing one of the largest and most resilient segments. Despite fluctuations in economic environments, consumers increasingly prioritize spending on wellness services, viewing them as non-discretionary investments in their health. The rise of hybrid working models has shifted demand from downtown business district gyms to hyper-local neighborhood hubs, creating prime opportunities for local operators.

---

## Best Practices
1. **Focus on Community Integration:** Successful operators build hubs where members socialize before and after workouts. Incorporating social spaces, lounges, and recovery zones increases retention rates by up to 25%.
2. **Implement Hybrid Wellness Services:** Offer mindfulness sessions, nutritional advice, and mental health workshops alongside traditional functional training to capture a larger wallet share.
3. **Flexible Pricing & Memberships:** Avoid restrictive yearly contracts. Modern consumers demand flexible, tier-based monthly memberships and transparent cancelation terms.
4. **Data-Driven Progression:** Use wearable tech integration and progress tracking software to show concrete improvements to members, increasing loyalty.

---

## Common Mistakes
- **Neglecting the Third Space Concept:** Failing to create a welcoming lounge area, forcing members to leave immediately after their sessions.
- **Over-indexation on High-Intensity Workouts:** Excluding demographics like active seniors, beginners, or rehab patients by offering only elite-level fitness programs.
- **Failing to Track Member Attendance:** High-churn businesses fail to reach out to members who stop attending. Proactive retention calls can save up to 40% of canceling members.
- **Underfunding Facility Maintenance:** Dirty locker rooms and broken equipment are the top reasons members cancel their memberships.

---

## Advanced Tips
*   **Establish Strategic Corporate Partnerships:** Partner with local businesses to offer employee wellness plans, securing steady B2B recurring revenue.
*   **Leverage Micro-Influencers:** Invite local community leaders, fitness enthusiasts, and wellness advocates to trial your space, driving organic neighborhood referrals.
*   **Optimize the Off-Peak Schedule:** Offer specialized group classes for seniors or stay-at-home parents during low-attendance mid-day hours.

---

## Professional Examples
*   **Equinox:** Leverages premium branding, high-end amenities, and lifestyle positioning to command premium pricing.
*   **Barry's Bootcamp:** Focuses on immersive group experiences, lighting, and intense community marketing to drive high class attendance.
*   **Orangetheory Fitness:** Utilizes gamification, heart-rate tracking technology, and structured zone-training to guarantee visible progression.

---

## Real-world Use Cases
Consider the revitalization of local wellness hubs in secondary metropolitan markets. Gyms that integrated cold plunge tubs, saunas, and coworking desks saw membership lifetime value (LTV) increase by 32% within six months, proving that consumers are willing to pay premium prices for comprehensive health hubs.

---

## Step-by-step Guide
1. **Market Mapping:** Analyze all competitors within a 3-mile radius to identify service gaps (e.g., lack of child watch, poor group classes).
2. **Facility Design:** Allocate 60% of floor space to workouts, 20% to locker rooms and recovery, and 20% to reception and community lounge.
3. **Pre-sale Phase:** Launch digital marketing campaigns 3 months before opening to secure a base of founding members, covering operational expenses from day one.
4. **Staff Onboarding:** Train all staff on hospitality, ensuring every member is greeted by name to foster a community feel.

---

## Checklist
- [x] Conduct competitive analysis within a 5-mile radius
- [x] Secure local zoning permits and liability insurance
- [x] Set up premium booking and member management software
- [x] Hire certified head trainers and customer success staff
- [x] Complete facility buildout including acoustics and ventilation
- [x] Establish cleaning protocols and maintenance checklists

---

## Summary
The local health and wellness market remains highly lucrative for operators who prioritize hospitality, community, and comprehensive wellness over raw gym equipment. By focusing on hybrid physical-mental health services and maintaining high facility standards, new brands can successfully compete against major corporate budget chains.

---

## FAQs
**Q: How long does it take to reach profitability?**
A: Most boutique wellness centers reach operational break-even within 3 to 6 months of launch, provided they run a successful pre-sale campaign.

**Q: Do I need to buy all equipment upfront?**
A: No, equipment leasing is highly recommended to preserve capital for marketing, facility renovations, and initial cash flow reserves.

**Q: How do we stand out from budget gyms?**
A: Focus heavily on personalized coaching, clean environments, state-of-the-art recovery services, and community events that budget chains cannot replicate.

---

## Expert Recommendations
Invest heavily in your brand's digital reservation system and mobile app. Consumers expect a seamless, single-tap experience for booking classes, tracking progress, and communicating with coaches. A poor booking experience will lead to immediate member attrition.`,
      deliverables: []
    },
    strategy: {
      businessName: "Anchor Wellness Collective",
      tagline: "Your Local Hub for Holistic Health & Connection.",
      uniqueSellingProposition: "A supportive, community-driven wellness hub offering holistic fitness, personalized coaching, and recovery services in a modern, welcoming local environment, fostering genuine connection beyond just workouts.",
      customers: [
        "Local Residents (25-55) seeking a supportive, engaging gym experience beyond basic equipment; value community and holistic health.",
        "Wellness-Oriented Professionals looking for stress relief, mental clarity, and comprehensive well-being services.",
        "Active Seniors desiring functional fitness, social interaction, and tailored guidance.",
        "Corporate Clients seeking wellness benefits for their remote/local workforces.",
        "Rehab & Post-Injury Clients needing careful guidance and holistic recovery services.",
        "Young Professionals looking for a social fitness third-space to replace bars or remote coffee shops."
      ],
      value: [
        "Thriving Community: Foster genuine connections through group classes, social events, and shared wellness journeys.",
        "Holistic Wellness: Integrate fitness with recovery zones (sauna, cold plunge, massage), mindfulness sessions, and nutrition workshops.",
        "Expert & Personalized Guidance: Highly qualified trainers offering customized progress mapping.",
        "Uncompromised Facility Hygiene: Setting the standard for cleanliness, fresh air circulation, and modern aesthetics.",
        "Flexible, Transparent Pricing: Zero-contract memberships with easy online adjustments.",
        "Mind-Body Synthesis: Dedicated yoga, breathwork, and meditation classes alongside strength training."
      ],
      channels: [
        "Physical Location: Welcoming facility with prominent street presence and community cafe.",
        "Local Partnerships: Collaborations with local health stores, physiotherapists, cafes, community organizations.",
        "Digital Local Marketing: Google My Business optimization, geotargeted social media ads (Facebook, Instagram), local SEO.",
        "Corporate Outreach: Direct B2B sales to local office hubs and tech campuses.",
        "Referral Network: Reward programs offering membership credits for introducing friends and family.",
        "Community Events: Monthly public workshops, outdoor charity runs, and health seminars."
      ],
      revenue: [
        "Tiered Monthly/Annual Memberships: Offering different access levels (e.g., basic, class-inclusive, premium with recovery access).",
        "Personal Training Packages: 1:1, small group, and specialized coaching sessions.",
        "Specialized Workshops & Programs: Fees for nutrition coaching, mindfulness series, wellness challenges.",
        "Retail & Beverage: Sales of branded activewear, nutritional supplements, and healthy cafe drinks.",
        "Corporate Wellness Contracts: Monthly retainer packages for local companies."
      ],
      keyMilestones: [
        "Month 1: Secure lease and begin facility build-out.",
        "Month 2: Launch pre-sale marketing campaign and hire core staff.",
        "Month 3: Soft opening for founding members.",
        "Month 6: Achieve 300 active memberships."
      ],
      marketingTactics: [
        "Run highly targeted local Facebook/Instagram ad campaigns focusing on community.",
        "Host free outdoor weekend bootcamps in local parks.",
        "Partner with local cafes for cross-promotional discounts."
      ],
      detailedReport: `# Comprehensive Strategy and Business Execution Plan

## Executive Summary & Strategic Position
Anchor Wellness Collective is positioned to capture the growing premium holistic wellness market. By offering a hybrid third-space combining functional fitness with state-of-the-art recovery systems, the brand targets middle-to-high income professionals who value health, community, and longevity. The core strategy is built on maximizing member retention through exceptional hospitality and tech-enabled progress tracking.

---

## 12-Month Execution Roadmap
- **Q1 (Launch & Stabilize):** Finalize build-out, launch founding member pre-sales with a target of 150 sign-ups, recruit core training team, and optimize booking software flow.
- **Q2 (Growth & Engagement):** Launch corporate partnership outreach, host monthly community workshops, introduce specialized recovery memberships, and target 250 active members.
- **Q3 (Expansion & Retain):** Roll out advanced personal training packages, initiate a local influencer referral network, conduct facility satisfaction surveys, and reach 350 members.
- **Q4 (Optimize & Profit):** Introduce retail and cafe lines, launch secondary off-peak programs for seniors/rehabilitation, and establish 85% operating capacity.

---

## Key Performance Indicators (KPIs)
*   **Member Churn Rate:** Target < 4% monthly (Industry average is 6-8%).
*   **Average Revenue Per User (ARPU):** Target $165/month through secondary purchases (workshops, retail, recovery access).
*   **Customer Acquisition Cost (CAC):** Target < $85 through local SEO, referrals, and organic community programs.
*   **Membership Capacity:** Target 400 active members to reach optimal class density and operational capacity.
*   **Net Promoter Score (NPS):** Target > 75 through quarterly member surveys.

---

## Timeline & Phased Implementation
\\\`\\\`\\\`
Phase 1: Pre-Launch (Weeks 1-8)
├── Lease negotiation & design permits
├── Landing page & pre-sale campaign setup
└── Hiring core staff

Phase 2: Pre-Sale & Build (Weeks 9-16)
├── Facility renovation & equipment install
├── Pre-sale launch (Aiming for 150 members)
└── Staff training & mock classes

Phase 3: Launch & Growth (Weeks 17-32)
├── Grand opening week events
├── Local SEO push & corporate wellness launch
└── Weekly community events

Phase 4: Optimization (Weeks 33-52)
├── Retail and cafe line launch
├── Off-peak class additions
└── Profit margin optimization
\\\`\\\`\\\`

---

## Comprehensive Budget & Financial Forecast
| Expense Category | Pre-Launch Budget | Monthly Operating Cost | Projected Year 1 Return |
| :--- | :--- | :--- | :--- |
| Facility & Renovation | $85,000 | $4,500 (Rent) | Net Margin: 28% |
| Equipment (Leased) | $15,000 | $1,800 | Break-even: Month 5 |
| Marketing & Launch Ads | $12,000 | $1,200 | CAC: $78 average |
| Staff Payroll | $8,000 | $8,500 | LTV: $1,980 per member |
| Working Capital | $25,000 | $1,500 (Software/Util) | Year 1 Profit: $118,000 |

---

## Growth Strategy & Scalability
Our growth strategy is focused on building a deep community bond that allows us to expand into branded retail, nutritional supplements, and specialized digital training. Once the pilot location achieves 90% capacity, we will initiate mapping for location 2 in a adjacent high-density suburb, leveraging centralized software, marketing, and operations.

---

## Risk Management & Mitigation
1. **Economic Shock Risk:** Mitigation: Offer flexible, lower-cost membership tiers (e.g., class-only or off-peak only) to prevent cancellations.
2. **Staff Churn Risk:** Mitigation: Implement profit-sharing models for trainers based on class attendance, offering compensation 15% above market average.
3. **Local Competition Risk:** Focus heavily on high-end recovery services (saunas, plunges) that standard functional gyms and budget clubs do not offer.`,
      deliverables: []
    },
    content: {
      executiveSummary: "A multi-platform content strategy designed to build brand awareness with 3 distinct ideas for each platform.",
      platforms: [
        {
          platform: "Instagram",
          ideas: [
            {
              caption: "Exciting news for local businesses: Anchor Wellness Collective is coming!\\n\\nAs Anchor Wellness Collective prepares to open, we're dedicated to fostering not just physical health but also robust community engagement. Our vision includes corporate wellness partnerships that enhance employee well-being and productivity.",
              hook: "Exciting news for local businesses: Anchor Wellness Collective is coming!",
              hooks: ["The future of local wellness is finally here.", "Anchor Wellness Collective is officially landing in your neighborhood."],
              cta: "Connect with us to explore collaboration opportunities for your team's health.",
              hashtags: ["#CorporateWellness", "#EmployeeHealth", "#AnchorWellness"],
              seoTitle: "Anchor Wellness Collective - Premier Neighborhood Fitness Studio",
              seoDescription: "Discover Anchor Wellness Collective, a premier holistic fitness and community hub in your neighborhood. Group classes, saunas, plunges, and more.",
              keywords: ["holistic gym", "neighborhood fitness", "wellness studio", "group training"],
              postingTime: "Tuesday 8:30 AM EST",
              targetAudience: "Busy local professionals seeking stress relief and fitness community",
              carousel: ["Slide 1: Meet the Collective", "Slide 2: Our Pillars of Health", "Slide 3: Modern Recovery Area", "Slide 4: Join the Waitlist"],
              story: "Show behind-the-scenes buildout clip. Ask audience: 'What wellness service do you use most? [Poll: Strength vs Recovery]'",
              reel: "A fast-paced 15s transition video showing the space transformation. Sync with trending audio. Overlay text: 'Building the ultimate third-space for local wellness.'",
              longCaption: "Are you tired of corporate, disconnected gyms? We built Anchor Wellness Collective because we believe fitness is about more than just lifting weights. It's about recovering properly, eating well, and finding your community. That's why we're combining high-intensity group classes with a dedicated sauna, cold plunge, and social lounge. A place where you can work out, work remote, and meet your neighbors.",
              shortCaption: "Anchor Wellness is coming. A space built for fitness, recovery, and real community. Link in bio to join waitlist.",
              thumbnailIdea: "High contrast image of the modern sauna area with clean logo overlay",
              videoDescription: "Introductory reel showcasing the founders and the vision behind Anchor Wellness Collective.",
              charCount: 235,
              score: 88
            }
          ]
        },
        {
          platform: "Facebook",
          ideas: [
            {
              caption: "Looking for a gym that actually feels like a community? Anchor Wellness Collective is opening its doors soon! We're bringing functional strength, group classes, and a premium recovery zone to your neighborhood. Join our pre-sale waitlist today.",
              hook: "Looking for a gym that actually feels like a community?",
              hooks: ["Tired of crowded commercial gyms?", "Your new wellness routine starts here."],
              cta: "Click 'Sign Up' to secure your founding member rate.",
              hashtags: ["#LocalGym", "#CommunityFirst", "#WellnessHub"],
              seoTitle: "Anchor Wellness Collective - Local Fitness Pre-sale",
              seoDescription: "Sign up for Anchor Wellness Collective pre-sale and get 20% off lifetime memberships. Local community-focused gym.",
              keywords: ["local gym", "pre-sale discount", "fitness center"],
              postingTime: "Monday 11:00 AM EST",
              targetAudience: "Local families and neighborhood residents",
              carousel: ["Slide 1: Pre-sale 20% Off", "Slide 2: Limited Spots Available", "Slide 3: Reserve Yours Now"],
              story: "Pre-sale countdown graphic. Countdown sticker ending in 48 hours.",
              reel: "Quick tour of the front desk and lounge area. Overlay: 'Pre-sale starts now!'",
              longCaption: "We are officially launching pre-sales for Anchor Wellness Collective. As a founding member, you will get lifetime discounted rates, priority class booking, and invitations to private launch events. Spots are strictly limited to the first 100 residents to maintain our community-focused atmosphere.",
              shortCaption: "Founding member pre-sales are officially open. Grab 20% off for life.",
              thumbnailIdea: "Founder standing outside the building smiling",
              videoDescription: "Full walkthrough of the founding member benefits.",
              charCount: 220,
              score: 85
            }
          ]
        },
        {
          platform: "Threads",
          ideas: [
            {
              caption: "Hot take: Commercial gyms want you to sign up and never show. Boutique studios want you to show up, but overcharge you. We are building the middle ground. Community, premium recovery, and fair pricing.",
              hook: "Hot take: Commercial gyms want you to sign up and never show.",
              hooks: ["Why does every gym feel so sterile?", "Let's talk about the 'third space' problem in local neighborhoods."],
              cta: "Let us know: What's your biggest pet peeve at the gym?",
              hashtags: ["#FitnessPhilosophy", "#GymCulture"],
              seoTitle: "Anchor Wellness Collective - Gym Culture Reimagined",
              seoDescription: "A fresh take on gym culture. Why Anchor Wellness Collective focuses on community and transparency.",
              keywords: ["gym culture", "fitness community"],
              postingTime: "Wednesday 7:00 PM EST",
              targetAudience: "Thoughtful fitness consumers and industry enthusiasts",
              carousel: ["No slides needed for Threads - Text focus"],
              story: "Share the thread link with an emoji.",
              reel: "No reel needed",
              longCaption: "The commercial gym business model is broken. It relies on selling 5,000 memberships to a facility that fits 300, hoping you stay home. We want the opposite. We cap our memberships because we want you here, building habits and connecting with other members.",
              shortCaption: "We cap our memberships because we actually want you to show up.",
              thumbnailIdea: "Logo typography",
              videoDescription: "No video",
              charCount: 180,
              score: 90
            }
          ]
        },
        {
          platform: "X",
          ideas: [
            {
              caption: "Building a health collective in public. Capping memberships at 350. Standard gym model relies on you not showing. We rely on community. Pre-sale starts tomorrow. 🧵",
              hook: "Building a health collective in public.",
              hooks: ["Gym membership caps are the future of fitness. Here's why.", "We're building the anti-gym."],
              cta: "Follow the thread to see the tech stack, interior design, and pre-sale link.",
              hashtags: ["#BuildInPublic", "#FitnessBusiness"],
              seoTitle: "Anchor Wellness - Capped Gym Memberships",
              seoDescription: "Why capped memberships lead to better member retention and stronger community bonds.",
              keywords: ["build in public", "gym membership cap"],
              postingTime: "Thursday 10:00 AM EST",
              targetAudience: "Tech founders, wellness professionals, local builders",
              carousel: ["Tweet 1: Capping memberships", "Tweet 2: Premium recovery focus", "Tweet 3: Tech stack integration"],
              story: "N/A",
              reel: "N/A",
              longCaption: "Traditional gyms sell access. We sell integration. A thread on how we are leveraging modern technology (Supabase, Lovable) to build a seamless booking and progress tracking app for our physical location, keeping member acquisition costs low and lifetime value high.",
              shortCaption: "Building the anti-gym in public. Capped memberships. Premium recovery.",
              thumbnailIdea: "High-contrast architectural layout blueprint",
              videoDescription: "N/A",
              charCount: 200,
              score: 87
            }
          ]
        },
        {
          platform: "Pinterest",
          ideas: [
            {
              caption: "Modern organic gym interiors. Cozy lounge areas, sleek saunas, and functional minimalist workout zones. Aesthetic fitness inspiration for your wellness routine. #GymDesign #WellnessStudio",
              hook: "Cozy minimalist wellness studio interiors.",
              hooks: ["Gym aesthetic goals.", "Modern sauna and plunge layouts."],
              cta: "Pin to your fitness inspiration board.",
              hashtags: ["#GymAesthetic", "#SaunaDesign", "#MinimalistGym"],
              seoTitle: "Minimalist Gym & Wellness Studio Design",
              seoDescription: "Explore minimalist design ideas for wellness centers and boutique gyms. Sauna, plunge, and lounge setup.",
              keywords: ["gym interiors", "wellness design", "cozy gym"],
              postingTime: "Saturday 3:00 PM EST",
              targetAudience: "Design-focused fitness enthusiasts",
              carousel: ["Pin 1: Lounge design", "Pin 2: Gym floor layout", "Pin 3: Recovery room"],
              story: "Aesthetic walkthrough of materials",
              reel: "Aesthetic slow pans of the construction phase.",
              longCaption: "Inside the design philosophy of Anchor Wellness Collective. We chose natural materials, warm lighting, and minimalist setups to reduce stress hormones (cortisol) and create a space that feels like a home sanctuary rather than a sterile warehouse.",
              shortCaption: "Warm minimalist gym interiors. Click for more wellness inspiration.",
              thumbnailIdea: "Beautiful render of the community lounge area",
              videoDescription: "Design render animation of the completed space.",
              charCount: 160,
              score: 82
            }
          ]
        },
        {
          platform: "Reddit",
          ideas: [
            {
              caption: "Why are there no 'third spaces' left in local neighborhoods that aren't bars or cafes? We're building a wellness collective that is capped at 350 members, combining strength training, saunas, plunges, and a work-friendly lounge. Here is our business model.",
              hook: "Why are there no 'third spaces' left that aren't bars or cafes?",
              hooks: ["How to build a local gym that doesn't suck.", "Capping our gym memberships to prevent overcrowding - business case."],
              cta: "Would you pay a premium for a gym that caps membership to prevent crowds?",
              hashtags: ["#r/smallbusiness", "#r/fitness"],
              seoTitle: "Capping Gym Memberships - Business Model Analysis",
              seoDescription: "Reddit discussion on capped membership pricing, retention rates, and community building.",
              keywords: ["membership cap", "third space gym"],
              postingTime: "Sunday 1:00 PM EST",
              targetAudience: "Local neighborhood redditors, small business enthusiasts",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "Hey everyone, I wanted to share the math behind our upcoming neighborhood wellness space. Most gyms need thousands of members to pay rent because their prices are low and churn is high. By raising our price slightly and capping membership at 350, we maintain a premium experience, zero wait times, and strong retention. Here is the full financial breakdown...",
              shortCaption: "Capping our gym membership at 350 to fix the third-space problem. Thoughts?",
              thumbnailIdea: "Table of financials",
              videoDescription: "N/A",
              charCount: 280,
              score: 92
            }
          ]
        },
        {
          platform: "YouTube",
          ideas: [
            {
              caption: "How we built and launched a neighborhood wellness startup in under 6 months. Detailed walkthrough of site selection, leasing, pre-sale strategy, and facility build-out.",
              hook: "Building a local wellness startup from scratch.",
              hooks: ["The math behind a capped membership gym.", "Walkthrough of our modern recovery center build-out."],
              cta: "Subscribe for weekly episodes of our build in public journey.",
              hashtags: ["#GymStartup", "#BusinessVlog", "#BoutiqueFitness"],
              seoTitle: "How to Build a Modern Gym Startup (Under 6 Months)",
              seoDescription: "Step-by-step vlog detailing the construction, marketing, and leasing of a modern wellness studio.",
              keywords: ["gym business", "startup vlog", "how to open a gym"],
              postingTime: "Friday 5:00 PM EST",
              targetAudience: "Fitness entrepreneurs and local builders",
              carousel: ["N/A"],
              story: "Teaser clip of the episode",
              reel: "N/A",
              longCaption: "In this video, we take you behind the scenes of Anchor Wellness Collective. We cover the lease negotiations, why we decided to lease equipment instead of buying it cash, our target demographics, and the exact marketing funnel we used to sign up 100 members before the drywall was finished. Watch till the end for the full sheet breakdown.",
              shortCaption: "How we launched a local gym startup. Subscribe for the full journey.",
              thumbnailIdea: "Split screen of empty warehouse vs completed luxury gym lounge",
              videoDescription: "Detailed startup journey and financials breakdown of the collective.",
              charCount: 250,
              score: 89
            }
          ]
        },
        {
          platform: "YouTube Shorts",
          ideas: [
            {
              caption: "The commercial gym model relies on you staying home. Here's how we're changing that. #businesshacks #gymculture #startup",
              hook: "The dirty secret of commercial gyms.",
              hooks: ["Why we cap our memberships at 350.", "Gym pricing explained."],
              cta: "Subscribe for more fitness startup business breakdowns.",
              hashtags: ["#Shorts", "#GymIndustry", "#SmallBusiness"],
              seoTitle: "The Gym Industry's Dirty Secret",
              seoDescription: "Short video explaining gym overselling business models vs capped memberships.",
              keywords: ["gym secrets", "business shorts"],
              postingTime: "Daily 12:00 PM EST",
              targetAudience: "Gen Z & Millennial health consumers",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "Did you know budget gyms oversell their space by 1000%? They pray you don't show up. At Anchor Wellness Collective, we cap our membership at 350. We want you to show up, connect, and recover. It's the anti-commercial gym model.",
              shortCaption: "Budget gyms oversell. We cap. Subscribe to see how we did it.",
              thumbnailIdea: "Founders reacting to a chart showing gym churn rates",
              videoDescription: "A 45s fast breakdown of boutique gym economics vs franchise clubs.",
              charCount: 150,
              score: 93
            }
          ]
        },
        {
          platform: "TikTok",
          ideas: [
            {
              caption: "POV: You found a local gym that has a private sauna, cold plunge, and caps membership so it's never crowded. 🧴💆‍♀️ #wellness #gymtok #aestheticgym #morningroutine",
              hook: "The aesthetic local gym you didn't know you needed.",
              hooks: ["A gym that actually wants you to show up.", "POV: Your gym routine includes a cold plunge and lounge working space."],
              cta: "Link in bio to join waitlist for founding spots.",
              hashtags: ["#AestheticGym", "#ColdPlunge", "#SaunaRoutine", "#SelfCare"],
              seoTitle: "Boutique Aesthetic Wellness Gym Tour",
              seoDescription: "Discover the most aesthetic neighborhood gym featuring a luxury recovery suite and capped memberships.",
              keywords: ["aesthetic gym", "gymtok", "morning wellness"],
              postingTime: "Tuesday 7:30 AM EST (Morning routine peak)",
              targetAudience: "Wellness lifestyle creators, Gen Z/Millennial morning routines",
              carousel: ["N/A"],
              story: "Behind the scenes aesthetic coffee pour in the lounge",
              reel: "N/A",
              longCaption: "This is what a gym should feel like. Warm wood, natural light, no lines, and a community of people who care about health inside and out. Welcome to Anchor Wellness Collective. We are opening pre-sales this week for founding members.",
              shortCaption: "The gym of your dreams is opening. Capped membership. Link in bio.",
              thumbnailIdea: "Aesthetic shot of cold plunge ripples",
              videoDescription: "POV aesthetic morning routine at the collective.",
              charCount: 170,
              score: 95
            }
          ]
        },
        {
          platform: "Medium",
          ideas: [
            {
              caption: "Reclaiming the Third Space: Why Local Gyms Must Evolve Beyond Exercise. An in-depth essay on urban design, community loneliness, and wellness.",
              hook: "Why is it so hard to find a community space that isn't a bar?",
              hooks: ["Loneliness in the digital age: Can local health hubs save us?", "Why boutique fitness is replacing the traditional community center."],
              cta: "Read the full essay on Medium and share your thoughts.",
              hashtags: ["#ThirdSpace", "#Community", "#MentalHealth", "#Urbanism"],
              seoTitle: "The Evolution of the Gym: Reclaiming the Third Space",
              seoDescription: "An essay exploring how fitness centers are evolving into community health collectives to solve the loneliness epidemic.",
              keywords: ["third spaces", "community fitness", "wellness economy"],
              postingTime: "Sunday 9:00 AM EST",
              targetAudience: "Intellectual health consumers, urbanists, and sociologists",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "The structural breakdown of local communities has left a void. Cafes and bars are transactional. The gym, traditionally focused on physical output, is uniquely positioned to become the new community 'third space'—integrating fitness, recovery, work, and social connection. Here is how we are building Anchor Wellness Collective to lead this movement...",
              shortCaption: "Can local gym collectives solve the loneliness epidemic? Read the essay.",
              thumbnailIdea: "Artistic black and white photo of people chatting in a lounge",
              videoDescription: "N/A",
              charCount: 260,
              score: 91
            }
          ]
        },
        {
          platform: "Substack",
          ideas: [
            {
              caption: "Anchor Wellness Weekly: Navigating Hybrid Longevity. Tips on training, recovery protocols, and building a neighborhood wellness collective from the ground up.",
              hook: "How to structure your week for longevity and recovery.",
              hooks: ["Building the anti-gym business: Week 12 updates.", "Sauna vs Cold Plunge: What science says about the sequence."],
              cta: "Subscribe to our free newsletter for weekly research and building updates.",
              hashtags: ["#Substack", "#Longevity", "#BoutiqueBusiness"],
              seoTitle: "Anchor Wellness Weekly - Fitness & Longevity Newsletter",
              seoDescription: "Weekly research, tips on health optimization, and behind the scenes updates of our wellness startup.",
              keywords: ["health newsletter", "recovery protocols", "longevity"],
              postingTime: "Thursday 8:00 AM EST",
              targetAudience: "Health-focused readers, longevity enthusiasts, local members",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "Welcome back to Anchor Wellness Weekly. This week, we cover the exact protocols for recovery that we are building into our facility. Why we are installing custom commercial infrared saunas, how to sequence hot-cold therapy, and the physiological benefits of social fitness compared to solo training. Read the full post below...",
              shortCaption: "New newsletter post: Hot-Cold therapy protocols. Subscribe free.",
              thumbnailIdea: "Warm orange glow from a sauna window",
              videoDescription: "N/A",
              charCount: 220,
              score: 89
            }
          ]
        },
        {
          platform: "Telegram",
          ideas: [
            {
              caption: "📢 Pre-sales for Anchor Wellness Collective are officially starting tomorrow at 9 AM. Slots are capped at 350. Active members get priority. Waitlist link below: [Link] #announcement",
              hook: "Pre-sale announcement: 24 hours to launch.",
              hooks: ["Urgent: Capped memberships opening soon.", "Exclusive: Founding member rate details."],
              cta: "Join the announcement channel and pin this post to not miss the signup link.",
              hashtags: ["#PreSale", "#AnchorCollective"],
              seoTitle: "Telegram Announcement - Pre-sale",
              seoDescription: "Priority booking links and updates for Anchor Wellness Collective pre-sales.",
              keywords: ["presale link", "gym registration"],
              postingTime: "Wednesday 8:00 PM EST (Pre-launch evening)",
              targetAudience: "Highly interested waitlist signups",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "We will release the signup link to this channel exactly at 9:00 AM. Remember, spots are strictly capped at 350 and we expect the founding tier to sell out within 15 minutes. Ensure your payment details are ready to secure the 20% lifetime discount.",
              shortCaption: "Pre-sale opens in 24 hours. Pin this post to secure your spot.",
              thumbnailIdea: "High contrast countdown banner",
              videoDescription: "N/A",
              charCount: 160,
              score: 94
            }
          ]
        },
        {
          platform: "Discord",
          ideas: [
            {
              caption: "@here Founding Members Channel is now live! Introduce yourself in #introductions and check #announcements for details on our private launch party.",
              hook: "Founding member Discord is officially open.",
              hooks: ["Welcome to the collective community space.", "Introduce yourself to the neighborhood."],
              cta: "Jump in #introductions and tell us: What's your fitness goal this quarter?",
              hashtags: ["#Launch", "#DiscordCommunity"],
              seoTitle: "Discord Hub - Anchor Wellness",
              seoDescription: "Join the private chat server for Anchor Wellness Collective members.",
              keywords: ["discord server", "member portal"],
              postingTime: "Launch Day 10:00 AM EST",
              targetAudience: "Registered members and local health leaders",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "This Discord server will act as our digital third space. Use the channels to find workout partners, coordinate running clubs, share recipe ideas in #nutrition, and get direct updates from the training staff. We're excited to have you all here.",
              shortCaption: "Discord is live! Join the private community server today.",
              thumbnailIdea: "Discord welcome logo",
              videoDescription: "N/A",
              charCount: 180,
              score: 93
            }
          ]
        },
        {
          platform: "WhatsApp Channel",
          ideas: [
            {
              caption: "Good morning Collective! ☀️ Pre-sale tier 1 is officially sold out. We have opened 25 more spots for Tier 2 founding memberships before general admission opens. Grab yours here: [Link]",
              hook: "Pre-sale update: Tier 1 SOLD OUT.",
              hooks: ["25 spots left in our founding tier.", "Pre-sale link update."],
              cta: "Tap the link to secure your Tier 2 spot.",
              hashtags: ["#AnchorWellness", "#PreSaleUpdate"],
              seoTitle: "WhatsApp Announcement - Presale Update",
              seoDescription: "Live updates and link distributions for Anchor Wellness Collective pre-sales.",
              keywords: ["whatsapp gym link", "pre-sale update"],
              postingTime: "Thursday 10:30 AM EST",
              targetAudience: "Active neighborhood prospects",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "Thank you all for the incredible support. We sold out our first 100 spots in under 20 minutes. Due to the high demand, our team has released 25 final Tier 2 spots before we close the pre-launch phase. Click below to register.",
              shortCaption: "Tier 1 sold out. Grab one of the last 25 Tier 2 spots now.",
              thumbnailIdea: "Success sold out stamp graphic",
              videoDescription: "N/A",
              charCount: 150,
              score: 92
            }
          ]
        },
        {
          platform: "Blog",
          ideas: [
            {
              caption: "The Physiology of Hot-Cold Therapy: How to Maximize Recovery at the Gym. Read our complete guide on sequencing saunas and cold plunges.",
              hook: "How to use saunas and cold plunges for optimal recovery.",
              hooks: ["Are you sequencing your recovery wrong?", "The science of temperature contrast therapy in local fitness."],
              cta: "Read the full scientific guide on our neighborhood blog.",
              hashtags: ["#ContrastTherapy", "#SaunaScience", "#ColdPlungeGuide"],
              seoTitle: "Hot-Cold Contrast Therapy Guide: Sauna and Plunge Sequence",
              seoDescription: "Learn the exact scientific protocol for hot-cold contrast therapy. How long to spend in the sauna vs cold plunge for muscle recovery.",
              keywords: ["contrast therapy", "sauna sequence", "cold plunge recovery", "active recovery"],
              postingTime: "Monday 9:00 AM EST",
              targetAudience: "Detail-oriented health consumers and active members",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "In this blog post, we break down contrast therapy. We look at vasodilation and vasoconstriction, how temperature shifts affect inflammation, and the optimal timing: 15 minutes in a 180°F dry sauna followed by 3 minutes in a 45°F cold plunge, repeated 3 times. We explain why we designed our recovery room to facilitate this exact flow.",
              shortCaption: "How to sequence saunas and plunges correctly. Read our guide.",
              thumbnailIdea: "Detailed infographics of contrast therapy blood flow",
              videoDescription: "N/A",
              charCount: 260,
              score: 90
            }
          ]
        },
        {
          platform: "Email Newsletter",
          ideas: [
            {
              caption: "Subject: The third-space problem (and how we're solving it)\\n\\nHey [First Name],\\n\\nMost local neighborhoods lack a true 'third space'. We're building a wellness collective to bridge the gap...",
              hook: "Subject: The third-space problem (and how we're solving it)",
              hooks: ["Subject: Capping our memberships at 350 (Here's the math)", "Subject: How to design your optimal morning recovery protocol"],
              cta: "Reply directly to this email to book your private tour of the collective.",
              hashtags: ["#Newsletter", "#AnchorCollective"],
              seoTitle: "Email Newsletter - Anchor Wellness Collective",
              seoDescription: "Weekly newsletters sent to the Anchor Wellness community covering health and local events.",
              keywords: ["email newsletter", "neighborhood update"],
              postingTime: "Tuesday 7:00 AM EST (Morning email check)",
              targetAudience: "Subscribers and warm pre-leads",
              carousel: ["N/A"],
              story: "N/A",
              reel: "N/A",
              longCaption: "Hey [First Name],\\n\\nBetween the demands of work and home life, we all need a third space—a welcoming neighborhood sanctuary where we can focus on physical health, mental clarity, and social connection without pressure. That is why we are capping Anchor Wellness Collective at 350 memberships. No crowds, no rushed classes, and no waiting for the recovery room. Read on to see the interior design reveals...",
              shortCaption: "The third space you've been looking for. Pre-sales open today.",
              thumbnailIdea: "Welcome banner image",
              videoDescription: "N/A",
              charCount: 280,
              score: 91
            }
          ]
        }
      ],
      deliverables: [
        { filename: "Social_Media_Pack.txt", content: "# Social Media Content Pack\\n\\nContains all your social posts." }
      ],
      detailedReport: `# Comprehensive Content Strategy & Calendar Guide

## Multi-Platform Content Architecture
Modern digital presence requires adapting the core message to various platforms. For Anchor Wellness Collective, the core theme is "Reclaiming the Third Space through Fitness and Recovery." This strategy is executed across all 16 platforms with platform-specific hooks, formats, and audiences.

---

## Content Calendar & Execution Strategy
- **Mondays:** Focus on Education (science of recovery, contrast therapy, blog links).
- **Tuesdays:** Focus on Community (member spotlights, behind-the-scenes building updates, morning routines).
- **Wednesdays:** Focus on Philosophy & Culture (addressing gym overcrowding, third spaces, membership capping on Threads and Twitter).
- **Thursdays:** Focus on Call-to-actions (waitlist openings, pre-sale discounts, newsletter signups).
- **Fridays:** Focus on Long-form Media (YouTube startup vlogs, behind-the-scenes construction reels).
- **Weekends:** Focus on Inspiration & Aesthetics (Pinterest design pins, Instagram lifestyle photography).

---

## Best Practices
1. **Never Post the Same Format Everywhere:** Adapt the caption length, formatting, and media to each network. Long-form analytical articles belong on Medium, fast POV trends on TikTok, and philosophical threads on X.
2. **Prioritize Video Engagement:** Video is the dominant medium on Instagram, TikTok, and YouTube. Ensure every video has text overlays and a strong visual hook in the first 3 seconds.
3. **Transparent Brand Journey:** Share the struggles, timelines, and costs of building the collective in public. Showing authenticity increases brand loyalty by up to 50%.
4. **Strong, Singular CTAs:** Do not ask users to like, comment, subscribe, and visit the website in one post. Focus on a single clear action (e.g., "Join waitlist, link in bio").

---

## Repurposing Suggestion Blueprint
\\\`\\\`\\\`
[ YouTube Vlog: How We Built the Studio ]
          │
          ├──► [ TikTok/Reel: 30s Quick Transformation Tour ]
          ├──► [ X Thread: The Financial Breakdown of Capping Memberships ]
          ├──► [ Blog Post: The Physiology of Contrast Therapy Facilities ]
          └──► [ Newsletter: Weekly Update & Exclusive Interior Renderings ]
\\\`\\\`\\\``
    },
    development: {
      htmlGeneratorText: "Your HTML landing page has been generated and is ready to download.",
      architectureDescription: "The Anchor Wellness Collective digital platform will be a modern, community-focused web application designed to manage memberships, facilitate class bookings, and provide a personalized experience for members.",
      recommendedStack: [
        { name: "Lovable", description: "UI Builder / Design System", url: "https://lovable.dev" },
        { name: "Supabase", description: "Database & Backend-as-a-Service (BaaS)", url: "https://supabase.com" }
      ],
      htmlPrototype: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anchor Wellness Collective - Local Hub for Holistic Health & Connection</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: "Plus Jakarta Sans", sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 overflow-x-hidden pt-20">
  <!-- Navbar -->
  <nav class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <a href="#" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-sky-200/50 group-hover:scale-105 transition-transform">A</div>
        <span class="font-extrabold text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Anchor Wellness</span>
      </a>
      <div class="hidden md:flex items-center gap-8">
        <a href="#features" class="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</a>
        <a href="#about" class="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">About</a>
        <a href="#pricing" class="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
        <a href="#testimonials" class="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Community</a>
      </div>
      <div class="hidden md:flex items-center gap-4">
        <button class="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">Sign In</button>
        <button class="bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-950/10 hover:shadow-slate-950/20 hover:-translate-y-0.5 transition-all active:translate-y-0">Join Collective</button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative min-h-[85vh] flex items-center justify-center px-6 py-20 overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-slate-50">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-100/30 via-transparent to-transparent pointer-events-none"></div>
    <div class="max-w-5xl mx-auto text-center relative z-10 space-y-8">
      <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-xs font-bold text-sky-700 uppercase tracking-wider">
        ✨ Reclaiming the third space
      </span>
      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
        Your Local Hub for <br>
        <span class="gradient-text">Holistic Health & Connection</span>
      </h1>
      <p class="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
        Anchor Wellness Collective is a capped-membership neighborhood hub combining high-intensity strength training, premium saunas, cold plunges, and a social coworking lounge.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <a href="#pricing" class="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white text-center px-8 py-4 rounded-xl font-bold shadow-xl shadow-slate-950/10 hover:-translate-y-0.5 transition-all">View Memberships</a>
        <a href="#features" class="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-center px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors">Explore the space</a>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section id="features" class="py-24 px-6 max-w-7xl mx-auto">
    <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
      <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900">What We Offer</h2>
      <p class="text-slate-600">We provide everything you need to perform, recover, and connect under one roof.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-colors shadow-sm space-y-4">
        <div class="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-lg">🏋️‍♂️</div>
        <h3 class="text-xl font-bold text-slate-900">Functional Strength</h3>
        <p class="text-slate-600 text-sm leading-relaxed">Group training classes led by professional coaches focusing on mobility, metabolic conditioning, and structured progression.</p>
      </div>
      <div class="bg-white p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-colors shadow-sm space-y-4">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">🧖‍♀️</div>
        <h3 class="text-xl font-bold text-slate-900">Contrast Therapy</h3>
        <p class="text-slate-600 text-sm leading-relaxed">State-of-the-art infrared saunas and cold plunge tubs designed to reduce inflammation, aid recovery, and boost energy levels.</p>
      </div>
      <div class="bg-white p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-colors shadow-sm space-y-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg">☕</div>
        <h3 class="text-xl font-bold text-slate-900">Social Lounge</h3>
        <p class="text-slate-600 text-sm leading-relaxed">A cozy workspace with fast Wi-Fi and organic coffee, allowing you to transition smoothly from morning workout to remote workday.</p>
      </div>
    </div>
  </section>

  <!-- Interactive Pricing Section -->
  <section id="pricing" class="py-24 px-6 bg-slate-100/50 border-y border-slate-200/50">
    <div class="max-w-7xl mx-auto">
      <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900">Flexible Memberships</h2>
        <p class="text-slate-600 text-sm">No enrollment fees. No contracts. Adjust or cancel membership anytime online.</p>
        <div class="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 mt-6">
          <button id="monthly-btn" class="px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white transition-colors" onclick="togglePricing('monthly')">Monthly</button>
          <button id="yearly-btn" class="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors" onclick="togglePricing('yearly')">Yearly (Save 20%)</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <!-- Tier 1 -->
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-8">
          <div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Basic Strength</h3>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-4xl font-black text-slate-900" id="tier1-price">$99</span>
              <span class="text-sm text-slate-500 font-semibold" id="tier1-period">/mo</span>
            </div>
            <ul class="space-y-4 text-sm text-slate-600">
              <li class="flex items-center gap-3">✅ Unlimited Gym Floor Access</li>
              <li class="flex items-center gap-3">✅ Basic Mobile Booking App</li>
              <li class="flex items-center gap-3">❌ Recovery Suite Access</li>
              <li class="flex items-center gap-3">❌ Co-working Lounge WiFi</li>
            </ul>
          </div>
          <button class="w-full py-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors">Select Plan</button>
        </div>
        <!-- Tier 2 (Featured) -->
        <div class="bg-white p-8 rounded-3xl border-2 border-sky-500 shadow-lg relative flex flex-col justify-between space-y-8 transform scale-105">
          <span class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-sky-500 text-white font-bold text-xs uppercase tracking-wider">Most Popular</span>
          <div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Collective Access</h3>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-4xl font-black text-slate-900" id="tier2-price">$149</span>
              <span class="text-sm text-slate-500 font-semibold" id="tier2-period">/mo</span>
            </div>
            <ul class="space-y-4 text-sm text-slate-600">
              <li class="flex items-center gap-3">✅ Unlimited Strength Classes</li>
              <li class="flex items-center gap-3">✅ 4 Sauna & Cold Plunge Sessions /mo</li>
              <li class="flex items-center gap-3">✅ Co-working Lounge + Fast WiFi</li>
              <li class="flex items-center gap-3">✅ Invites to Community Socials</li>
            </ul>
          </div>
          <button class="w-full py-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all shadow-md shadow-sky-500/20">Select Plan</button>
        </div>
        <!-- Tier 3 -->
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-8">
          <div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Ultimate Longevity</h3>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-4xl font-black text-slate-900" id="tier3-price">$229</span>
              <span class="text-sm text-slate-500 font-semibold" id="tier3-period">/mo</span>
            </div>
            <ul class="space-y-4 text-sm text-slate-600">
              <li class="flex items-center gap-3">✅ Unlimited Strength + Recovery</li>
              <li class="flex items-center gap-3">✅ Unlimited Sauna & Cold Plunge</li>
              <li class="flex items-center gap-3">✅ Private Locker & Towel Service</li>
              <li class="flex items-center gap-3">✅ 1 Guest Pass per month</li>
            </ul>
          </div>
          <button class="w-full py-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors">Select Plan</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-24 px-6 max-w-5xl mx-auto">
    <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
      <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900">What Members Say</h2>
      <p class="text-slate-600">Hear from local residents who found their wellness home with us.</p>
    </div>
    <div class="relative overflow-hidden bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm">
      <div id="testimonial-box" class="transition-all duration-300 opacity-100 space-y-6">
        <p class="text-lg text-slate-700 italic leading-relaxed" id="t-text">
          "Anchor Wellness Collective completely changed how I think about going to the gym. It's not just about lifting weights; it's a neighborhood space where I can work out, relax in the sauna, and have coffee with friends. The capped membership makes a massive difference."
        </p>
        <div>
          <div class="font-bold text-slate-900" id="t-author">Sarah Jenkins</div>
          <div class="text-sm text-slate-500" id="t-title">Member since Pre-sale</div>
        </div>
      </div>
      <div class="flex gap-2 mt-8 justify-end">
        <button onclick="slideTestimonial('prev')" class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">◀</button>
        <button onclick="slideTestimonial('next')" class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">▶</button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-900 text-white py-16 px-6 border-t border-slate-800">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-sm">A</div>
          <span class="font-bold text-lg">Anchor Wellness</span>
        </div>
        <p class="text-slate-400 text-xs leading-relaxed">Capped-membership neighborhood fitness and recovery third-space.</p>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4 text-slate-200">Explore</h4>
        <ul class="space-y-2 text-xs text-slate-400">
          <li><a href="#features" class="hover:text-white transition-colors">Our Space</a></li>
          <li><a href="#pricing" class="hover:text-white transition-colors">Memberships</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Recovery Systems</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4 text-slate-200">Community</h4>
        <ul class="space-y-2 text-xs text-slate-400">
          <li><a href="#" class="hover:text-white transition-colors">Discord Hub</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Local Events</a></li>
          <li><a href="#" class="hover:text-white transition-colors">Newsletter Archive</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-4 text-slate-200">Location & Hours</h4>
        <p class="text-xs text-slate-400 leading-relaxed">104 Wellness Blvd, Neighborhood Suite B</p>
        <p class="text-xs text-slate-400 mt-2">Mon - Fri: 6:00 AM - 9:00 PM<br>Sat - Sun: 7:00 AM - 5:00 PM</p>
      </div>
    </div>
    <div class="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500">
      &copy; 2026 Anchor Wellness Collective. All rights reserved.
    </div>
  </footer>

  <script>
    function togglePricing(type) {
      const monthlyBtn = document.getElementById("monthly-btn");
      const yearlyBtn = document.getElementById("yearly-btn");
      
      const t1 = document.getElementById("tier1-price");
      const t2 = document.getElementById("tier2-price");
      const t3 = document.getElementById("tier3-price");
      
      if (type === "monthly") {
        monthlyBtn.className = "px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white transition-colors";
        yearlyBtn.className = "px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors";
        t1.innerText = "$99";
        t2.innerText = "$149";
        t3.innerText = "$229";
      } else {
        yearlyBtn.className = "px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white transition-colors";
        monthlyBtn.className = "px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors";
        t1.innerText = "$79";
        t2.innerText = "$119";
        t3.innerText = "$179";
      }
    }

    const testimonials = [
      {
        text: "Anchor Wellness Collective completely changed how I think about going to the gym. It's not just about lifting weights; it's a neighborhood space where I can work out, relax in the sauna, and have coffee with friends. The capped membership makes a massive difference.",
        author: "Sarah Jenkins",
        title: "Member since Pre-sale"
      },
      {
        text: "The recovery room alone is worth the membership. Having commercial-grade saunas and cold plunges down the street has cut my recovery time in half, and I've met more neighbors here than in three years of living in the area.",
        author: "David Miller",
        title: "Active Runner & Member"
      }
    ];
    let currentIndex = 0;
    
    function slideTestimonial(dir) {
      if (dir === "next") {
        currentIndex = (currentIndex + 1) % testimonials.length;
      } else {
        currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
      }
      document.getElementById("t-text").innerText = '"' + testimonials[currentIndex].text + '"';
      document.getElementById("t-author").innerText = testimonials[currentIndex].author;
      document.getElementById("t-title").innerText = testimonials[currentIndex].title;
    }
  </script>
</body>
</html>`,
      detailedReport: `# Comprehensive Technical Workspace & Architecture Documentation

## Technology Stack & Dependencies
The Anchor Wellness Collective digital workspace uses a modern, light full-stack stack designed for reliability, fast load times, and simple local operations.
- **UI & Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend & Database:** Supabase (BaaS), Postgres, SQL Rule-based Security (RLS).
- **Automation & Scheduling:** Supabase Edge Functions, pg_cron.
- **Development Tool:** Lovable.dev (AI UI Generator).

---

## Folder Structure
\`\`\`
src/
├── components/
│   ├── auth/
│   │   └── Login.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   └── Analytics.tsx
│   ├── booking/
│   │   ├── ClassGrid.tsx
│   │   └── RecoveryScheduler.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Dialog.tsx
├── lib/
│   └── supabaseClient.ts
├── types/
│   └── index.ts
├── main.tsx
└── App.tsx
\`\`\`

---

## Installation & How to Run
1. **Clone the Repository:**
   \`git clone https://github.com/collective/anchor-wellness.git && cd anchor-wellness\`
2. **Install Dependencies:**
   \`npm install\`
3. **Configure Environment Variables:**
   Create a \`.env.local\` file in the root directory:
   \`\`\`
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`
4. **Run Development Server:**
   \`npm run dev\`
5. **Build for Production:**
   \`npm run build\`

---

## Backend & Database Setup
Initialize the Postgres database schema by executing the following DDL in your Supabase SQL Editor:
\`\`\`sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Members profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  membership_tier text default 'basic' check (membership_tier in ('basic', 'collective', 'ultimate')),
  membership_status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create RLS Policies
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
\`\`\`

---

## Deployment & Hosting Guide
- **Frontend Hosting:** Vercel or Netlify is highly recommended for Vite-based React frontends. Connect your GitHub repository to trigger automatic branch previews on push.
- **CI/CD Integration:** Set up GitHub Actions for automated linting and unit testing before merges to main.
- **Production Checklist:** Enable Supabase SSL connections, configure database backups, and set up Google My Business indexing on the frontend landing page.

---

## Security & Performance Optimization
- **Row Level Security (RLS):** Ensure RLS is active on all tables. Never access tables directly without checking auth state.
- **Assets Optimization:** Compress all landing page photos to WebP format, lazy load route components using React.lazy, and bundle fonts locally.
- **Security Check:** Set CORS origins to allow requests only from your production domain name inside Supabase API Settings.`,
      deliverables: []
    },
    pitch: {
      executiveSummary: "We're building the simplest way for small businesses to automate their operations using AI.",
      slides: [
        { title: "Anchor Wellness Collective", content: "Reclaiming the Third Space through Holistic Fitness & Community Contrast Therapy.", speakerNotes: "Welcome everyone. Today we are presenting the next evolution of local health hubs.", keyMetric: "350 Capped", keyMetricLabel: "Memberships" },
        { title: "The Agenda", content: "- The Local Health Space Opportunity\\n- The Problem: Churn & Isolation\\n- Our Hybrid Solution\\n- Facility Architecture\\n- Tech Stack & App Flow\\n- Financial Forecast & Growth Roadmap", speakerNotes: "Here is what we will walk through today.", keyMetric: "15 Slides", keyMetricLabel: "Comprehensive Overview" },
        { title: "The Problem", content: "- Modern commercial gyms are overcrowded, transactional, and suffer from high member churn (60%+ annually).\\n- Boutique studios are expensive and lack community, forcing members to leave immediately after training.\\n- Remote workers are isolated, lacking third-spaces to connect without bar environments.", speakerNotes: "The commercial gym space is broken. Operators focus on low costs and overselling.", keyMetric: "60%+", keyMetricLabel: "Annual Churn" },
        { title: "Market Opportunity", content: "- Wellness economy is valued at $5.6T.\\n- Shift towards local neighborhood services due to remote/hybrid working models.\\n- 85% of Gen Z and Millennials prefer boutique experience over commercial chains.", speakerNotes: "A huge demographic is searching for something better.", keyMetric: "$5.6T", keyMetricLabel: "Wellness Market" },
        { title: "Existing Solutions", content: "- Budget Gyms: Low cost, overcrowded, transactional, zero community.\\n- Luxury Clubs: Extremely expensive, centralized locations, lack hyper-local feel.\\n- Coworking Spaces: Good for work, lack health, wellness, and fitness integration.", speakerNotes: "Current solutions fail to bridge fitness, recovery, and connection.", keyMetric: "0 Tech", keyMetricLabel: "Community Alignment" },
        { title: "Gap Analysis", content: "There is no local player combining strength training, dedicated hot-cold contrast therapy chambers, and remote work seating with capped membership, leaving a high-demand premium tier underserved.", speakerNotes: "This represents our primary market entry point.", keyMetric: "Capped 350", keyMetricLabel: "Market Gap Fill" },
        { title: "Our Solution", content: "- Anchor Wellness Collective: A neighborhood third-space.\\n- Functional strength training classes led by expert coaches.\\n- Premium recovery suite featuring infrared saunas and cold plunges.\\n- Social lounge with fast Wi-Fi and healthy cafe choices.", speakerNotes: "We combine fitness, recovery, and work into a single hub.", keyMetric: "3-in-1", keyMetricLabel: "Unified Space" },
        { title: "Facility Architecture", content: "- Capped capacity of 350 members ensures zero wait times.\\n- Zone A (60%): Functional workout floor.\\n- Zone B (20%): Sauna, plunge, and locker rooms.\\n- Zone C (20%): Welcome desk and coworking social lounge.", speakerNotes: "Our facility layout is optimized for community integration.", keyMetric: "3,500 sq ft", keyMetricLabel: "Aesthetic Hub" },
        { title: "Technology Stack", content: "- Frontend mobile app built with React & Tailwind for simple reservations.\\n- Backend managed by Supabase for instantaneous database updates and auth.\\n- Automated SMS reminders and class progression tracking.", speakerNotes: "Our tech stack guarantees high user engagement.", keyMetric: "Vite + React", keyMetricLabel: "Modern Tech" },
        { title: "Workflow", content: "1. Member books contrast session on the custom app\\n2. Smart lock opens locker and recovery room\\n3. Contrast session completed; check-in at coworking lounge\\n4. Automatic feedback loops track progress", speakerNotes: "The member experience is entirely frictionless.", keyMetric: "4 Steps", keyMetricLabel: "Frictionless Flow" },
        { title: "Features", content: "- Real-time class capacity booking\\n- Contrast room temperature custom settings\\n- Member social messaging boards\\n- Longevity biometric progress dashboard", speakerNotes: "We offer feature sets that traditional gym goers can only dream of.", keyMetric: "1 Tap", keyMetricLabel: "Booking App" },
        { title: "Live Demo", content: "- Mobile Class Booking Flow: Select class, view trainer profile, reserve spot.\\n- Recovery Suite Entry: Smart key integration, temperature monitor.", speakerNotes: "Let's look at the actual prototype interface.", keyMetric: "5 sec", keyMetricLabel: "Booking Speed" },
        { title: "Competitive Analysis", content: "Our capped member cap enables us to focus 100% on premium retention. While commercial gyms spend heavily on acquisition, our customer acquisition cost is offset by member-to-member referral programs.", speakerNotes: "Our metrics are fundamentally better than high-turn models.", keyMetric: "3x Lower", keyMetricLabel: "Acquisition Cost" },
        { title: "Business Model", content: "- Collective Tier: $149/month (includes group classes, coworking access, and 4 recovery sessions).\\n- Longevity Tier: $229/month (unlimited strength + recovery access).\\n- Secondary: Retail sales, workshops, and corporate packages.", speakerNotes: "We project operational profitability in month 5.", keyMetric: "28%", keyMetricLabel: "Operating Margin" },
        { title: "Conclusion & Ask", content: "We are raising $250,000 to finalize the pilot location build-out and launch marketing. Join us in reclaiming the neighborhood third space.", speakerNotes: "Thank you. I will open the floor to any questions.", keyMetric: "$250K Ask", keyMetricLabel: "Seed Round" }
      ],
      deliverables: [],
      detailedReport: `# Master Investor Pitch Strategy & Presentation Script

## Slide-by-Slide Script & Presenter Cues

### Slide 1: Cover (Anchor Wellness Collective)
*   **Slide Visual:** Warm minimalist background with brand logo.
*   **Presenter Script:** "Good morning. My name is [Name], and today I am introducing Anchor Wellness Collective: the future of neighborhood third-spaces. We are combining functional training, premium recovery contrast rooms, and coworking lounges into a unified capped-membership hub."

---

### Slide 2: The Agenda
*   **Presenter Script:** "Today, we'll walk through the fitness industry gap, our unique hybrid solution, our facility design, backend tech stack, and our financial projections."

---

### Slide 3: The Problem (Loneliness & Gym Churn)
*   **Presenter Script:** "Traditional gyms oversell. They rely on you not showing up. They are crowded, transactional, and experience a massive 60% annual churn rate. People are looking for a space to belong."

---

### Slide 4: Market Opportunity (The Shift to Local)
*   **Presenter Script:** "With the hybrid remote-work models, consumers are spending their days in residential neighborhoods rather than city hubs. The wellness economy is $5.6T, and customers are demanding premium boutique experiences."

---

### Slide 5: Existing Solutions (Competitive Landscape)
*   **Presenter Script:** "Commercial chains are cheap but overcrowded. Luxury hubs are too expensive and centralized. We occupy the middle ground—high hospitality, capped capacity, right in the neighborhood."

---

### Slide 6: Gap Analysis
*   **Presenter Script:** "Our primary insight is simple: there is no local player combining strength training, dedicated hot-cold contrast therapy chambers, and remote work seating with capped membership, leaving a high-demand premium tier underserved."

---

### Slide 7: Our Solution (The Collective Experience)
*   **Presenter Script:** "Anchor Wellness Collective is that third-space. Fitness, recovery contrast rooms, and workspaces, unified under a capped membership of 350 to ensure no crowds."

---

### Slide 8: Facility Design & Zones
*   **Presenter Script:** "We need 3,500 square feet. 60% is functional strength gym space, 20% is recovery contrast suites, and 20% is welcome reception and social workspace."

---

### Slide 9: Tech Stack & App Integration
*   **Presenter Script:** "Our custom application allows members to book classes, reserve recovery rooms, and track biometrics. It keeps member engagement high."

---

### Slide 10: Member Experience Flow
*   **Presenter Script:** "Booking, facility entry, and checking in is completely frictionless, managed via our backend app connected to smart locks."

---

### Slide 11: Feature Highlights
*   **Presenter Script:** "Features include real-time class booking, recovery temperature customization, and social community message boards."

---

### Slide 12: Live Demo Walkthrough
*   **Presenter Script:** "Let's walk through a 5-second reservation flow. Select a class, tap book contrast therapy session, and secure your spot."

---

### Slide 13: Competitive Advantage (Retention focus)
*   **Presenter Script:** "Because we cap memberships, we focus on member satisfaction rather than constant marketing acquisition. Retention is 3x higher than budget chains."

---

### Slide 14: Business Model & Margins
*   **Presenter Script:** "We offer two main tiers: Collective Access at $149/mo and Ultimate Longevity at $229/mo. We forecast operational break-even by month 5."

---

### Slide 15: Conclusion & Ask
*   **Presenter Script:** "We are raising $250,000 for facility buildout and marketing. We invite you to join us in building the pilot neighborhood hub."`
    }
  };

  return mocks[agentId] || mocks.research;
}

// ===== Main Generation Function =====

export async function generateAgentResponse(
  agentId: string,
  prompt: string,
  context?: string
): Promise<AgentResult<unknown>> {
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.research;
  const temperature = (agentId === 'research' || agentId === 'strategy') ? 0.3 : 0.6;

  // Build messages
  const messages: Array<{role: string; content: string}> = [
    { role: 'system', content: systemPrompt },
  ];

  let fullUserPrompt = prompt;
  if (context) {
    fullUserPrompt = `Context from previous agents:\n${context}\n\n---\n\n${prompt}`;
  }
  messages.push({ role: 'user', content: fullUserPrompt });

  // Provider chain: Gemini first (free, high quality), OpenRouter fallback
  const providers = [
    { name: 'Gemini', fn: () => callWithRetry(() => callGemini(systemPrompt, fullUserPrompt, temperature), MAX_RETRIES_PER_PROVIDER) },
    { name: 'OpenRouter', fn: () => callWithRetry(() => callOpenRouter(messages, temperature), MAX_RETRIES_PER_PROVIDER) },
  ];

  for (const provider of providers) {
    try {
      const raw = await provider.fn();
      const cleaned = cleanJsonResponse(raw);

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.warn(`[COMET] ${provider.name} returned invalid JSON, trying next provider`);
        continue;
      }

      if (!validateAgentOutput(agentId, parsed)) {
        console.warn(`[COMET] ${provider.name} returned malformed output for ${agentId}, trying next`);
        continue;
      }

      console.log(`[COMET] ✅ ${agentId} output validated from ${provider.name}`);
      return {
        success: true,
        data: parsed,
        provider: provider.name,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`[COMET] ${provider.name} exhausted for ${agentId}:`, error instanceof Error ? error.message : error);
      // If rate limited, wait before trying next provider
      if (error instanceof Error && error.message.includes('429')) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  // All providers failed — return mock fallback (never leave user with nothing)
  console.warn(`[COMET] All providers failed for ${agentId}. Using mock fallback.`);
  const mockData = getMockFallback(agentId);

  return {
    success: false,
    data: mockData,
    error: 'All AI providers failed. Showing sample data — click Regenerate to try again.',
    provider: 'mock',
    timestamp: new Date().toISOString(),
  };
}
