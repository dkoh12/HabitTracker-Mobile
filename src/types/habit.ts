export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  unit?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  habitEntries?: HabitEntry[];
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: Date;
  value: number;
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
  target: number;
  unit?: string;
}

export interface UpdateHabitData extends Partial<CreateHabitData> {
  isActive?: boolean;
}
