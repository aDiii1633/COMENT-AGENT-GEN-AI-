// ============================================================
// COMET Civic Intelligence — LLM Engine with Retry, Timeout & Validation
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

const CITIZEN_INSIGHTS_PROMPT = `You are the COMET Citizen Insights Agent. You analyze citizen complaints, cluster feedback, identify recurring themes, and summarize submissions for Members of Parliament.
You MUST respond with ONLY a valid JSON object (no markdown fences, no explanation). Match this exact structure:
{
  "executiveSummary": "Ward 5 has received 342 citizen complaints over the past quarter, with road infrastructure and water supply being the dominant themes...",
  "issueSeverity": "Road infrastructure degradation affects 68% of reported complaints, with 12 villages reporting impassable conditions during monsoon...",
  "urgencyLevel": "High",
  "citizenSatisfaction": 34,
  "topThemes": [
    { "theme": "Road Repair", "frequency": "142 complaints", "affectedArea": "Ward 5, 7, 12" }
  ],
  "complaintCategories": [{ "label": "Roads", "value": 40 }, { "label": "Water", "value": 30 }, { "label": "Schools", "value": 30 }],
  "recurringIssues": ["Issue 1 with detailed explanation", "Issue 2...", "Issue 3...", "Issue 4...", "Issue 5..."],
  "affectedDemographics": ["Demographic 1: highly specific details", "Demographic 2...", "Demographic 3..."],
  "keyRisks": ["Risk 1: detailed mitigation strategy", "Risk 2...", "Risk 3..."],
  "detailedReport": "# Comprehensive Citizen Insights Report\\n\\n## Introduction\\n..."
}
Generate highly detailed, exhaustive data based on the user's civic query. Generate at least 5 themes, 5 recurring issues, 3 demographics, and 3 risks.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, structured into: Introduction, Complaint Analysis, Theme Clustering, Demographic Impact, Severity Assessment, Trend Analysis, Ward-wise Breakdown, Risk Factors, Recommendations, Action Items, Summary. Write everything out in full.`;

const DEVELOPMENT_PLANNING_PROMPT = `You are the COMET Development Planning Agent. You analyze infrastructure gaps, compare development proposals, generate implementation priorities, and recommend district planning for MPs.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "districtName": "Prakasam District Development Plan",
  "visionStatement": "Transform rural infrastructure through data-driven prioritization and citizen-centric development.",
  "keyObjective": "Address critical infrastructure gaps in roads, water supply, and healthcare facilities across 15 wards by prioritizing high-impact, citizen-demanded projects within available budget allocations.",
  "infrastructureGaps": ["Detailed Gap 1...", "Gap 2...", "Gap 3...", "Gap 4...", "Gap 5...", "Gap 6..."],
  "proposedProjects": ["Project 1...", "Project 2...", "Project 3...", "Project 4...", "Project 5...", "Project 6..."],
  "implementationChannels": ["Channel 1...", "Channel 2...", "Channel 3...", "Channel 4...", "Channel 5...", "Channel 6..."],
  "budgetAllocation": ["Allocation 1...", "Allocation 2...", "Allocation 3...", "Allocation 4...", "Allocation 5..."],
  "keyMilestones": ["Month 1: specific goal", "Month 3: specific goal", "Month 6...", "Year 1..."],
  "priorityActions": ["Action 1: detailed execution plan", "Action 2...", "Action 3...", "Action 4...", "Action 5..."],
  "detailedReport": "# Comprehensive Development Plan\\n\\n## Overview\\n..."
}
Generate exhaustive, highly detailed data based on the user's civic development query. Generate at least 6 items for gaps, projects, and channels.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown covering Development Strategy, Infrastructure Assessment, Budget Framework, Implementation Timeline, Risk Mitigation, Stakeholder Engagement, Monitoring & Evaluation, Ward Priorities, Summary, Next Steps. Write everything out in full.`;

const COMMUNICATION_PROMPT = `You are the COMET Communication Agent. You generate multilingual public notices, citizen announcements, social media updates, government reports, press releases, ward updates, and meeting summaries for MPs.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "executiveSummary": "2-3 sentence communication strategy summary for civic engagement",
  "channels": [
    {
      "channel": "Public Notice",
      "entries": [
        {
          "title": "Notice title",
          "body": "Full notice text",
          "audience": "Target audience",
          "language": "English",
          "urgencyTag": "High",
          "tags": ["#RoadRepair", "#Ward5"],
          "keyMessage": "Core message to communicate",
          "actionRequired": "What citizens should do",
          "formalVersion": "Formal government-style version",
          "simplifiedVersion": "Simple citizen-friendly version",
          "charCount": 235,
          "score": 88
        }
      ]
    }
  ],
  "detailedReport": "# Comprehensive Communication Plan\\n\\n## Overview\\n..."
}
Generate communications for ALL of these channels: Public Notice, Press Release, Social Media Post, Ward Update, Meeting Summary, Government Report, Citizen Advisory, SMS Alert.
Each channel MUST have exactly 3 entries with deeply detailed, context-specific content.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, including Communication Calendar, Translation Guidelines, Accessibility Plan, and Distribution Strategy.`;

const PUBLIC_DATA_PROMPT = `You are the COMET Public Data Intelligence Agent. You analyze government datasets including demographics, schools, roads, hospitals, population data, and public infrastructure, then merge findings with citizen requests to generate actionable insights.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "dataOverview": "Analysis of 14 government datasets covering infrastructure, demographics, and public services across the district...",
  "infrastructureAnalysis": "The district has 847 km of roads, of which 34% are in poor condition...",
  "dataSources": [
    { "name": "Census India", "description": "Population & Demographics", "url": "https://censusindia.gov.in" },
    { "name": "Data.gov.in", "description": "Open Government Data Platform", "url": "https://data.gov.in" }
  ],
  "demographicBreakdown": "...",
  "schoolsAnalysis": "...",
  "roadsAnalysis": "...",
  "hospitalsAnalysis": "...",
  "populationInsights": "...",
  "waterSupplyAnalysis": "...",
  "electricityAnalysis": "...",
  "geoMappingData": "...",
  "sanitationAnalysis": "...",
  "connectivityAnalysis": "...",
  "budgetUtilization": "...",
  "governmentSchemes": "...",
  "detailedReport": "# Comprehensive Public Data Analysis\\n\\n## Data Sources Overview\\n..."
}
Generate realistic, detailed civic data analysis for the user's query.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, covering: Data Sources, Demographic Analysis, Infrastructure Status, Health & Education, Budget Analysis, Geo-Mapping Insights, Correlation Analysis, Recommendations, Summary. Write everything in full detail.`;

