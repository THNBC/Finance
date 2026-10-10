import type { HouseName } from "./types";

export const HOUSES: HouseName[] = ["Bet365", "Betano", "Superbet"];

export const LOGO_BY_HOUSE: Record<HouseName, string> = {
  Bet365: "/icons/bet365.png",
  Betano: "/icons/betano.png",
  Superbet: "/icons/superbet.png",
};

export const HOUSE_COLORS: Record<HouseName, string> = {
  Bet365: "#22c55e",
  Betano: "#f97316",
  Superbet: "#ef4444",
};

export const HOUSE_DOT_COLORS: Record<HouseName, string> = {
  Bet365: "bg-emerald-400",
  Betano: "bg-orange-400",
  Superbet: "bg-red-400",
};
