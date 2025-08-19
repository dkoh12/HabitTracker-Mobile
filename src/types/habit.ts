export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitWithEntries extends Habit {
  entries: HabitEntry[];
}

export interface CreateHabitData {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
}

export interface UpdateHabitData extends Partial<CreateHabitData> {
  isActive?: boolean;
}
