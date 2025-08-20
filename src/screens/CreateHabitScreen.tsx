import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { habitService } from '../services/habits';
import { NavigationProps, CreateHabitData } from '../types';

const CreateHabitScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetCount, setTargetCount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ] as const;

  const handleCreateHabit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const target = parseInt(targetCount);
    if (isNaN(target) || target < 1) {
      Alert.alert('Error', 'Please enter a valid target count');
      return;
    }

    const habitData: CreateHabitData = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      frequency,
      target: target,
    };

    setIsLoading(true);
    try {
      const response = await habitService.createHabit(habitData);
      if (response.success) {
        Alert.alert('Success', 'Habit created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to create habit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create habit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter habit name"
            maxLength={50}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorPicker}>
            {colors.map((colorOption) => (
              <TouchableOpacity
                key={colorOption}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOption },
                  color === colorOption && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(colorOption)}
              />
            ))}
          </View>

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.frequencyPicker}>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.frequencyOption,
                  frequency === freq.value && styles.frequencyOptionSelected,
                ]}
                onPress={() => setFrequency(freq.value)}
              >
                <Text
                  style={[
                    styles.frequencyOptionText,
                    frequency === freq.value && styles.frequencyOptionTextSelected,
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Target Count</Text>
          <TextInput
            style={styles.input}
            value={targetCount}
            onChangeText={setTargetCount}
            placeholder="1"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateHabit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating...' : 'Create Habit'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#374151',
  },
  frequencyPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  frequencyOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  frequencyOptionTextSelected: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateHabitScreen;
