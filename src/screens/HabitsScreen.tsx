import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckCircle, Circle, TrendingUp, Target, Calendar, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { habitService } from '../services/habits';
import { Habit, NavigationProps } from '../types';

const { width } = Dimensions.get('window');

interface HabitWithStats extends Habit {
  todayCompleted: boolean;
  currentStreak: number;
  bestStreak: number;
  successRate: number;
  completionsThisWeek: number;
  completionsThisMonth: number;
}

const HabitsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadHabits();
  }, []);

  const calculateHabitStats = (habit: Habit): HabitWithStats => {
    const today = new Date().toISOString().split('T')[0];
    const entries = habit.habitEntries || [];
    
    // Check if completed today
    const todayEntry = entries.find(entry => 
      entry.date.toString().split('T')[0] === today
    );
    const todayCompleted = (todayEntry?.value || 0) > 0;

    // Calculate current streak (simplified)
    let currentStreak = 0;
    if (todayCompleted) {
      currentStreak = 1;
      // Could extend this logic to check previous days
    }

    // Calculate best streak (simplified)
    const bestStreak = Math.max(currentStreak, entries.filter(e => e.value > 0).length);

    // Calculate success rate
    const totalEntries = entries.length;
    const completedEntries = entries.filter(e => e.value > 0).length;
    const successRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

    // Calculate this week's completions (simplified)
    const completionsThisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo && entry.value > 0;
    }).length;

    // Calculate this month's completions (simplified)
    const completionsThisMonth = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return entryDate >= monthAgo && entry.value > 0;
    }).length;

    return {
      ...habit,
      todayCompleted,
      currentStreak,
      bestStreak,
      successRate,
      completionsThisWeek,
      completionsThisMonth,
    };
  };

  const loadHabits = async () => {
    try {
      const response = await habitService.getHabits();
      if (response.success && response.data) {
        const habitsWithStats = response.data.map(calculateHabitStats);
        setHabits(habitsWithStats);
      } else {
        Alert.alert('Error', response.error || 'Failed to load habits');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const toggleHabitCompletion = async (habitId: string, isCompleted: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      if (isCompleted) {
        await habitService.markHabitIncomplete(habitId, today);
      } else {
        await habitService.markHabitComplete(habitId, today);
      }
      await loadHabits(); // Refresh to update stats
    } catch (error) {
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const renderStatsCard = () => {
    const completedToday = habits.filter(h => h.todayCompleted).length;
    const totalHabits = habits.length;
    const todayProgress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
    
    const avgSuccessRate = habits.length > 0 
      ? habits.reduce((sum, h) => sum + h.successRate, 0) / habits.length 
      : 0;

    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.statsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.statsTitle}>Today's Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedToday}/{totalHabits}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(todayProgress)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(avgSuccessRate)}%</Text>
            <Text style={styles.statLabel}>Avg Success</Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderHabitCard = ({ item }: { item: HabitWithStats }) => {
    const getProgressValue = () => {
      switch (selectedPeriod) {
        case 'week': return item.completionsThisWeek;
        case 'month': return item.completionsThisMonth;
        default: return item.todayCompleted ? 1 : 0;
      }
    };

    const getTargetValue = () => {
      switch (selectedPeriod) {
        case 'week': return 7;
        case 'month': return 30;
        default: return 1;
      }
    };

    const progress = getProgressValue();
    const target = getTargetValue();
    const progressPercent = (progress / target) * 100;

    return (
      <TouchableOpacity
        style={[styles.habitCard, { borderLeftColor: item.color }]}
        onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
      >
        <View style={styles.habitHeader}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{item.name}</Text>
            <Text style={styles.habitDescription}>{item.description}</Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleHabitCompletion(item.id, item.todayCompleted)}
            style={styles.checkButton}
          >
            {item.todayCompleted ? (
              <CheckCircle size={28} color="#10B981" />
            ) : (
              <Circle size={28} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progressPercent, 100)}%`,
                  backgroundColor: item.color 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress}/{target}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.miniStat}>
            <Flame size={16} color="#F59E0B" />
            <Text style={styles.miniStatText}>{item.currentStreak}</Text>
          </View>
          <View style={styles.miniStat}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={styles.miniStatText}>{item.successRate}%</Text>
          </View>
          <View style={styles.miniStat}>
            <Target size={16} color="#6366F1" />
            <Text style={styles.miniStatText}>{item.bestStreak}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['today', 'week', 'month'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habits</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateHabit')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderStatsCard()}
        {renderPeriodSelector()}

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>
              Create your first habit to start building better routines
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Text style={styles.createFirstButtonText}>Create First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            renderItem={renderHabitCard}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#374151',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
    marginRight: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default HabitsScreen;
