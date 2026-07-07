import {
  Sparkles,
  CloudRain,
  Droplets,
  FlaskConical,
  Landmark,
  LineChart,
  Camera,
  ShieldAlert,
  Sprout,
  Sun,
  Wind,
  ThermometerSun,
} from "lucide-react";

export type QuickPrompt = {
  icon: any;
  label: string;
  hint: string;
  prompt: string;
  tone: "sky" | "emerald" | "amber" | "violet" | "lime";
};

export const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: Camera, label: "Diagnose my crop", hint: "Upload a leaf photo", prompt: "I want to diagnose my crop. Here's a photo of the affected leaves.", tone: "emerald" },
  { icon: Droplets, label: "Should I irrigate today?", hint: "Based on soil + weather", prompt: "Should I irrigate my tomato field today?", tone: "sky" },
  { icon: FlaskConical, label: "Best fertilizer for cotton", hint: "For flowering stage", prompt: "What's the best fertilizer schedule for cotton at flowering?", tone: "lime" },
  { icon: CloudRain, label: "Weather forecast", hint: "3-day farming outlook", prompt: "Give me a 3-day weather-based farming advisory for Hosakote.", tone: "sky" },
  { icon: LineChart, label: "Market price today", hint: "Nearby mandis", prompt: "What are today's mandi prices for tomato in Karnataka?", tone: "emerald" },
  { icon: Landmark, label: "Government schemes", hint: "Subsidies for you", prompt: "Which government subsidies am I eligible for as a Karnataka tomato farmer?", tone: "violet" },
  { icon: ShieldAlert, label: "Pest risk near me", hint: "District-level alerts", prompt: "What pest risks are rising in my district this week?", tone: "amber" },
  { icon: Sprout, label: "Next crop to plant", hint: "Based on rotation", prompt: "Given I just harvested tomato, what crop should I plant next?", tone: "emerald" },
];

export type ConversationSummary = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  pinned?: boolean;
};

export const CONVERSATIONS: ConversationSummary[] = [
  { id: "c1", title: "Tomato leaf-curl diagnosis", preview: "Looks like early blight — spray mancozeb after…", updatedAt: "Just now", pinned: true },
  { id: "c2", title: "Weather advice · Hosakote", preview: "Rain expected Wed. Delay pesticide spray until…", updatedAt: "2h ago" },
  { id: "c3", title: "Cotton mandi price trend", preview: "₹7,120/quintal · +6.2% this week…", updatedAt: "Yesterday" },
  { id: "c4", title: "PM-KUSUM solar subsidy", preview: "You qualify for 60% subsidy on a 3HP pump…", updatedAt: "2d ago" },
  { id: "c5", title: "Fertilizer plan — July", preview: "NPK 19-19-19 @ 8kg/acre, then urea after…", updatedAt: "5d ago" },
  { id: "c6", title: "Government schemes overview", preview: "Top 4 schemes for small farmers in KA…", updatedAt: "1w ago" },
];

/* ─────────── Rich response block types ─────────── */

export type Block =
  | { kind: "markdown"; text: string }
  | {
      kind: "diagnosis";
      crop: string;
      disease: string;
      confidence: number;
      severity: "Mild" | "Moderate" | "Severe";
      cause: string;
      treatment: { title: string; detail: string }[];
    }
  | {
      kind: "weather";
      location: string;
      current: { temp: string; cond: string; feels: string };
      days: { day: string; icon: "sun" | "rain" | "cloud"; hi: string; lo: string; rain: string }[];
      advisory: string;
    }
  | {
      kind: "recommendation";
      title: string;
      body: string;
      confidence: number;
      tags: string[];
    }
  | {
      kind: "risk";
      title: string;
      level: "Low" | "Moderate" | "High";
      body: string;
      mitigate: string[];
    }
  | {
      kind: "market";
      commodity: string;
      unit: string;
      today: string;
      change: string;
      trend: "up" | "down";
      mandis: { name: string; price: string; distance: string }[];
    }
  | {
      kind: "scheme";
      name: string;
      agency: string;
      benefit: string;
      eligibility: string[];
      deadline: string;
    }
  | {
      kind: "actionPlan";
      items: { when: "Today" | "Tomorrow" | "In 3 days" | "Next week"; title: string; detail: string; icon: "water" | "spray" | "scout" | "harvest" | "fertilize" }[];
    }
  | {
      kind: "diseaseVision";
      diseaseName: string;
      confidence: number;
      severity: "Mild" | "Moderate" | "Severe" | "Unknown";
      symptoms: string[];
      possibleCause: string;
      organicTreatment: string[];
      chemicalTreatment: string[];
      preventionTips: string[];
      nextActions: string[];
      emergencyLevel: "Low" | "Medium" | "High" | "Critical";
      lowConfidenceNotice?: string;
    }
  | { kind: "followups"; questions: string[] };