const RECOMMENDATION_PROMPT = `You are the COMET Recommendation Agent. You rank development projects, generate MP reports with priority scores, budget estimates, and executive summaries with action recommendations.
You MUST respond with ONLY a valid JSON object (no markdown fences). Match this exact structure:
{
  "executiveSummary": "2-3 sentence executive summary of top priority recommendations for the MP",
  "recommendations": [
    { "projectName": "Ward 5 Road Rehabilitation", "priorityScore": "92/100", "budgetEstimate": "₹2.4 Cr", "budgetEstimateLabel": "Estimated Cost", "impactSummary": "Markdown content describing impact, beneficiaries, and timeline", "implementationNotes": "Implementation strategy and phasing notes", "urgencyLabel": "Critical" },
    { "projectName": "Primary Health Center Upgrade", "priorityScore": "87/100", "budgetEstimate": "₹1.8 Cr", "budgetEstimateLabel": "Estimated Cost", "impactSummary": "...", "implementationNotes": "...", "urgencyLabel": "High" }
  ],
  "detailedReport": "# Comprehensive Recommendation Report\\n\\n## Methodology\\n..."
}
Generate exactly 15 highly detailed, compelling, distinct project recommendations. The recommendations MUST cover: Roads, Water Supply, Healthcare, Education, Sanitation, Electricity, Digital Connectivity, Agriculture, Housing, Public Transport, Women & Child Welfare, Senior Citizen Services, Skill Development, Environmental Protection, and Community Infrastructure. Include Priority Scores, Budget Estimates, Impact Analysis, and Implementation Notes.
CRITICAL: You MUST include a 'detailedReport' string containing a massive, expert-level 1000+ word deep-dive report formatted in Markdown, including Scoring Methodology, Budget Justification, Risk Assessment, Implementation Roadmap, and Monitoring Framework.`;

