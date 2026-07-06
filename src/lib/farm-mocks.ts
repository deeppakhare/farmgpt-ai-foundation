import {
  CloudRain,
  Sprout,
  Leaf,
  AlertTriangle,
  TrendingUp,
  ListChecks,
  Camera,
  CloudSun,
  Droplets,
  FlaskConical,
  LineChart,
  Landmark,
  Bell,
  ShieldAlert,
  Cloud,
} from "lucide-react";

export const FARM_SUMMARY = [
  {
    key: "weather",
    label: "Today's Weather",
    value: "29°C · Cloudy",
    hint: "Rain likely tomorrow",
    icon: CloudRain,
    tone: "sky",
  },
  {
    key: "crop",
    label: "Current Crop",
    value: "Tomato",
    hint: "4.5 acres · Hosakote",
    icon: Sprout,
    tone: "emerald",
  },
  {
    key: "stage",
    label: "Crop Stage",
    value: "Flowering",
    hint: "Day 42 of 95",
    icon: Leaf,
    tone: "lime",
  },
  {
    key: "risk",
    label: "Risk Level",
    value: "Moderate",
    hint: "Leaf curl detected nearby",
    icon: AlertTriangle,
    tone: "amber",
  },
  {
    key: "market",
    label: "Market Trend",
    value: "₹24/kg ▲",
    hint: "+8.4% this week",
    icon: TrendingUp,
    tone: "emerald",
  },
  {
    key: "tasks",
    label: "Today's Tasks",
    value: "3 pending",
    hint: "Irrigate · Scout · Log yield",
    icon: ListChecks,
    tone: "violet",
  },
] as const;

export const QUICK_ACTIONS = [
  { icon: Camera, label: "Diagnose Crop", prompt: "I want to diagnose a crop disease. Guide me through uploading a photo of the affected leaves." },
  { icon: CloudSun, label: "Weather Advice", prompt: "Give me a weather-based farming advisory for my tomato field for the next 3 days." },
  { icon: Droplets, label: "Irrigation Advice", prompt: "Should I irrigate my tomato field today given the soil moisture and weather forecast?" },
  { icon: FlaskConical, label: "Fertilizer Recommendation", prompt: "Recommend the best fertilizer schedule for my tomato crop at the flowering stage." },
  { icon: LineChart, label: "Market Prices", prompt: "Show me today's mandi prices for tomato in Karnataka and the trend over the last 7 days." },
  { icon: Landmark, label: "Government Schemes", prompt: "Which government schemes and subsidies am I eligible for as a small tomato farmer in Karnataka?" },
] as const;

export const SUGGESTED_QUESTIONS = [
  "Why are my tomato leaves turning yellow?",
  "When is the best time to spray pesticide this week?",
  "How much water does my crop need today?",
  "What's the mandi price for tomato in Bengaluru?",
];

export const RECENT_REPORTS = [
  { title: "Leaf spot diagnosis", date: "Yesterday", status: "Resolved" },
  { title: "Soil moisture report", date: "2 days ago", status: "Healthy" },
  { title: "Fertilizer plan — July", date: "5 days ago", status: "Active" },
];

export const TODAYS_TASKS = [
  { title: "Irrigate east block for 45 min", time: "6:00 PM", done: false },
  { title: "Scout for whitefly on tomato rows 4-7", time: "9:00 AM", done: true },
  { title: "Log yield from harvest bin #3", time: "5:30 PM", done: false },
  { title: "Check drip line pressure", time: "7:00 AM", done: true },
];

export const NOTIFICATIONS = [
  {
    icon: CloudRain,
    tone: "sky",
    title: "Rain Alert",
    body: "12mm rainfall expected tomorrow, 6 AM–11 AM. Postpone pesticide spraying.",
    time: "2h ago",
  },
  {
    icon: ShieldAlert,
    tone: "amber",
    title: "Disease Risk",
    body: "Early blight risk rising in your district. Inspect tomato leaves for dark rings.",
    time: "5h ago",
  },
  {
    icon: TrendingUp,
    tone: "emerald",
    title: "Market Change",
    body: "Tomato mandi price up 8.4% this week in Bengaluru. Good window to sell.",
    time: "Yesterday",
  },
  {
    icon: Landmark,
    tone: "violet",
    title: "Government Scheme",
    body: "PM-KUSUM solar pump subsidy now open for Karnataka farmers. Deadline Aug 15.",
    time: "2d ago",
  },
] as const;

export const toneClass: Record<string, string> = {
  sky: "text-sky-300 bg-sky-500/10",
  emerald: "text-emerald-300 bg-emerald-500/10",
  lime: "text-lime-300 bg-lime-500/10",
  amber: "text-amber-300 bg-amber-500/10",
  violet: "text-violet-300 bg-violet-500/10",
};

export { Bell, Cloud };