export type ChatMessage =
  | { id: string; role: "user"; text: string; attachments?: { name: string; kind: "image" | "pdf" }[] }
  | { id: string; role: "assistant"; blocks: Block[] };

/* ─────────── Seed conversation ─────────── */

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "u1",
    role: "user",
    text: "My tomato leaves have yellow patches with dark rings. What is it and what should I do?",
    attachments: [{ name: "tomato-leaf.jpg", kind: "image" }],
  },
  {
    id: "a1",
    role: "assistant",
    blocks: [
      {
        kind: "markdown",
        text:
          "Based on the leaf photo and your farm's location, this looks like **Early Blight** *(Alternaria solani)* — a common fungal disease in humid conditions after flowering.",
      },
      {
        kind: "diagnosis",
        crop: "Tomato",
        disease: "Early Blight",
        confidence: 92,
        severity: "Moderate",
        cause: "Alternaria solani fungus, favoured by warm humid nights (22–28°C) and leaf wetness > 6h.",
        treatment: [
          { title: "Remove affected leaves", detail: "Prune lower leaves showing dark rings. Burn or bury away from the field." },
          { title: "Spray Mancozeb 75% WP", detail: "2.5 g/L water. Cover both leaf surfaces. Repeat after 10 days." },
          { title: "Improve airflow", detail: "Stake and prune suckers; keep rows dry through the morning." },
        ],
      },
      {
        kind: "risk",
        title: "Spread risk in next 5 days",
        level: "High",
        body: "12mm rain forecast tomorrow will keep leaves wet overnight. Spores spread rapidly in these conditions.",
        mitigate: ["Spray before rain, not after", "Avoid overhead irrigation", "Scout rows 4–7 daily"],
      },
      {
        kind: "weather",
        location: "Hosakote, Karnataka",
        current: { temp: "29°", cond: "Cloudy", feels: "31°" },
        days: [
          { day: "Mon", icon: "cloud", hi: "29°", lo: "22°", rain: "20%" },
          { day: "Tue", icon: "rain", hi: "26°", lo: "21°", rain: "80%" },
          { day: "Wed", icon: "rain", hi: "27°", lo: "22°", rain: "60%" },
          { day: "Thu", icon: "sun", hi: "30°", lo: "23°", rain: "10%" },
        ],
        advisory: "Best spray window: Thursday 6–9 AM after fields dry out.",
      },
      {
        kind: "actionPlan",
        items: [
          { when: "Today", title: "Prune infected leaves", detail: "Rows 4–7, dispose off-field.", icon: "scout" },
          { when: "Today", title: "Spray Mancozeb before 4 PM", detail: "2.5 g/L, full coverage.", icon: "spray" },
          { when: "Tomorrow", title: "Skip irrigation", detail: "Rain will meet water needs.", icon: "water" },
          { when: "In 3 days", title: "Scout for new lesions", detail: "Mark severely affected plants.", icon: "scout" },
          { when: "Next week", title: "Repeat spray if humid", detail: "Switch to Chlorothalonil to prevent resistance.", icon: "spray" },
        ],
      },
      {
        kind: "recommendation",
        title: "Longer-term prevention",
        body:
          "Rotate tomato with a non-solanaceous crop (e.g. legumes) next season. Mulch with straw to reduce soil splash, and use certified disease-free seed.",
        confidence: 88,
        tags: ["Rotation", "Mulching", "Resistant variety"],
      },
      {
        kind: "followups",
        questions: [
          "Recommend an organic alternative to Mancozeb",
          "Can I irrigate tomorrow evening?",
          "Nearest agri store selling Mancozeb",
          "How to prevent early blight next season?",
        ],
      },
    ],
  },
];
