export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  type: string;
  threshold?: number;
  earned: boolean;
  earnedDate?: string | null;
  rarity: string;
  color: string;
  points: number;
  requirement?: string;
}

export interface BadgeStats {
  totalPoints: number;
  badgesEarned: number;
  currentStreak: number;
  habitsCompleted: number;
}

export interface BadgeResponse {
  badges: Badge[];
  userStats: BadgeStats;
}

export interface BadgeCategory {
  id: string;
  name: string;
  icon: any; // React component
}
