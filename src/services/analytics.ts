import { apiClient, handleApiResponse, handleApiError } from './api';
import { Habit, HabitWithEntries, ApiResponse } from '../types';

interface AnalyticsStats {
  totalSuccessfulDays: number;
  averageSuccessRate: number;
  longestCurrentStreak: number;
  activeHabits: number;
  totalHabits: number;
  totalEntries: number;
}

interface HabitAnalytics {
  successRate: number;
  currentStreak: number;
  bestStreak: number;
  totalTracked: number;
  successfulDays: number;
  last30Days: Array<{
    date: string;
    value: number;
    completed: boolean;
  }>;
}

interface ProgressData {
  date: string;
  [habitName: string]: string | number;
}

export const analyticsService = {
  // Since habits endpoint already returns habit entries, we'll use that
  async getHabitsWithAnalytics(): Promise<ApiResponse<HabitWithEntries[] | null>> {
    try {
      const response = await apiClient.get('/habits');
      return handleApiResponse<HabitWithEntries[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Calculate detailed stats for each habit
  getHabitAnalytics(habit: HabitWithEntries): HabitAnalytics {
    const entries = (habit.habitEntries || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const successfulDays = entries.filter(entry => entry.value > 0).length;
    const totalTracked = entries.length;
    const successRate = totalTracked > 0 ? Math.round((successfulDays / totalTracked) * 100) : 0;

    // Calculate current streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort entries by date
    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate current streak (from today backwards)
    const today = new Date();
    const checkDate = new Date(today);
    
    while (checkDate >= new Date(sortedEntries[0]?.date || today)) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const entry = sortedEntries.find(e => e.date.toString().split('T')[0] === dateStr);
      
      if (entry && entry.value > 0) {
        currentStreak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate best streak
    sortedEntries.forEach(entry => {
      if (entry.value > 0) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Get last 30 days for visualization
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = entries.find(e => e.date.toString().split('T')[0] === dateStr);
      last30Days.push({
        date: dateStr,
        value: entry?.value || 0,
        completed: (entry?.value || 0) > 0
      });
    }

    return {
      successRate,
      currentStreak,
      bestStreak,
      totalTracked,
      successfulDays,
      last30Days
    };
  },

  // Calculate overall user analytics
  calculateOverallStats(habits: HabitWithEntries[]): AnalyticsStats {
    if (habits.length === 0) {
      return {
        totalSuccessfulDays: 0,
        averageSuccessRate: 0,
        longestCurrentStreak: 0,
        activeHabits: 0,
        totalHabits: 0,
        totalEntries: 0
      };
    }

    const habitAnalytics = habits.map(habit => this.getHabitAnalytics(habit));
    
    const totalSuccessfulDays = habitAnalytics.reduce((sum, analytics) => sum + analytics.successfulDays, 0);
    const averageSuccessRate = Math.round(habitAnalytics.reduce((sum, analytics) => sum + analytics.successRate, 0) / habits.length);
    const longestCurrentStreak = Math.max(...habitAnalytics.map(analytics => analytics.currentStreak));
    const totalEntries = habitAnalytics.reduce((sum, analytics) => sum + analytics.totalTracked, 0);

    return {
      totalSuccessfulDays,
      averageSuccessRate,
      longestCurrentStreak,
      activeHabits: habits.length,
      totalHabits: habits.length,
      totalEntries
    };
  },

  // Generate progress chart data for the last N days
  getProgressChartData(habits: HabitWithEntries[], days: number = 30): ProgressData[] {
    const progressData: ProgressData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dateForChart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayData: ProgressData = { date: dateForChart };
      
      habits.forEach(habit => {
        const entry = (habit.habitEntries || []).find(e => {
          const entryDateStr = e.date.toString().substring(0, 10);
          return entryDateStr === dateStr;
        });
        
        // Normalize to percentage of target (0-100%)
        const rawValue = entry?.value || 0;
        const percentage = habit.target > 0 ? Math.min((rawValue / habit.target) * 100, 100) : 0;
        dayData[habit.name] = Math.round(percentage);
      });
      
      progressData.push(dayData);
    }
    
    return progressData;
  },

  // Generate success rate comparison data
  getSuccessRateData(habits: HabitWithEntries[]) {
    return habits.map(habit => {
      const analytics = this.getHabitAnalytics(habit);
      return {
        name: habit.name,
        successRate: analytics.successRate,
        completedDays: analytics.successfulDays,
        totalDays: analytics.totalTracked,
        color: habit.color
      };
    });
  },

  // Generate streak comparison data
  getStreakComparisonData(habits: HabitWithEntries[]) {
    return habits.map(habit => {
      const analytics = this.getHabitAnalytics(habit);
      return {
        name: habit.name,
        currentStreak: analytics.currentStreak,
        bestStreak: analytics.bestStreak,
        color: habit.color
      };
    });
  }
};
