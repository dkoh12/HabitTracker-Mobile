import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { HabitWithEntries } from '../types';
import { analyticsService } from '../services/analytics';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

interface AnalyticsStats {
  totalSuccessfulDays: number;
  averageSuccessRate: number;
  longestCurrentStreak: number;
  activeHabits: number;
  totalHabits: number;
  totalEntries: number;
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<HabitWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<AnalyticsStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getHabitsWithAnalytics();
      if (response.success && response.data) {
        setHabits(response.data);
        const stats = analyticsService.calculateOverallStats(response.data);
        setOverallStats(stats);
      } else {
        Alert.alert('Error', response.error || 'Failed to load analytics');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          <Ionicons name={icon as any} size={20} color={color} />
          <Text style={styles.statCardTitle}>{title}</Text>
        </View>
        <Text style={styles.statCardValue}>{value}</Text>
      </View>
    </View>
  );

  const renderProgressChart = () => {
    if (habits.length === 0) return null;

    const progressData = analyticsService.getProgressChartData(habits, parseInt(timeRange));
    
    if (progressData.length === 0) return null;

    // Prepare data for line chart
    const labels = progressData.map(item => item.date);
    const datasets = habits.slice(0, 3).map((habit, index) => ({
      data: progressData.map(item => (item[habit.name] as number) || 0),
      color: (opacity = 1) => habit.color || ['#6366f1', '#10b981', '#f59e0b'][index],
      strokeWidth: 2,
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Habit Progress (Last {timeRange} Days)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: labels,
              datasets: datasets,
            }}
            width={Math.max(chartWidth, labels.length * 50)}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            style={styles.chart}
          />
        </ScrollView>
        <View style={styles.chartLegend}>
          {habits.slice(0, 3).map((habit, index) => (
            <View key={habit.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: habit.color || ['#6366f1', '#10b981', '#f59e0b'][index] },
                ]}
              />
              <Text style={styles.legendText}>{habit.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSuccessRateChart = () => {
    if (habits.length === 0) return null;

    const successData = analyticsService.getSuccessRateData(habits);
    
    const chartData = {
      labels: successData.map(item => item.name.substring(0, 8)),
      datasets: [{
        data: successData.map(item => item.successRate),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Success Rate by Habit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={Math.max(chartWidth, successData.length * 80)}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            style={styles.chart}
            yAxisSuffix="%"
          />
        </ScrollView>
      </View>
    );
  };

  const renderStreakChart = () => {
    if (habits.length === 0) return null;

    const streakData = analyticsService.getStreakComparisonData(habits);
    
    const chartData = {
      labels: streakData.map(item => item.name.substring(0, 8)),
      datasets: [
        {
          data: streakData.map(item => item.currentStreak),
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        },
        {
          data: streakData.map(item => item.bestStreak),
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Current vs Best Streaks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={Math.max(chartWidth, streakData.length * 80)}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            style={styles.chart}
          />
        </ScrollView>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#6366f1' }]} />
            <Text style={styles.legendText}>Current Streak</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Best Streak</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHabitDetails = () => {
    if (habits.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habit Details</Text>
        {habits.map((habit) => {
          const analytics = analyticsService.getHabitAnalytics(habit);
          return (
            <View key={habit.id} style={styles.habitDetailCard}>
              <View style={styles.habitDetailHeader}>
                <View style={[styles.habitColor, { backgroundColor: habit.color }]} />
                <Text style={styles.habitDetailName}>{habit.name}</Text>
                <Text style={styles.habitDetailTarget}>Target: {habit.target} {habit.unit}</Text>
              </View>
              <View style={styles.habitDetailStats}>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatValue}>{analytics.successRate}%</Text>
                  <Text style={styles.habitStatLabel}>Success Rate</Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatValue}>{analytics.currentStreak}</Text>
                  <Text style={styles.habitStatLabel}>Current Streak</Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatValue}>{analytics.bestStreak}</Text>
                  <Text style={styles.habitStatLabel}>Best Streak</Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatValue}>{analytics.successfulDays}</Text>
                  <Text style={styles.habitStatLabel}>Successful Days</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      {(['7', '30', '90'] as const).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeButtonActive,
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text
            style={[
              styles.timeRangeButtonText,
              timeRange === range && styles.timeRangeButtonTextActive,
            ]}
          >
            {range} days
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track your progress and insights</Text>
        </View>

        {renderTimeRangeSelector()}

        {overallStats && (
          <View style={styles.statsContainer}>
            {renderStatsCard(
              'Total Successful Days',
              overallStats.totalSuccessfulDays,
              'checkmark-circle',
              '#10b981'
            )}
            {renderStatsCard(
              'Average Success Rate',
              `${overallStats.averageSuccessRate}%`,
              'trending-up',
              '#6366f1'
            )}
            {renderStatsCard(
              'Longest Current Streak',
              `${overallStats.longestCurrentStreak} days`,
              'flame',
              '#f59e0b'
            )}
            {renderStatsCard(
              'Active Habits',
              overallStats.activeHabits,
              'list',
              '#8b5cf6'
            )}
          </View>
        )}

        {renderProgressChart()}
        {renderSuccessRateChart()}
        {renderStreakChart()}
        {renderHabitDetails()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#6366f1',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardContent: {
    flex: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  habitDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  habitDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  habitDetailTarget: {
    fontSize: 12,
    color: '#64748b',
  },
  habitDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitStat: {
    alignItems: 'center',
    flex: 1,
  },
  habitStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 2,
  },
  habitStatLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
});