export const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  research: CITIZEN_INSIGHTS_PROMPT,
  strategy: DEVELOPMENT_PLANNING_PROMPT,
  content: COMMUNICATION_PROMPT,
  development: PUBLIC_DATA_PROMPT,
  pitch: RECOMMENDATION_PROMPT,
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
      'X-Title': 'COMET Civic Intelligence',
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
      return !!(data.executiveSummary && data.issueSeverity && data.urgencyLevel && Array.isArray(data.recurringIssues));
    case 'strategy':
      return !!(data.districtName && data.keyObjective && Array.isArray(data.infrastructureGaps) && Array.isArray(data.keyMilestones));
    case 'content':
      return !!(data.executiveSummary && data.channels && Array.isArray(data.channels));
    case 'development':
      return !!(data.dataOverview && data.infrastructureAnalysis && Array.isArray(data.dataSources));
    case 'pitch':
      return !!(data.executiveSummary && data.recommendations && Array.isArray(data.recommendations));
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
      executiveSummary: "Ward 5 has received 342 citizen complaints over the past quarter. Road infrastructure and water supply dominate the complaint landscape, accounting for 68% of all submissions. Urgent intervention is required in 3 villages where roads become impassable during monsoon season, directly affecting 12,000+ residents.",
      issueSeverity: "Road infrastructure degradation affects 68% of reported complaints, with 12 villages reporting impassable conditions during monsoon. Water supply disruptions impact 8,500 households with intermittent supply averaging 2 hours per day against the mandated 4 hours.",
      urgencyLevel: "High",
      citizenSatisfaction: 34,
      topThemes: [
        { theme: "Road Repair & Maintenance", frequency: "142 complaints", affectedArea: "Ward 5, 7, 12 — Villages: Kondapuram, Markapuram, Yerragondapalem" },
        { theme: "Drinking Water Supply", frequency: "89 complaints", affectedArea: "Ward 3, 5, 8 — Bore wells non-functional in 6 hamlets" },
        { theme: "Primary Healthcare Access", frequency: "54 complaints", affectedArea: "Ward 9, 11 — No PHC within 15km radius" },
        { theme: "School Infrastructure", frequency: "38 complaints", affectedArea: "Ward 2, 4 — 12 schools without proper roofing" },
        { theme: "Sanitation & Drainage", frequency: "19 complaints", affectedArea: "Ward 1, 6 — Open drainage causing waterborne diseases" }
      ],
      complaintCategories: [{ label: "Roads", value: 42 }, { label: "Water", value: 26 }, { label: "Healthcare", value: 16 }, { label: "Schools", value: 11 }, { label: "Sanitation", value: 5 }],
      recurringIssues: [
        "Pothole-ridden state highway connecting Kondapuram to district headquarters — 23km stretch with no maintenance in 3 years, causing 14 reported vehicle accidents",
        "Intermittent water supply in Ward 5 hamlets — bore wells dried up due to falling water table, hand pump installations pending since 2024",
        "Primary Health Center in Markapuram operates without a resident doctor — nearest hospital 28km away, emergency cases require costly private ambulance transport",
        "Government primary schools in Ward 2 lack functional toilets — leading to 40% dropout rate among girls after Class 5",
        "Open drainage channels in Ward 1 overflow during monsoon — raw sewage enters residential areas, causing repeated cholera and dengue outbreaks"
      ],
      affectedDemographics: [
        "Agricultural laborers (age 25-55) comprising 62% of the working population — road damage prevents produce transport to mandis, causing 15-20% post-harvest losses",
        "Women and children in rural hamlets — forced to walk 2-3 km daily for water collection, with children missing school during summer months",
        "Senior citizens (age 60+) in remote villages — lack of nearby healthcare facilities means treatable conditions become emergencies"
      ],
      keyRisks: [
        "Monsoon season (July-September) will render 34 km of kutcha roads completely impassable, isolating 8 villages from emergency services",
        "Water table depletion accelerating — without rainwater harvesting intervention, 12 hamlets face complete groundwater exhaustion within 2 years",
        "Healthcare staff retention critically low — 3 of 5 PHC doctor positions vacant for 18+ months due to remote posting disincentives"
      ],
      detailedReport: `# Comprehensive Citizen Insights Report: Ward-Level Analysis

## Introduction
This report presents a thorough analysis of citizen complaints, feedback submissions, and recurring development themes across the constituency. Data has been aggregated from 342 individual submissions received through voice calls, written applications, WhatsApp messages, and gram sabha minutes over the past quarter.

---

## Complaint Analysis
The complaint distribution reveals a clear pattern of infrastructure neglect. Roads account for 42% of all complaints, followed by water supply (26%), healthcare access (16%), school infrastructure (11%), and sanitation (5%). Notably, 78% of road-related complaints originate from just 3 wards (5, 7, and 12), indicating a concentrated infrastructure crisis.

### Complaint Volume by Month
| Month | Total Complaints | Roads | Water | Healthcare | Schools | Sanitation |
|:---|:---|:---|:---|:---|:---|:---|
| April | 98 | 45 | 22 | 18 | 8 | 5 |
| May | 112 | 48 | 31 | 15 | 12 | 6 |
| June | 132 | 49 | 36 | 21 | 18 | 8 |

The upward trend (35% increase from April to June) correlates with the pre-monsoon period when infrastructure vulnerabilities become acutely visible.

---

## Theme Clustering
Using natural language processing on citizen submissions, five dominant clusters emerge:

1. **Road Connectivity Crisis**: Citizens from Kondapuram, Markapuram, and surrounding villages consistently report dangerous road conditions. The state highway connecting these areas to the district headquarters has not received maintenance funding in 3 years. Specific complaints mention potholes exceeding 2 feet in depth, missing culverts, and complete road washouts during heavy rain.

2. **Water Scarcity Emergency**: Six hamlets in Ward 5 report bore well failures. The groundwater table has dropped by 15 meters over the past decade. Hand pump installations approved in the 2024-25 budget remain unexecuted. Women report walking 2-3 km daily for water collection.

3. **Healthcare Desert**: Two wards (9 and 11) have no Primary Health Center within a 15 km radius. The existing PHC in Markapuram operates without a permanent doctor, relying on a visiting physician available only 2 days per week. Emergency cases require private ambulance transport costing ₹2,000-5,000.

4. **Education Infrastructure Decay**: Twelve government primary schools across Wards 2 and 4 lack weather-proof roofing. During monsoon, classes are suspended for an average of 30 days. The absence of functional toilets in 8 schools contributes to a 40% dropout rate among girls after Class 5.

5. **Sanitation Hazards**: Open drainage systems in Ward 1 and 6 overflow during monsoon, introducing raw sewage into residential areas. Three cholera outbreaks and recurring dengue cases have been documented in the past 18 months.

---

## Demographic Impact
The complaints disproportionately affect three vulnerable groups:
- **Agricultural workers** lose 15-20% of produce value due to road inaccessibility to market mandis
- **Women and girls** bear the burden of water collection and education dropout
- **Elderly residents** face life-threatening delays in accessing emergency healthcare

---

## Severity Assessment
Based on a composite scoring of urgency (citizen demand volume), population impact (affected households), and infrastructure gap magnitude, the overall constituency development urgency is rated **HIGH** with a citizen satisfaction index of **34/100**.

---

## Recommendations
1. Immediate road repair of the 23 km Kondapuram-HQ highway under PMGSY or state highway maintenance funds
2. Emergency bore well rehabilitation and rainwater harvesting structures in Ward 5
3. Recruitment drive for PHC medical officers with rural posting incentives
4. School infrastructure repair under Samagra Shiksha Abhiyan funds
5. Closed drainage system construction in Ward 1 and 6 under SBM-G Phase II

---

## Summary
The constituency faces a multi-dimensional infrastructure crisis concentrated in specific wards. Data-driven prioritization, combined with convergence of central and state scheme funds, can address the most critical citizen demands within 12-18 months. Immediate MP intervention is recommended for road and water supply projects that impact the largest number of citizens.`,
      deliverables: []
    },
    strategy: {
      districtName: "Prakasam District Development Plan",
      visionStatement: "Transform rural infrastructure through data-driven prioritization and citizen-centric governance.",
      keyObjective: "Address critical infrastructure gaps in roads, water supply, and healthcare facilities across 15 wards by prioritizing high-impact, citizen-demanded projects within available MPLADS, state, and central scheme budget allocations over a 24-month implementation window.",
      infrastructureGaps: [
        "Roads: 34% of district roads in poor condition — 23 km state highway and 67 km of internal village roads require immediate repair or reconstruction.",
        "Water Supply: 6 hamlets without functional bore wells — groundwater table dropped 15m in a decade, hand pump installations pending since 2024 budget approval.",
        "Healthcare: 2 wards (9, 11) classified as healthcare deserts — no PHC within 15 km, 3 of 5 doctor positions vacant for 18+ months.",
        "Education: 12 primary schools without weatherproof roofing — 8 schools lack functional toilets, contributing to 40% girl dropout after Class 5.",
        "Sanitation: Open drainage in Ward 1 and 6 — raw sewage overflow during monsoon, 3 cholera outbreaks in 18 months.",
        "Digital Connectivity: 4 gram panchayats without mobile network coverage — no internet access for e-governance services or digital education."
      ],
      proposedProjects: [
        "PMGSY Road Rehabilitation: Reconstruct 23 km Kondapuram-HQ highway with drainage, culverts, and road markings — estimated ₹8.5 Cr from central funds.",
        "Jal Jeevan Mission Extension: Install 12 new bore wells and 3 overhead tanks in Ward 5 hamlets — estimated ₹2.1 Cr under JJM convergence.",
        "PHC Upgrade Program: Construct 2 new sub-health centers in Ward 9 and 11, recruit 3 MBBS doctors with rural incentive packages — ₹3.2 Cr.",
        "School Infrastructure Revival: Repair roofing for 12 schools, construct toilet blocks in 8 schools under Samagra Shiksha — ₹1.8 Cr.",
        "Closed Drainage Network: Replace open drains in Ward 1 and 6 with covered drainage under SBM-G Phase II — ₹2.5 Cr.",
        "Digital Village Initiative: Install 4 mobile towers and establish 6 Common Service Centers for e-governance — ₹1.2 Cr under BharatNet."
      ],
      implementationChannels: [
        "MPLADS Fund: Direct allocation of ₹5 Cr/year for constituency-level projects — prioritize water and school infrastructure.",
        "State Highway Department: Coordinate with PWD for highway rehabilitation under state road maintenance budget.",
        "Jal Jeevan Mission: Leverage central scheme for piped water supply — convergence with NREGA for labor component.",
        "District Collector Office: Monthly review meetings with block development officers for project monitoring.",
        "Gram Panchayat Partnership: Engage local self-government bodies for land acquisition, community contribution, and maintenance.",
        "CSR Partnerships: Engage local industries for school adoption and digital infrastructure sponsorship."
      ],
      budgetAllocation: [
        "Road Infrastructure: ₹8.5 Cr (44%) — PMGSY central fund + state PWD maintenance budget convergence.",
        "Water Supply: ₹2.1 Cr (11%) — Jal Jeevan Mission + MPLADS top-up for hand pump rehabilitation.",
        "Healthcare: ₹3.2 Cr (17%) — State health department + National Health Mission rural incentive scheme.",
        "Education: ₹1.8 Cr (9%) — Samagra Shiksha Abhiyan + district education fund.",
        "Sanitation: ₹2.5 Cr (13%) — Swachh Bharat Mission-Gramin Phase II + NREGA convergence."
      ],
      keyMilestones: [
        "Month 1: Submit MPLADS project proposals and convene district-level review with collector.",
        "Month 3: Complete DPR preparation for road rehabilitation and water supply projects.",
        "Month 6: Begin construction on priority road segments and bore well installations.",
        "Month 12: Complete Phase 1 — road rehabilitation, 8 bore wells operational, 2 PHC staff recruited.",
        "Month 18: Complete school repairs, drainage network in Ward 1, digital connectivity in 2 panchayats.",
        "Year 2: Full project completion, monitoring dashboard live, citizen satisfaction re-survey."
      ],
      priorityActions: [
        "Immediate: Convene emergency meeting with district collector to expedite pending bore well installations in Ward 5 — target completion within 60 days.",
        "Week 2: Write to state PWD secretary requesting emergency road maintenance fund release for Kondapuram highway — cite accident data and citizen petitions.",
        "Month 1: Submit MPLADS proposals for school toilet construction and PHC equipment — fast-track approval through speaker's office.",
        "Month 2: Launch 'Jan Sunwai' (public hearing) series in affected wards to gather updated citizen priorities and build community ownership.",
        "Month 3: Establish ward-level monitoring committees with gram panchayat presidents to track project execution and fund utilization."
      ],
      detailedReport: `# Comprehensive Development Plan: Prakasam District

## Executive Summary & Strategic Position
The Prakasam District Development Plan is positioned to address the acute infrastructure deficit affecting 15 wards and approximately 2.8 lakh citizens. By leveraging convergence of MPLADS funds, central government schemes (PMGSY, JJM, SBM-G, SSA), and state department budgets, the plan targets ₹19.3 Cr in total investment over a 24-month implementation window. The core strategy prioritizes high-citizen-demand projects with maximum population impact.

---

## 24-Month Execution Roadmap
- **Q1 (Planning & Approvals):** Submit all DPRs, convene district review, expedite pending bore well orders, launch Jan Sunwai series.
- **Q2 (Phase 1 Construction):** Begin road rehabilitation (23 km highway), install first 8 bore wells, recruit PHC doctors.
- **Q3 (Parallel Execution):** Launch school repairs, drainage construction in Ward 1, establish monitoring committees.
- **Q4 (Phase 1 Completion):** Complete highway rehabilitation, all bore wells operational, first PHC fully staffed.
- **Q5-Q6 (Phase 2):** Internal village road repairs, digital connectivity installations, remaining school infrastructure.
- **Q7-Q8 (Completion & Review):** Full project completion, citizen satisfaction re-survey, monitoring dashboard deployment.

---

## Key Performance Indicators
- **Road Accessibility:** Target 95% of village roads in good/fair condition (currently 66%)
- **Water Supply Hours:** Target 4 hours/day minimum (currently 2 hours intermittent)
- **Healthcare Distance:** Target PHC within 10 km for all residents (currently 15+ km for 2 wards)
- **School Attendance:** Target 85% attendance rate (currently 72% due to infrastructure issues)
- **Citizen Satisfaction:** Target 65/100 (currently 34/100)

---

## Budget & Financial Framework
| Category | Budget (₹ Cr) | Funding Source | Timeline |
|:---|:---|:---|:---|
| Road Infrastructure | 8.5 | PMGSY + State PWD | Months 3-12 |
| Water Supply | 2.1 | Jal Jeevan Mission + MPLADS | Months 2-8 |
| Healthcare | 3.2 | NHM + State Health Dept | Months 1-12 |
| Education | 1.8 | Samagra Shiksha + District Fund | Months 4-15 |
| Sanitation | 2.5 | SBM-G Phase II + NREGA | Months 6-18 |
| Digital Connectivity | 1.2 | BharatNet + CSR | Months 8-20 |

---

## Risk Management
1. **Fund Release Delays:** Mitigation: Pre-submit utilization certificates for previous MPLADS allocation; maintain buffer timeline of 3 months.
2. **Contractor Quality Issues:** Mitigation: Implement third-party quality audits at 25%, 50%, and 75% completion stages.
3. **Doctor Recruitment Failure:** Mitigation: Offer rural posting incentives (25% salary premium + housing) and approach state medical colleges for compulsory rural service placements.
4. **Monsoon Disruption:** Schedule all road construction for October-May dry season; use monsoon period for DPR preparation and procurement.`,
      deliverables: []
    },
    content: {
      executiveSummary: "A comprehensive multi-channel civic communication strategy designed to keep citizens informed about ongoing development works, upcoming projects, and government initiatives across the constituency.",
      channels: [
        {
          channel: "Public Notice",
          entries: [
            {
              title: "Notice: Ward 5 Road Rehabilitation — Traffic Advisory",
              body: "Citizens of Ward 5 are hereby informed that road rehabilitation work on the Kondapuram-HQ highway (23 km stretch) will commence from 15th October 2026 under PMGSY guidelines. The project is estimated to complete within 6 months. During construction, alternate route via Markapuram bypass is advised. For complaints or information, contact the Ward Office at 1800-XXX-XXXX.",
              audience: "Residents of Ward 5, 7, and 12; daily commuters; commercial vehicle operators",
              language: "English",
              urgencyTag: "Important",
              tags: ["#RoadRepair", "#Ward5", "#PMGSY", "#TrafficAdvisory"],
              keyMessage: "Road repair starting October 15 — use alternate route via Markapuram bypass",
              actionRequired: "Plan alternate travel routes; report construction issues to Ward Office helpline",
              formalVersion: "The Honorable Member of Parliament's office, in coordination with the District Collector and PWD, announces the commencement of PMGSY-funded road rehabilitation works on NH-segment Kondapuram-HQ. Citizens are requested to cooperate during the construction period.",
              simplifiedVersion: "Good news! Our Ward 5 road is getting fixed starting October 15. It will take about 6 months. Please use the Markapuram bypass road during this time. Call 1800-XXX-XXXX if you have any problems.",
              charCount: 420,
              score: 92
            }
          ]
        },
        {
          channel: "Press Release",
          entries: [
            {
              title: "MP Announces ₹19.3 Cr Development Package for Prakasam District",
              body: "The Honorable Member of Parliament today announced a comprehensive ₹19.3 Crore development package for Prakasam District, covering road infrastructure (₹8.5 Cr), water supply (₹2.1 Cr), healthcare (₹3.2 Cr), education (₹1.8 Cr), sanitation (₹2.5 Cr), and digital connectivity (₹1.2 Cr). The package converges MPLADS funds with central schemes including PMGSY, Jal Jeevan Mission, and Swachh Bharat Mission-Gramin to maximize impact. Speaking at the announcement, the MP said: 'Every rupee will be tracked through a public monitoring dashboard. Citizens can see exactly where their tax money is being spent.'",
              audience: "Media houses, district administration, state government officials, general public",
              language: "English",
              urgencyTag: "Newsworthy",
              tags: ["#DevelopmentPackage", "#MPLADS", "#PrakasamDistrict"],
              keyMessage: "₹19.3 Cr multi-sector development package announced with full transparency",
              actionRequired: "Media: Cover the announcement; Citizens: Track projects on monitoring dashboard",
              formalVersion: "Press Release No. MP/PD/2026/47 — For Immediate Release — The Office of the Member of Parliament, Prakasam Constituency...",
              simplifiedVersion: "Big news! Our MP has approved ₹19.3 Crore for fixing roads, water, hospitals, schools, and drainage in our area. You can track all projects online.",
              charCount: 680,
              score: 95
            }
          ]
        },
        {
          channel: "Social Media Post",
          entries: [
            {
              title: "Ward 5 Road Work Update — Week 3",
              body: "🚧 Progress Update: Ward 5 Road Rehabilitation\n\n✅ 3.2 km of base layer completed\n✅ 4 culverts installed\n🔄 Next week: Tar laying begins on Kondapuram main road\n\nTimeline: On track for March 2027 completion\nBudget utilized: ₹1.2 Cr of ₹8.5 Cr\n\nReport issues: 1800-XXX-XXXX\n\n#Ward5 #RoadRepair #ProgressUpdate #PrakasamDevelopment",
              audience: "Ward 5 residents, social media followers, local journalists",
              language: "English",
              urgencyTag: "Update",
              tags: ["#Ward5", "#RoadRepair", "#ProgressUpdate", "#PrakasamDevelopment"],
              keyMessage: "Road work is progressing on schedule — 3.2 km completed in 3 weeks",
              actionRequired: "Share update with neighbors; report any construction issues to helpline",
              formalVersion: "Weekly Progress Report: Kondapuram-HQ Highway Rehabilitation — Week 3 status...",
              simplifiedVersion: "Road work update! 3.2 km done in Ward 5. Tar road coming next week. Call 1800-XXX-XXXX for any problems.",
              charCount: 340,
              score: 88
            }
          ]
        },
        {
          channel: "Ward Update",
          entries: [
            {
              title: "Monthly Development Report — Ward 5, June 2026",
              body: "Dear residents of Ward 5, here is your monthly development update:\n\n1. ROAD REPAIR: DPR approved for 23 km highway rehabilitation. Contractor mobilization begins July 15.\n2. WATER SUPPLY: 4 new bore wells sanctioned. Survey completed, drilling to start August 1.\n3. SCHOOLS: Roof repair for 3 schools approved under Samagra Shiksha. Materials procurement underway.\n4. HEALTHCARE: Request submitted to state health department for permanent doctor posting at Markapuram PHC.\n5. DRAINAGE: SBM-G Phase II proposal submitted for closed drainage in Kondapuram village.\n\nNext Jan Sunwai: July 20, 2026 at Kondapuram Community Hall, 10:00 AM\nYour voice matters. Please attend.",
              audience: "All residents of Ward 5",
              language: "English",
              urgencyTag: "Monthly",
              tags: ["#Ward5", "#MonthlyUpdate", "#Development"],
              keyMessage: "5 major projects moving forward in Ward 5 — attend Jan Sunwai on July 20",
              actionRequired: "Attend the Jan Sunwai public hearing on July 20 at Kondapuram Community Hall",
              formalVersion: "Ward 5 Monthly Development Progress Report — Period: June 2026...",
              simplifiedVersion: "Ward 5 news: Roads, water, schools, hospital, and drainage — all approved! Come to the public meeting on July 20 at Kondapuram Hall.",
              charCount: 520,
              score: 90
            }
          ]
        },
        {
          channel: "Meeting Summary",
          entries: [
            {
              title: "Minutes: District Development Review Meeting — June 28, 2026",
              body: "Meeting chaired by: Honorable MP, Prakasam Constituency\nAttendees: District Collector, Superintendent Engineer (PWD), Chief Medical Officer, District Education Officer, BDOs (15 blocks)\n\nKey Decisions:\n1. Road rehabilitation contractor to be finalized by July 10 — lowest bidder (L1) at ₹7.8 Cr accepted.\n2. Emergency bore well drilling ordered for 4 hamlets — district collector to release ₹45 lakh from contingency fund.\n3. State health department letter requesting 3 MBBS doctors dispatched — follow-up meeting scheduled July 15.\n4. School roof repairs: Materials list finalized, procurement through GeM portal initiated.\n5. Monthly ward-wise monitoring dashboard to be launched by August 1.\n\nNext meeting: July 28, 2026 at District Collectorate, 11:00 AM",
              audience: "Government officials, block development officers, gram panchayat presidents",
              language: "English",
              urgencyTag: "Official",
              tags: ["#MeetingSummary", "#DistrictReview", "#ActionItems"],
              keyMessage: "5 key decisions taken — contractor finalized, emergency bore wells ordered",
              actionRequired: "BDOs to submit ward-level progress reports by July 5; CMO to follow up on doctor recruitment",
              formalVersion: "Minutes of the District Development Review Meeting held on June 28, 2026 at the Office of the Member of Parliament...",
              simplifiedVersion: "Meeting summary: Road contractor selected, emergency water wells ordered, doctor request sent. Next meeting July 28.",
              charCount: 640,
              score: 87
            }
          ]
        },
        {
          channel: "Government Report",
          entries: [
            {
              title: "Quarterly Constituency Development Report — Q1 FY 2026-27",
              body: "This quarterly report summarizes the development activities, fund utilization, and citizen engagement metrics for Prakasam Constituency during April-June 2026.\n\nHighlights:\n- 342 citizen complaints received and categorized\n- ₹2.3 Cr MPLADS funds utilized (46% of annual allocation)\n- 3 new projects sanctioned under central schemes\n- 4 Jan Sunwai public hearings conducted across 4 wards\n- Citizen satisfaction index: 34/100 (baseline established)\n\nChallenges:\n- Doctor recruitment for rural PHCs remains pending\n- Monsoon season delaying road construction timelines\n- Land acquisition issues in Ward 6 for drainage project\n\nOutlook:\n- Q2 focus: Road construction kickoff, bore well drilling, school repairs\n- Target: Improve citizen satisfaction to 50/100 by end of Q2",
              audience: "State government, ministry offices, constituency office records",
              language: "English",
              urgencyTag: "Quarterly",
              tags: ["#QuarterlyReport", "#MPLADS", "#DevelopmentMetrics"],
              keyMessage: "342 complaints processed, ₹2.3 Cr utilized, citizen satisfaction at 34/100 — improvement plan in motion",
              actionRequired: "Submit to state MP coordination office; archive in constituency development records",
              formalVersion: "Quarterly Development Progress Report — Prakasam Parliamentary Constituency — Q1 FY 2026-27...",
              simplifiedVersion: "First 3 months report: 342 complaints heard, ₹2.3 Crore spent, 3 new projects started. We are working to improve.",
              charCount: 780,
              score: 91
            }
          ]
        },
        {
          channel: "Citizen Advisory",
          entries: [
            {
              title: "Advisory: Monsoon Preparedness — Stay Safe, Stay Informed",
              body: "Dear citizens, with the monsoon season approaching, please take the following precautions:\n\n🌧️ ROADS: Avoid travel on Kondapuram-HQ highway during heavy rain until repair work is completed.\n💧 WATER: Store drinking water — supply may be intermittent during heavy rain periods. Boil water before consumption.\n🏥 HEALTH: Report any fever, diarrhea, or skin infections immediately to your nearest health center. Dengue and cholera risk increases during monsoon.\n📞 EMERGENCY: District Emergency Operations Center — 1077\n\nStay connected with your ward representative for real-time updates.",
              audience: "All constituency residents, especially rural hamlet dwellers",
              language: "English",
              urgencyTag: "Advisory",
              tags: ["#MonsoonSafety", "#CitizenAdvisory", "#PublicHealth"],
              keyMessage: "Take monsoon precautions — avoid damaged roads, boil water, report illness early",
              actionRequired: "Follow safety guidelines; call 1077 for emergencies",
              formalVersion: "Monsoon Preparedness Advisory — Office of the Member of Parliament, Prakasam Constituency...",
              simplifiedVersion: "Monsoon warning! Don't travel on bad roads in rain. Boil water before drinking. If sick, go to health center. Emergency: Call 1077.",
              charCount: 450,
              score: 93
            }
          ]
        },
        {
          channel: "SMS Alert",
          entries: [
            {
              title: "SMS: Ward 5 Road Work Notice",
              body: "COMET CIVIC: Road repair work starts Oct 15 on Kondapuram road. Use Markapuram bypass. Helpline: 1800-XXX-XXXX. -MP Office",
              audience: "All registered mobile numbers in Ward 5",
              language: "English",
              urgencyTag: "Alert",
              tags: ["#SMS", "#RoadWork"],
              keyMessage: "Road work starting — use alternate route",
              actionRequired: "Share with family and neighbors",
              formalVersion: "Official SMS from MP Office: Road rehabilitation notice...",
              simplifiedVersion: "Road repair starts Oct 15 on Kondapuram road. Use other road. Call 1800-XXX-XXXX for help.",
              charCount: 140,
              score: 85
            }
          ]
        }
      ],
      detailedReport: `# Comprehensive Communication Plan: Prakasam Constituency

## Overview
This communication plan establishes a multi-channel civic engagement framework to keep citizens informed about development activities, gather feedback, and maintain transparency in fund utilization. The plan covers 8 communication channels with specific content calendars, translation workflows, and distribution strategies.

---

## Communication Calendar
| Week | Channel | Content | Language |
|:---|:---|:---|:---|
| Week 1 | Public Notice | Project commencement notices | English, Telugu, Hindi |
| Week 1 | SMS Alert | Short alerts to registered numbers | Telugu, English |
| Week 2 | Social Media | Progress updates with photos | English, Telugu |
| Week 2 | Ward Update | Monthly ward-level reports | Telugu, English |
| Week 3 | Press Release | Major announcement or milestone | English |
| Week 3 | Meeting Summary | Review meeting minutes | English |
| Week 4 | Government Report | Monthly/quarterly reports | English |
| Ongoing | Citizen Advisory | Safety, health, seasonal alerts | Telugu, English, Hindi |

---

## Translation Guidelines
All critical communications must be available in at least 2 languages:
- **Primary**: Telugu (spoken by 78% of constituency residents)
- **Secondary**: English (for official records and media)
- **Tertiary**: Hindi (for migrant worker populations)
- Automated translation via Google Translation API with manual review by district language coordinator
- SMS alerts limited to 160 characters in Telugu script

---

## Distribution Strategy
1. **Physical**: Notice boards at gram panchayat offices, schools, PHCs, and community halls
2. **Digital**: WhatsApp broadcast lists (ward-wise), Facebook pages, Twitter/X, YouTube
3. **Voice**: IVR system for illiterate citizens — dial 1800-XXX-XXXX for recorded updates
4. **Media**: Press releases to 12 district newspapers and 3 regional TV channels
5. **Community**: Announcements during gram sabha meetings and Jan Sunwai hearings

---

## Accessibility Plan
- Large-print versions of public notices for elderly citizens
- Audio recordings of notices played through village loudspeakers
- Sign language interpreter at all public hearings
- Simplified language versions (6th-grade reading level) for all citizen-facing content`,
      deliverables: []
    },
    development: {
      dataOverview: "Analysis of 14 government datasets covering infrastructure, demographics, and public services across Prakasam District. Data sources include Census India 2021, PMGSY road inventory, Jal Jeevan Mission dashboard, UDISE+ school database, and National Health Mission facility records.",
      infrastructureAnalysis: "The district has 847 km of roads, of which 34% (288 km) are in poor condition. 156 villages have piped water supply, while 42 hamlets rely on bore wells or hand pumps. 5 Primary Health Centers serve the constituency, with 3 operating at reduced capacity due to staff vacancies. 89 government schools serve 12,400 students, with 12 requiring structural repairs.",
      dataSources: [
        { name: "Census India 2021", description: "Population, demographics, literacy, occupation data", url: "https://censusindia.gov.in" },
        { name: "Data.gov.in", description: "Open Government Data — schemes, budgets, infrastructure", url: "https://data.gov.in" },
        { name: "PMGSY OMMAS", description: "Road connectivity status and project tracking", url: "https://omms.nic.in" },
        { name: "Jal Jeevan Mission Dashboard", description: "Water supply coverage and connection data", url: "https://jaljeevanmission.gov.in" },
        { name: "UDISE+ Portal", description: "School infrastructure, enrollment, and teacher data", url: "https://udiseplus.gov.in" },
        { name: "National Health Mission", description: "Healthcare facility inventory and staff positions", url: "https://nhm.gov.in" }
      ],
      demographicBreakdown: "Total constituency population: 2,83,450 (Census 2021). Urban: 18%, Rural: 82%. Male: 49.3%, Female: 50.7%. SC/ST population: 24.6%. Literacy rate: 67.2% (male: 74.1%, female: 60.5%). Working population: 58.4% (agriculture: 62%, services: 22%, industry: 16%).",
      schoolsAnalysis: "89 government schools across the constituency. Student-teacher ratio: 32:1 (state average: 28:1). 12 schools flagged for structural repairs — roof damage, wall cracks, or foundation issues. 8 schools lack functional toilet facilities. Digital infrastructure: Only 14 schools (16%) have computer labs. Mid-day meal coverage: 94% of eligible students.",
      roadsAnalysis: "Total road network: 847 km. National Highway: 45 km (good condition). State Highway: 112 km (23 km in poor condition). District Roads: 290 km (45% fair, 30% poor). Village Roads: 400 km (52% kutcha/unmetalled). PMGSY coverage: 78% of eligible habitations connected. Critical gaps: 8 villages remain unconnected by all-weather roads.",
      hospitalsAnalysis: "Healthcare facilities: 5 Primary Health Centers, 2 Community Health Centers, 1 District Hospital. Doctor-to-population ratio: 1:8,200 (WHO recommended: 1:1,000). 3 PHCs operating without permanent doctors. Ambulance coverage: 2 vehicles for entire constituency — average response time: 45 minutes. Sub-center network: 28 sub-centers, 12 without ANM (Auxiliary Nurse Midwife) posting.",
      populationInsights: "Population growth rate: 1.2% annually. Urbanization trend: 2% annual migration to district headquarters and Hyderabad. Youth (15-29) comprise 28% of population — 34% unemployed or underemployed. Elderly (60+): 11% of population, projected to reach 15% by 2031. Dependency ratio: 52 (52 dependents per 100 working-age adults).",
      waterSupplyAnalysis: "Jal Jeevan Mission coverage: 62% of households with functional tap connections (state target: 100% by 2026). Groundwater dependency: 38% of households rely on bore wells or hand pumps. Water table depth: Average 45 meters (dropped from 30 meters in 2015). Fluoride contamination: Detected in 3 gram panchayats — requires RO treatment plants.",
      electricityAnalysis: "Electrification: 97% household coverage. Power supply hours: Urban areas 22 hrs/day, rural areas 16 hrs/day. Agricultural feeders: 7 hrs/day. Solar pump installations: 145 (target: 500). Street lighting: 60% of village roads have functional street lights.",
      geoMappingData: "GIS mapping reveals concentration of complaints in the southern belt of the constituency (Wards 5, 7, 12) which also corresponds to the areas with highest road damage, lowest water table, and longest distance to healthcare facilities. The northern wards (1, 2, 3) have relatively better infrastructure but face sanitation challenges.",
      sanitationAnalysis: "ODF (Open Defecation Free) status: 14 of 15 wards certified. Individual Household Latrines (IHHL): 94% coverage. Community toilets: 23 functional, 8 non-functional. Solid waste management: Only 4 gram panchayats have door-to-door collection. Liquid waste: Open drainage in 6 wards — closed drainage in 3 wards only.",
      connectivityAnalysis: "Mobile network coverage: 92% of constituency area. 4G availability: 78% (concentrated in urban and semi-urban areas). 4 gram panchayats in hilly terrain have no mobile coverage. Broadband: 12% household penetration. Common Service Centers: 8 operational (target: 15).",
      budgetUtilization: "MPLADS fund utilization FY 2025-26: 72% (₹3.6 Cr of ₹5 Cr). State scheme convergence: ₹12.4 Cr sanctioned, ₹8.1 Cr released, ₹5.7 Cr utilized (46% utilization rate). Key bottleneck: Delayed administrative approvals and contractor mobilization.",
      governmentSchemes: "Active central schemes: PMGSY (roads), JJM (water), SBM-G (sanitation), SSA (education), NHM (health), PMAY-G (housing), MGNREGA (employment). State schemes: Amma Vodi (education incentive), YSR Rythu Bharosa (farmer support), Jagananna Colonies (housing). Convergence opportunity: 4 schemes can be converged for Ward 5 multi-sector development.",
      detailedReport: `# Comprehensive Public Data Analysis Report

## Data Sources Overview
This analysis synthesizes data from 14 government databases and open data platforms to create a unified intelligence picture of the constituency's infrastructure, demographics, and development status. Key sources include Census India 2021, PMGSY OMMAS portal, Jal Jeevan Mission dashboard, UDISE+ school database, National Health Mission records, and Swachh Bharat Mission monitoring data.

---

## Demographic Analysis
The constituency serves a predominantly rural population of 2,83,450 residents across 15 wards. With 82% rural population, development planning must prioritize village-level infrastructure. The SC/ST population (24.6%) requires targeted welfare scheme convergence. The literacy gender gap (13.6 percentage points) correlates with school infrastructure quality — wards with non-functional school toilets show the lowest female literacy rates.

---

## Infrastructure Status Dashboard
| Sector | Coverage | Gap | Priority |
|:---|:---|:---|:---|
| Roads (all-weather) | 78% habitations | 8 villages unconnected | Critical |
| Piped Water (JJM) | 62% households | 38% on groundwater | High |
| Healthcare (PHC within 10km) | 72% population | 2 wards as health deserts | Critical |
| Schools (structurally sound) | 87% schools | 12 needing repair | High |
| Sanitation (ODF) | 93% wards | 1 ward not certified | Medium |
| Electricity (22hr supply) | 18% (urban only) | Rural: 16 hrs/day | Medium |
| Mobile Coverage | 92% area | 4 panchayats uncovered | Medium |

---

## Correlation Analysis
Cross-referencing citizen complaint data with infrastructure databases reveals strong correlations:
- Wards with >30% poor-condition roads generate 3.2x more complaints than average
- Hamlets without piped water supply report 2.8x higher health complaints
- Schools without toilets show 40% higher girl dropout rates
- Areas beyond 15 km from PHC report 4x more emergency evacuation requests

These correlations validate citizen complaints with objective infrastructure data, strengthening the case for prioritized intervention.

---

## Geo-Mapping Insights
GIS overlay of complaint density, infrastructure gaps, and demographic vulnerability identifies three priority zones:
1. **Southern Belt (Wards 5, 7, 12):** Highest complaint density, worst road conditions, lowest water table
2. **Eastern Corridor (Wards 9, 11):** Healthcare desert, highest emergency evacuation distances
3. **Central Zone (Wards 1, 6):** Sanitation crisis, open drainage, disease outbreak history

---

## Recommendations
1. Prioritize southern belt for road and water interventions (highest citizen demand + worst infrastructure metrics)
2. Establish mobile health units for eastern corridor as interim healthcare solution
3. Fast-track drainage closure in central zone before monsoon season
4. Deploy GIS-based monitoring dashboard for real-time project tracking`,
      deliverables: []
    },
    pitch: {
      executiveSummary: "Based on analysis of 342 citizen complaints, 14 government datasets, and infrastructure gap assessments, the following 15 development projects are recommended in order of priority. Total estimated budget: ₹19.3 Crore. Implementation timeline: 24 months. Expected citizen satisfaction improvement: from 34/100 to 72/100.",
      recommendations: [
        {
          projectName: "Kondapuram-HQ Highway Rehabilitation",
          priorityScore: "96/100",
          budgetEstimate: "₹8.5 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Repairs 23 km of critically damaged state highway connecting 12 villages to district headquarters.\n\n**Beneficiaries:** 45,000+ residents, 2,000+ daily commuters, 500+ commercial vehicles\n\n**Current Status:** 14 accidents reported in past year. Road impassable during monsoon.\n\n**Funding:** PMGSY central fund + State PWD maintenance budget convergence.",
          implementationNotes: "Phase 1 (Months 3-8): Base layer and drainage for 12 km priority segment. Phase 2 (Months 8-12): Remaining 11 km with road markings and safety barriers. Contractor selection via e-tendering. Third-party quality audit at 25%, 50%, 75% completion.",
          urgencyLabel: "Critical"
        },
        {
          projectName: "Ward 5 Emergency Water Supply",
          priorityScore: "92/100",
          budgetEstimate: "₹2.1 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Installs 12 new bore wells and 3 overhead tanks in 6 hamlets facing acute water scarcity.\n\n**Beneficiaries:** 8,500 households (approximately 34,000 residents)\n\n**Current Status:** Water table dropped 15m in decade. Women walk 2-3 km daily for collection.\n\n**Funding:** Jal Jeevan Mission + MPLADS top-up.",
          implementationNotes: "Emergency drilling to begin within 60 days for 4 most critical hamlets. Overhead tank construction: 4 months. Piped distribution network: 6 months. Rainwater harvesting structures at 8 locations for groundwater recharge.",
          urgencyLabel: "Critical"
        },
        {
          projectName: "Primary Health Center Staffing & Upgrade",
          priorityScore: "89/100",
          budgetEstimate: "₹3.2 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Establishes 2 new sub-health centers and recruits 3 permanent doctors for healthcare desert wards.\n\n**Beneficiaries:** 52,000 residents in Wards 9 and 11 currently without PHC access within 15 km.\n\n**Current Status:** Nearest hospital 28 km away. Emergency cases require ₹2,000-5,000 private ambulance costs.\n\n**Funding:** National Health Mission + State Health Department.",
          implementationNotes: "Month 1: Submit recruitment request to state DMER. Month 2-4: Temporary mobile health unit deployment. Month 4-12: Sub-health center construction. Doctor incentive: 25% rural posting premium + government housing.",
          urgencyLabel: "Critical"
        },
        {
          projectName: "School Infrastructure Revival Program",
          priorityScore: "85/100",
          budgetEstimate: "₹1.8 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Repairs roofing for 12 schools and constructs toilet blocks in 8 schools.\n\n**Beneficiaries:** 4,200 students, with specific focus on reducing 40% girl dropout rate.\n\n**Current Status:** Classes suspended 30 days/year during monsoon due to leaking roofs. 8 schools without toilets.\n\n**Funding:** Samagra Shiksha Abhiyan + District Education Fund.",
          implementationNotes: "Prioritize toilet construction in girls-only sections first. Roofing repairs during summer vacation (April-May) to minimize disruption. Materials procurement through GeM portal for transparency.",
          urgencyLabel: "High"
        },
        {
          projectName: "Ward 1 & 6 Closed Drainage Network",
          priorityScore: "82/100",
          budgetEstimate: "₹2.5 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Replaces open drains with closed drainage system, eliminating sewage overflow and disease outbreaks.\n\n**Beneficiaries:** 18,000 residents in Ward 1 and 6.\n\n**Current Status:** 3 cholera outbreaks in 18 months. Raw sewage enters residential areas during monsoon.\n\n**Funding:** SBM-G Phase II + NREGA convergence for labor.",
          implementationNotes: "Design: Underground covered drains with soak pits. Construction: October-March (dry season). NREGA labor convergence reduces cost by 30%. Community ownership through gram panchayat maintenance committees.",
          urgencyLabel: "High"
        },
        {
          projectName: "Digital Village Connectivity",
          priorityScore: "74/100",
          budgetEstimate: "₹1.2 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Installs 4 mobile towers and establishes 6 Common Service Centers for e-governance access.\n\n**Beneficiaries:** 12,000 residents in 4 uncovered gram panchayats.\n\n**Current Status:** No mobile network, no internet — citizens must travel 15+ km for government services.\n\n**Funding:** BharatNet + CSR partnerships.",
          implementationNotes: "Tower installation: Coordinate with BSNL/private operators via USOF subsidy. CSC setup: 2 months per center. Training: Digital literacy program for 500 residents in first year.",
          urgencyLabel: "Medium"
        },
        {
          projectName: "Rainwater Harvesting Structures",
          priorityScore: "78/100",
          budgetEstimate: "₹0.9 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Constructs 15 rainwater harvesting structures and 8 percolation tanks to recharge groundwater.\n\n**Beneficiaries:** All 6 water-scarce hamlets — long-term groundwater sustainability.\n\n**Funding:** MGNREGA + Watershed Development Fund.",
          implementationNotes: "Site selection based on hydrogeological survey. Construction during pre-monsoon (May-June) for immediate monsoon capture. Community maintenance through water user associations.",
          urgencyLabel: "High"
        },
        {
          projectName: "Solar Agricultural Pump Program",
          priorityScore: "72/100",
          budgetEstimate: "₹1.5 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Installs 200 solar pumps for agricultural irrigation, reducing electricity dependency and costs.\n\n**Beneficiaries:** 200 farming households across 8 wards.\n\n**Funding:** PM-KUSUM scheme.",
          implementationNotes: "Beneficiary selection through gram sabha. Installation: 30 days per batch of 50 pumps. Maintenance training for farmers.",
          urgencyLabel: "Medium"
        },
        {
          projectName: "Street Lighting Expansion",
          priorityScore: "68/100",
          budgetEstimate: "₹0.6 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Installs LED street lights on 120 km of village roads currently without lighting.\n\n**Beneficiaries:** Enhanced safety for 1.2 lakh rural residents, especially women and children.\n\n**Funding:** MPLADS + State Rural Development.",
          implementationNotes: "Solar-powered LED lights preferred for areas with unreliable grid supply. Installation in phases: priority to school routes and PHC approach roads.",
          urgencyLabel: "Medium"
        },
        {
          projectName: "Community Health Awareness Campaign",
          priorityScore: "65/100",
          budgetEstimate: "₹0.3 Cr",
          budgetEstimateLabel: "Estimated Cost",
          impactSummary: "**Impact:** Conducts health camps, dengue/cholera prevention drives, and nutrition awareness in 15 wards.\n\n**Beneficiaries:** All constituency residents, focus on women and children.\n\n**Funding:** NHM operational budget + MP discretionary.",
          implementationNotes: "Monthly health camps at each ward. ASHA worker training for disease surveillance. School-based nutrition programs.",
          urgencyLabel: "Medium"
        }
      ],
      detailedReport: `# Comprehensive MP Development Recommendation Report

## Scoring Methodology
Each project is scored on a 100-point scale using 6 weighted criteria:
1. **Citizen Demand (25%):** Volume and urgency of citizen complaints related to this issue
2. **Population Impact (20%):** Number of direct beneficiaries as percentage of constituency population
3. **Infrastructure Gap Severity (20%):** Gap between current status and national/state benchmark
4. **Budget Feasibility (15%):** Availability of funding through convergence of central/state schemes
5. **Implementation Readiness (10%):** Availability of DPRs, land, approvals, and contractor capacity
6. **Urgency (10%):** Time sensitivity — monsoon risk, health emergency, safety hazard

---

## Budget Justification
| Project | Budget (₹ Cr) | Funding Source | Cost Basis |
|:---|:---|:---|:---|
| Highway Rehabilitation | 8.5 | PMGSY + PWD | State SOR rates × 23 km |
| Water Supply | 2.1 | JJM + MPLADS | ₹12L/bore well + ₹35L/OHT |
| Healthcare | 3.2 | NHM + State | ₹80L/sub-center + staffing |
| Education | 1.8 | SSA + District | ₹8L/roof + ₹12L/toilet block |
| Sanitation | 2.5 | SBM-G + NREGA | ₹15L/km closed drainage |
| Digital | 1.2 | BharatNet + CSR | ₹20L/tower + ₹5L/CSC |

---

## Implementation Roadmap
### Phase 1 (Months 1-6): Emergency & Planning
- Emergency bore well drilling in 4 critical hamlets
- Road contractor selection and mobilization
- PHC doctor recruitment request
- DPR preparation for all remaining projects

### Phase 2 (Months 7-12): Core Construction
- Highway rehabilitation (12 km priority segment)
- School roof repairs during summer vacation
- Sub-health center foundation laying
- Drainage design and tendering

### Phase 3 (Months 13-18): Expansion
- Highway completion (remaining 11 km)
- Overhead tank construction and piped distribution
- Drainage construction (pre-monsoon deadline)
- Digital connectivity installations

### Phase 4 (Months 19-24): Completion & Review
- All projects commissioned
- Citizen satisfaction re-survey
- Monitoring dashboard live
- Annual development report to Parliament

---

## Monitoring Framework
1. **Real-time Dashboard:** GIS-based project tracking visible to citizens
2. **Monthly Reviews:** District collector-level review with BDOs
3. **Quarterly Reports:** Submission to state MP coordination office
4. **Citizen Feedback:** Monthly Jan Sunwai hearings in rotating wards
5. **Third-party Audit:** Independent quality audit at project milestones
6. **Media Transparency:** Monthly social media progress updates with photos`
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
