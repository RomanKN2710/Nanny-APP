import { DEFAULT_HOLIDAY_IDS } from "./holidays";
import type { Settings } from "./types";

// Values from the employment contract (Contrat de travail: Garde d'enfants).
export const DEFAULT_SETTINGS: Settings = {
  familyName: "Knipprath",
  nannyName: "Amina",
  startDate: "2026-09-14", // §4
  weeklyHours: 33.5, // §5
  workDays: [1, 2, 3, 4, 5],
  vacationWeeks: 5, // §10
  monthlySalary: 4365, // §8, gross
  currency: "CHF",
  enabledHolidays: DEFAULT_HOLIDAY_IDS,
  customHolidays: [],
  children: [
    { id: "c1", name: "Child 1 (10)", color: "#7DB7E8", emoji: "🦊" },
    { id: "c2", name: "Child 2 (7)", color: "#5BBFA0", emoji: "🐢" },
    { id: "c3", name: "Child 3 (6)", color: "#F6C85F", emoji: "🐝" },
    { id: "c4", name: "Child 4 (3)", color: "#F2785C", emoji: "🐣" },
  ],
  defaultLang: "fr",
};

export const CHILD_COLORS = ["#7DB7E8", "#5BBFA0", "#F6C85F", "#F2785C", "#B39DDB", "#F28DB2", "#8FD3E8"];
