import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckCircle, Circle } from 'lucide-react-native';
import { habitService } from '../services/habits';
import { Habit, NavigationProps } from '../types';

const HabitsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await habitService.getHabits();
      if (response.success && response.data) {
        setHabits(response.data);
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
      // Refresh the habits list to show updated status
      await loadHabits();
    } catch (error) {
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const renderHabitItem = ({ item }: { item: Habit }) => {
    // This is simplified - in a real app, you'd check today's entry
    const isCompletedToday = false; // You'd check this against today's entries
    
    return (
      <TouchableOpacity
        style={styles.habitItem}
        onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
      >
        <View style={styles.habitInfo}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.habitText}>
            <Text style={styles.habitName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.habitDescription}>{item.description}</Text>
            )}
            <Text style={styles.habitFrequency}>{item.frequency}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => toggleHabitCompletion(item.id, isCompletedToday)}
        >
          {isCompletedToday ? (
            <CheckCircle color="#10b981" size={24} />
          ) : (
            <Circle color="#d1d5db" size={24} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habits</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateHabit')}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {habits.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No habits yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first habit to start tracking your progress
          </Text>
          <TouchableOpacity
            style={styles.createFirstHabitButton}
            onPress={() => navigation.navigate('CreateHabit')}
          >
            <Text style={styles.createFirstHabitButtonText}>Create Habit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabitItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  habitItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  habitText: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  checkButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstHabitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstHabitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HabitsScreen;
