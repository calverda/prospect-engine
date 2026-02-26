import type { IndustryKey } from "@/lib/pipeline/types";

export interface IndustryConfig {
  name: string;
  searchTerms: string[];
  avgTicket: { service: number; install: number };
  conversionRate: number;
  closeRate: number;
  gbpCategory: string;
  defaultServices: { name: string; icon: string; desc: string }[];
  whyChoose: { title: string; desc: string }[];
  warrantyText: string;
  badgeText: string;
  availabilityText: string;
}

export const INDUSTRIES: Record<IndustryKey, IndustryConfig> = {
  hvac: {
    name: "HVAC",
    searchTerms: [
      "hvac repair",
      "ac repair",
      "heating repair",
      "furnace repair",
      "air conditioning installation",
      "hvac service",
      "emergency hvac",
    ],
    avgTicket: { service: 350, install: 8500 },
    conversionRate: 0.12,
    closeRate: 0.45,
    gbpCategory: "HVAC contractor",
    defaultServices: [
      { name: "AC Repair & Service", icon: "❄️", desc: "Fast, reliable air conditioning repair. Same-day service available." },
      { name: "Heating System Repair", icon: "🔥", desc: "Expert furnace and heating system repair for all winter long." },
      { name: "HVAC Installation", icon: "🌬️", desc: "Professional installation of new heating and cooling systems." },
      { name: "Preventive Maintenance", icon: "📋", desc: "Regular tune-ups that extend equipment life and prevent breakdowns." },
      { name: "Ductwork Services", icon: "🔧", desc: "Duct cleaning, repair, and installation for optimal airflow." },
      { name: "Indoor Air Quality", icon: "🏠", desc: "Air purifiers, humidifiers, and filtration for healthier air." },
    ],
    whyChoose: [
      { title: "Same-Day Emergency Service", desc: "Most calls answered within 2 hours." },
      { title: "Licensed & Factory-Trained", desc: "Certified by top manufacturers with continuous training." },
      { title: "Upfront Pricing", desc: "Clear quote before any work begins, guaranteed." },
      { title: "Satisfaction Guaranteed", desc: "Not happy? We come back and make it right — free." },
    ],
    warrantyText: "1-Year Labor Warranty",
    badgeText: "24/7 Emergency Service",
    availabilityText: "Available now — same-day service",
  },

  plumbing: {
    name: "Plumbing",
    searchTerms: [
      "plumber near me",
      "emergency plumber",
      "plumbing repair",
      "drain cleaning",
      "water heater repair",
      "pipe repair",
      "sewer line repair",
    ],
    avgTicket: { service: 280, install: 4500 },
    conversionRate: 0.14,
    closeRate: 0.5,
    gbpCategory: "Plumber",
    defaultServices: [
      { name: "Emergency Repairs", icon: "🔧", desc: "Burst pipes, major leaks, and emergencies handled 24/7." },
      { name: "Drain Cleaning", icon: "🚿", desc: "Professional drain clearing for clogs and sewer backups." },
      { name: "Fixture Installation", icon: "🚰", desc: "Faucets, toilets, sinks, and tubs installed with precision." },
      { name: "Water Heater Service", icon: "🔥", desc: "Tank and tankless water heater repair and replacement." },
      { name: "Repiping & Pipe Repair", icon: "🏗️", desc: "Complete repiping and targeted repair for older homes." },
      { name: "Leak Detection", icon: "🔍", desc: "Advanced technology to find hidden leaks before they cause damage." },
    ],
    whyChoose: [
      { title: "Fast Response Times", desc: "Most calls serviced within 90 minutes." },
      { title: "Licensed Master Plumber", desc: "Every job supervised by a licensed master plumber." },
      { title: "Clean & Respectful", desc: "Shoe covers, drop cloths, thorough cleanup every time." },
      { title: "Fair, Honest Pricing", desc: "Detailed written estimates before starting. No hidden fees." },
    ],
    warrantyText: "1-Year Parts & Labor",
    badgeText: "24/7 Emergency Service",
    availabilityText: "Emergency plumber on call now",
  },

  electrician: {
    name: "Electrical",
    searchTerms: [
      "electrician near me",
      "electrical repair",
      "panel upgrade",
      "rewiring",
      "lighting installation",
      "generator installation",
      "ev charger",
    ],
    avgTicket: { service: 320, install: 6000 },
    conversionRate: 0.11,
    closeRate: 0.42,
    gbpCategory: "Electrician",
    defaultServices: [
      { name: "Electrical Repair", icon: "⚡", desc: "Troubleshooting and repair of all electrical issues." },
      { name: "Lighting Installation", icon: "💡", desc: "Interior, exterior, and landscape lighting design." },
      { name: "Panel Upgrades", icon: "🔌", desc: "Panel upgrades to handle modern power demands." },
      { name: "Whole-Home Rewiring", icon: "🏠", desc: "Complete rewiring for older homes to meet safety codes." },
      { name: "Generator Installation", icon: "🔋", desc: "Standby generator installation for uninterrupted power." },
      { name: "EV Charger Install", icon: "🛡️", desc: "Level 2 electric vehicle charger for home or business." },
    ],
    whyChoose: [
      { title: "Safety First", desc: "Every job completed to NEC code standards." },
      { title: "Master Electrician Led", desc: "Licensed master electricians on every project." },
      { title: "Transparent Quotes", desc: "Itemized quotes. The price we quote is the price you pay." },
      { title: "Lifetime Warranty", desc: "We stand behind every installation for life." },
    ],
    warrantyText: "Lifetime Workmanship Warranty",
    badgeText: "Licensed & Insured",
    availabilityText: "Same-day appointments available",
  },

  landscaping: {
    name: "Landscaping",
    searchTerms: [
      "landscaper near me",
      "lawn care",
      "landscape design",
      "tree service",
      "hardscaping",
      "sprinkler system",
      "mulching",
    ],
    avgTicket: { service: 200, install: 12000 },
    conversionRate: 0.1,
    closeRate: 0.38,
    gbpCategory: "Landscaper",
    defaultServices: [
      { name: "Lawn Maintenance", icon: "🌿", desc: "Weekly and bi-weekly mowing, edging, and trimming." },
      { name: "Landscape Design", icon: "🏡", desc: "Custom design that transforms your outdoor space." },
      { name: "Tree & Shrub Care", icon: "🌳", desc: "Pruning, trimming, removal, and health treatments." },
      { name: "Hardscaping", icon: "💎", desc: "Patios, walkways, retaining walls built to last." },
      { name: "Irrigation Systems", icon: "💧", desc: "Sprinkler design, installation, and maintenance." },
      { name: "Seasonal Cleanup", icon: "🍂", desc: "Spring/fall cleanup including leaf removal and mulching." },
    ],
    whyChoose: [
      { title: "Design + Build", desc: "One team from concept to completion." },
      { title: "Reliable & Consistent", desc: "We show up on schedule, every time." },
      { title: "Local Knowledge", desc: "We know what thrives in your climate and soil." },
      { title: "Fully Insured", desc: "Complete liability and workers' comp coverage." },
    ],
    warrantyText: "Plant Survival Guarantee",
    badgeText: "Free Design Consultation",
    availabilityText: "Scheduling for this week",
  },

  dental: {
    name: "Dental",
    searchTerms: [
      "dentist near me",
      "dental office",
      "teeth cleaning",
      "dental implants",
      "cosmetic dentist",
      "emergency dentist",
    ],
    avgTicket: { service: 250, install: 5000 },
    conversionRate: 0.08,
    closeRate: 0.55,
    gbpCategory: "Dentist",
    defaultServices: [
      { name: "General Dentistry", icon: "🦷", desc: "Exams, cleanings, fillings, and preventive care." },
      { name: "Cosmetic Dentistry", icon: "✨", desc: "Veneers, bonding, and smile makeovers." },
      { name: "Teeth Whitening", icon: "😁", desc: "Professional in-office and take-home whitening." },
      { name: "Dental Implants", icon: "🔬", desc: "Permanent tooth replacement that looks natural." },
      { name: "Pediatric Dentistry", icon: "👶", desc: "Gentle, kid-friendly care in a welcoming environment." },
      { name: "Emergency Dental", icon: "🆘", desc: "Same-day emergency appointments for dental trauma." },
    ],
    whyChoose: [
      { title: "Modern Technology", desc: "Digital x-rays, intraoral cameras, same-day crowns." },
      { title: "Gentle & Comfortable", desc: "Sedation options for anxious patients." },
      { title: "Insurance Friendly", desc: "Most major plans accepted with flexible payment." },
      { title: "Experienced Team", desc: "Decades of combined experience and advanced training." },
    ],
    warrantyText: "Satisfaction Guaranteed",
    badgeText: "Accepting New Patients",
    availabilityText: "Same-week appointments available",
  },

  behavioral_health: {
    name: "Behavioral Health",
    searchTerms: [
      "therapist near me",
      "counselor near me",
      "anxiety treatment",
      "depression therapy",
      "couples counseling",
      "mental health services",
    ],
    avgTicket: { service: 175, install: 0 },
    conversionRate: 0.09,
    closeRate: 0.6,
    gbpCategory: "Mental health service",
    defaultServices: [
      { name: "Individual Therapy", icon: "🧠", desc: "One-on-one therapy for anxiety, depression, and trauma." },
      { name: "Couples Counseling", icon: "💬", desc: "Evidence-based couples therapy approaches." },
      { name: "Family Therapy", icon: "👫", desc: "Improve communication and resolve conflicts together." },
      { name: "Group Therapy", icon: "👨‍👩‍👧", desc: "Supportive group sessions for shared experiences." },
      { name: "Stress & Anxiety", icon: "🧘", desc: "Proven techniques for managing anxiety and stress." },
      { name: "Psychiatric Evaluation", icon: "📋", desc: "Comprehensive assessments and medication management." },
    ],
    whyChoose: [
      { title: "Evidence-Based", desc: "CBT, DBT, EMDR, and other proven methods." },
      { title: "Safe Environment", desc: "Confidential, judgment-free space for healing." },
      { title: "Insurance Accepted", desc: "Most plans accepted with sliding scale options." },
      { title: "Flexible Scheduling", desc: "Evening, weekend, and telehealth available." },
    ],
    warrantyText: "Free Initial Consultation",
    badgeText: "Now Accepting Clients",
    availabilityText: "Appointments available this week",
  },
};
