import { ThoughtFrameworkType } from '../types';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sender?: 'user' | 'coach';
  text?: string;
  timestamp?: string;
  audioUrl?: string;
}

export interface ChatResponse {
  ok: boolean;
  reply?: string;
  model?: string;
  error?: string;
  message?: string;
}

export interface CommunicationFeedback {
  clarity: string;
  structure: string;
  relevance: string;
  examples: string;
  conciseness: string;
  logicalFlow: string;
  keyTakeaway: string;
  polishedVersion: string;
}

export interface ThoughtStructureResult {
  mainIdea: string;
  supportingPoints: string[];
  missingReasoning: string[];
  structuredOutput: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const AIService = {
  // Check backend OpenAI key status
  async checkBackendStatus(): Promise<{ ok: boolean; hasOpenAIKey: boolean; model: string }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      console.warn('Backend health check error:', e);
      return { ok: false, hasOpenAIKey: false, model: 'gpt-4o-mini' };
    }
  },

  // Save OpenAI key to server
  async setServerApiKey(apiKey: string, model: string = 'gpt-4o-mini'): Promise<boolean> {
    try {
      const res = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model }),
      });
      const data = await res.json();
      return Boolean(data.ok && data.hasOpenAIKey);
    } catch (e) {
      console.error('Error setting server API key:', e);
      return false;
    }
  },

  // General Open-Ended ChatGPT Conversation
  async sendMessage(
    messages: ChatMessage[],
    mode: 'general' | 'study' | 'communication' | 'thought-builder' | 'brand-coach' | 'linkedin' = 'general',
    contextHint?: string,
    requestFeedback: boolean = false
  ): Promise<ChatResponse> {
    try {
      const payload = {
        messages: messages.map((m) => ({
          role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
          content: m.content || m.text || '',
        })),
        mode,
        contextHint,
        requestFeedback,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Chat API error status ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('AIService.sendMessage error:', err);
      return {
        ok: false,
        error: 'NETWORK_ERROR',
        message: err.message || 'Could not connect to the Growth Lab AI server.',
      };
    }
  },

  // Transcribe audio with OpenAI Whisper API via backend
  async transcribeAudioWithWhisper(audioBlob: Blob): Promise<{ ok: boolean; text?: string; error?: string }> {
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': audioBlob.type || 'audio/webm',
        },
        body: audioBlob,
      });

      if (!res.ok) {
        throw new Error(`Whisper transcription HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('Whisper transcription error:', err);
      return { ok: false, error: err.message };
    }
  },

  // Optional: Explicitly requested communication feedback
  async evaluateCommunication(
    transcript: string,
    prompt: string
  ): Promise<CommunicationFeedback> {
    const sysPrompt = `Evaluate this student's spoken answer: "${transcript}" to the prompt: "${prompt}".
Analyze her response on:
1. Clarity
2. Structure (Point-Reason-Example)
3. Relevance
4. Use of Examples
5. Conciseness
6. Logical Flow
7. One actionable takeaway
8. Polished conversational rewrite preserving her natural voice.
Respond in clear JSON format:
{
  "clarity": "...",
  "structure": "...",
  "relevance": "...",
  "examples": "...",
  "conciseness": "...",
  "logicalFlow": "...",
  "keyTakeaway": "...",
  "polishedVersion": "..."
}`;

    const res = await this.sendMessage(
      [{ role: 'user', content: 'Please evaluate my spoken response.' }],
      'communication',
      sysPrompt,
      true
    );

    if (res.ok && res.reply) {
      try {
        const cleaned = res.reply.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        // Fallback to text parsing
      }
    }

    // Natural fallback feedback
    const words = transcript.trim().split(/\s+/).length;
    return {
      clarity: words < 20
        ? 'Your answer is brief. You expressed the instinct, but expanding with one connecting clause will make it authoritative.'
        : 'Good natural cadence. You articulated your central sentiment without getting lost in unnecessary academic vocabulary.',
      structure: 'Strong conversational start. Try declaring your verdict (Point) in the first sentence before sharing context.',
      relevance: 'Directly addresses the premise of the prompt with genuine personal observation.',
      examples: /apple|starbucks|zomato|amul|dove|tata/i.test(transcript)
        ? 'Great reference! Grounding your thought in a tangible real-world brand made the principle stick.'
        : 'Adding one concrete product example (e.g. Amul, Starbucks, or an everyday soap) would strengthen your reasoning.',
      conciseness: 'Paced nicely. Concise delivery gives your listeners time to absorb your conclusion.',
      logicalFlow: 'Intuitive and natural flow from observation to consequence.',
      keyTakeaway: 'State your conclusion in sentence one. One sharp point backed by one everyday example beats three minutes of abstract speculation.',
      polishedVersion: `"${transcript.trim()}. When examining consumer habits, people rarely buy pure utility; they buy certainty, convenience, and identity."`,
    };
  },

  // Thought structuring with framework
  async structureThoughts(
    raw: string,
    framework: ThoughtFrameworkType
  ): Promise<ThoughtStructureResult> {
    const prompt = `Transform these raw thoughts into the ${framework} framework:
"${raw}"
Return JSON:
{
  "mainIdea": "one clear sentence",
  "supportingPoints": ["pt 1", "pt 2", "pt 3"],
  "missingReasoning": ["one assumption to test"],
  "structuredOutput": "full formatted text"
}`;

    const res = await this.sendMessage(
      [{ role: 'user', content: prompt }],
      'thought-builder',
      `Organize thoughts using ${framework}`
    );

    if (res.ok && res.reply) {
      try {
        const cleaned = res.reply.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {}
    }

    // Fallback structured engine
    const sentences = raw.split(/[.?!]\s+/).filter((s) => s.trim().length > 0);
    const mainIdea = sentences[0] || 'The value of a brand lies in lowering customer friction and establishing emotional trust.';

    return {
      mainIdea: mainIdea.replace(/^I think that\s+/i, ''),
      supportingPoints: [
        'Consumers prioritize emotional certainty over technical specifications.',
        'Distinctive cues make products effortless to recognize in buying moments.',
        'Consistent positioning compounds value over multiple years.',
      ],
      missingReasoning: [
        'How does this logic apply to price-sensitive buyers in tier-2 and tier-3 markets?',
        'What specific customer metric validates that users truly value this attribute?',
      ],
      structuredOutput: `**Point (Verdict):**\n${mainIdea}\n\n**Reason:**\nWhen customers face overwhelming choices, familiar branding serves as a cognitive shortcut.\n\n**Example:**\n${sentences[1] || 'For instance, people order from Zomato even when calling a restaurant might save ₹20, because real-time tracking provides certainty.'}`,
    };
  },

  // Brand observation discussion
  async critiqueBrandObservation(
    brandName: string,
    observation: string,
    positioning: string
  ): Promise<string> {
    const prompt = `Brand: ${brandName}
Observation: ${observation}
Positioning: ${positioning}
Critique this observation constructively. Challenge weak assumptions, ask one probing question on margins or competition, and suggest one overlooked angle in simple English.`;

    const res = await this.sendMessage([{ role: 'user', content: prompt }], 'brand-coach');
    if (res.ok && res.reply) return res.reply;

    return `Socratic Challenge for ${brandName}:
1. Is this strategy profitable at scale, or is the brand burning capital to subsidize trial?
2. What prevents a competitor (like Tata, Reliance, or Unilever) from copying this within 60 days?
3. Notice how consumer inertia often resists change once novelty fades. How does ${brandName} plan to turn this curiosity into a weekly habit?`;
  },

  // LinkedIn Post Draft Generator
  async generateLinkedInPost(notes: string, format: string, source: string): Promise<string> {
    const prompt = `Draft a natural, thoughtful LinkedIn post based on these notes:
Format: ${format}
Source: ${source}
Notes: "${notes}"
Rules: Sound human, authentic, and professional. NO cheesy buzzwords. Clean line breaks. Strong opening hook. 4-5 relevant hashtags.`;

    const res = await this.sendMessage([{ role: 'user', content: prompt }], 'linkedin');
    if (res.ok && res.reply) return res.reply;

    return `When engineers build a product, they ask: "How efficient can we make this?"
When consumers buy a product, they ask: "What does this say about who I am?"

Studying ${source || 'our recent MBA case'} brought this distinction to life.

Here is what stood out from my notes:
${notes.trim()}

As an aspiring brand strategist, my core takeaway:
Utility gets people to look.
Identity gets people to buy.

Never optimize the functional spec at the expense of human aspiration.

What is a product you loved for its specs, but found the branding misaligned?

#ProductManagement #BrandStrategy #ConsumerBehavior #MBA #Marketing #IndianBusiness`;
  },

  // Explain MBA concept
  async explainAcademicConcept(
    subjectCode: string,
    topic: string,
    question: string
  ): Promise<string> {
    const prompt = `Subject: ${subjectCode}
Topic: ${topic}
Question: ${question}
Explain in simple, conversational English with an everyday Indian market analogy (e.g. Jio, Zomato, Amul).`;

    const res = await this.sendMessage([{ role: 'user', content: prompt }], 'study');
    if (res.ok && res.reply) return res.reply;

    return `**${topic} — Simplified**\n\nThink of this like Jio entering the telecom market. By offering free 4G initially, demand was highly price-elastic. Once digital payments and streaming became daily habits, demand turned inelastic, allowing Jio to raise tariffs without losing customer volume.\n\nKey rule: Always understand whether buyers have easy substitutes before adjusting pricing or architecture.`;
  },

  // Quiz generator
  async generateQuiz(subjectCode: string, topic: string): Promise<QuizQuestion[]> {
    if (subjectCode === 'PM2') {
      return [
        {
          id: 1,
          question: 'What is the primary architectural difference between a REST API and a Webhook?',
          options: [
            'REST APIs are for databases, Webhooks are for frontend browsers.',
            'REST APIs require client polling (pull), while Webhooks push real-time event notifications.',
            'Webhooks can only send XML, while REST APIs only support JSON.',
            'There is no technical difference; they are interchangeable terms.',
          ],
          correctIndex: 1,
          explanation: 'REST is client request-response (pull), whereas Webhooks are event-driven HTTP callbacks (push).',
        },
        {
          id: 2,
          question: 'Which HTTP status code indicates that a client requested a resource that could not be found?',
          options: ['200 OK', '401 Unauthorized', '404 Not Found', '500 Internal Server Error'],
          correctIndex: 2,
          explanation: '404 signifies that the server cannot find the requested URL path.',
        },
        {
          id: 3,
          question: 'When should a product team choose a NoSQL database (like MongoDB or DynamoDB) over a Relational SQL database?',
          options: [
            'When ACID transactions and strict financial ledger guarantees are the only requirement.',
            'When the data schema is highly flexible, polymorphic, or requires rapid horizontal scaling.',
            'Only when the company cannot afford a database license.',
            'NoSQL databases are deprecated and should never be chosen.',
          ],
          correctIndex: 1,
          explanation: 'NoSQL excels at document-oriented, unstructured, or rapidly changing schemas with horizontal sharding.',
        },
        {
          id: 4,
          question: 'In the "Build vs Buy" framework, what should a company almost always BUY rather than build from scratch?',
          options: [
            'Its core proprietary machine learning recommendation algorithm.',
            'Commodity infrastructure services like transactional email (SendGrid) and payment gateways (Razorpay).',
            'Its entire secret product differentiation sauce.',
            'Nothing; top tech companies build 100% of their stack in-house.',
          ],
          correctIndex: 1,
          explanation: 'Never reinvent commodity non-differentiating capabilities where robust SaaS APIs already exist.',
        },
        {
          id: 5,
          question: 'What is "prudent and deliberate" technical debt?',
          options: [
            'Writing buggy code because engineers did not understand basic syntax.',
            'Intentionally taking an architectural shortcut to validate product-market fit before investing in heavy scaling.',
            'Ignoring database security patches until a breach occurs.',
            'Refusing to write unit tests out of developer laziness.',
          ],
          correctIndex: 1,
          explanation: 'Martin Fowler\'s quadrant: Prudent/deliberate debt is a conscious business trade-off to ship value fast with a clear plan to refactor.',
        },
      ];
    }

    return [
      {
        id: 1,
        question: 'If the price elasticity of demand for a product is -0.4 (inelastic), what happens to total revenue if the firm raises prices by 10%?',
        options: [
          'Total revenue decreases because quantity falls drastically.',
          'Total revenue remains completely unchanged.',
          'Total revenue increases because the price gain exceeds the small quantity drop.',
          'Total revenue drops to zero immediately.',
        ],
        correctIndex: 2,
        explanation: 'For inelastic goods (|E_p| < 1), the percentage drop in quantity demanded is smaller than the price hike, so total revenue rises.',
      },
      {
        id: 2,
        question: 'What is the "Snob Effect" in consumer demand theory?',
        options: [
          'Consumers buy more of a product simply because its price dropped.',
          'A negative network externality where demand falls as more people own the good (desire for exclusivity).',
          'A positive network externality where popularity increases demand.',
          'When consumers only purchase goods manufactured in foreign countries.',
        ],
        correctIndex: 1,
        explanation: 'The snob effect represents a desire for rare or exclusive goods; when mass adoption occurs, snob demand declines.',
      },
      {
        id: 3,
        question: 'At what point does a perfectly competitive firm maximize short-run profit?',
        options: [
          'Where Total Revenue equals Total Cost',
          'Where Marginal Revenue (MR) equals Marginal Cost (MC)',
          'Where Average Cost is at its absolute maximum',
          'Where price equals zero',
        ],
        correctIndex: 1,
        explanation: 'Firms produce up to the point where the additional revenue from the last unit equals the additional cost of producing it (MR = MC).',
      },
      {
        id: 4,
        question: 'What is the short-run shutdown rule for a competitive firm?',
        options: [
          'Shut down if Price falls below Average Total Cost (ATC)',
          'Shut down if Price falls below Average Variable Cost (AVC)',
          'Shut down if Marginal Cost is positive',
          'Shut down if Fixed Costs exceed ₹10 Lakhs',
        ],
        correctIndex: 1,
        explanation: 'If price covers AVC, the firm should stay open to pay down fixed costs. If P < AVC, continuing to operate causes greater losses than shutting down.',
      },
      {
        id: 5,
        question: 'What is the difference between an individual demand curve and the market demand curve?',
        options: [
          'Market demand is the vertical sum of individual prices.',
          'Market demand is the horizontal sum of quantities demanded by all individual consumers at each price.',
          'There is no difference in economic theory.',
          'Individual demand is always downward-sloping, while market demand is always upward-sloping.',
        ],
        correctIndex: 1,
        explanation: 'Market demand represents the horizontal summation of quantities demanded by every individual consumer at each prevailing market price.',
      },
    ];
  },
};
