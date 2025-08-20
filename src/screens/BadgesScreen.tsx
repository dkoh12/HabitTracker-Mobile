import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Star,
  Flame,
  Target,
  TrendingUp,
  Crown,
  CheckCircle2,
  Trophy,
  Award,
  Zap,
  Heart,
  BookOpen,
  Clock,
  Moon,
  Users,
  UserCheck,
  UserPlus,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth';
import { badgeService } from '../services/badges';
import { Badge, BadgeStats, BadgeCategory } from '../types';

const { width } = Dimensions.get('window');

const BadgesScreen: React.FC = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userStats, setUserStats] = useState<BadgeStats>({
    totalPoints: 0,
    badgesEarned: 0,
    currentStreak: 0,
    habitsCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMoreEarned, setShowMoreEarned] = useState(false);
  const [showMoreNotEarned, setShowMoreNotEarned] = useState(false);

  // Badge categories with icons
  const categories: BadgeCategory[] = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'beginner', name: 'Beginner', icon: Star },
    { id: 'streak', name: 'Streak', icon: Flame },
    { id: 'consistency', name: 'Consistency', icon: Target },
    { id: 'achievement', name: 'Achievement', icon: Award },
    { id: 'special', name: 'Special', icon: Crown },
    { id: 'social', name: 'Social', icon: Users }
  ];

  // Rank calculation logic (same as ProfileScreen)
  const tiers = [
    { name: 'BRONZE', color: '#cd7f32' },
    { name: 'SILVER', color: '#c0c0c0' },
    { name: 'GOLD', color: '#ffd700' },
    { name: 'DIAMOND', color: '#4f8ff7' },
    { name: 'PLATINUM', color: '#9333ea' }
  ];
  const numerals = ['III', 'II', 'I'];
  const tierThresholds = [
    0, 100, 250,   // BRONZE III, II, I
    500, 900, 1400, // SILVER III, II, I
    2000, 2700, 3500, // GOLD III, II, I
    4400, 5400, 6500, // DIAMOND III, II, I
    7700, 9000, 10400 // PLATINUM III, II, I
  ];
  
  let tierIndex = 0;
  let numeralIndex = 0;
  for (let i = 0; i < tierThresholds.length; i++) {
    if (userStats.totalPoints >= tierThresholds[i]) {
      tierIndex = Math.floor(i / 3);
      numeralIndex = i % 3;
    }
  }
  const currentTier = tiers[tierIndex] || tiers[0];
  const currentNumeral = numerals[numeralIndex] || numerals[2];

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      const response = await badgeService.getBadges();
      
      if (response.success && response.data) {
        setBadges(response.data.badges);
        setUserStats(response.data.userStats);
      } else {
        Alert.alert('Error', 'Failed to load badges');
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
      Alert.alert('Error', 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user, fetchBadges]);

  // Get icon component from icon string
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Star': Star,
      'Flame': Flame,
      'Target': Target,
      'TrendingUp': TrendingUp,
      'Crown': Crown,
      'CheckCircle2': CheckCircle2,
      'Trophy': Trophy,
      'Award': Award,
      'Zap': Zap,
      'Heart': Heart,
      'BookOpen': BookOpen,
      'Clock': Clock,
      'Moon': Moon,
      'Users': Users,
      'UserCheck': UserCheck,
      'UserPlus': UserPlus
    };
    return iconMap[iconName] || Trophy;
  };

  // Filter badges by category
  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  const earnedBadges = filteredBadges.filter(badge => badge.earned);
  const notEarnedBadges = filteredBadges.filter(badge => !badge.earned);

  const displayedEarnedBadges = showMoreEarned ? earnedBadges : earnedBadges.slice(0, 6);
  const displayedNotEarnedBadges = showMoreNotEarned ? notEarnedBadges : notEarnedBadges.slice(0, 6);

  const renderBadge = ({ item: badge }: { item: Badge }) => {
    const IconComponent = getIconComponent(badge.icon);
    
    return (
      <TouchableOpacity style={[styles.badgeCard, badge.earned && styles.earnedBadge]}>
        <LinearGradient
          colors={badge.earned ? [badge.color + '20', badge.color + '10'] : ['#f8f9fa', '#e9ecef']}
          style={styles.badgeGradient}
        >
          <View style={styles.badgeIconContainer}>
            <IconComponent 
              size={32} 
              color={badge.earned ? badge.color : '#6c757d'} 
              strokeWidth={2}
            />
          </View>
          
          <Text style={[styles.badgeName, { color: badge.earned ? badge.color : '#6c757d' }]}>
            {badge.name}
          </Text>
          
          <Text style={styles.badgeDescription} numberOfLines={2}>
            {badge.description}
          </Text>
          
          <View style={styles.badgeFooter}>
            <Text style={[styles.badgePoints, { color: badge.earned ? badge.color : '#6c757d' }]}>
              {badge.points} pts
            </Text>
            <Text style={[styles.badgeRarity, styles[`rarity${badge.rarity}` as keyof typeof styles]]}>
              {badge.rarity}
            </Text>
          </View>
          
          {badge.earned && badge.earnedDate && (
            <Text style={styles.earnedDate}>
              Earned {new Date(badge.earnedDate).toLocaleDateString()}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Badges & Achievements</Text>
            <Text style={styles.pageSubtitle}>Track your progress and earn rewards</Text>
          </View>

          {/* Rank Display */}
          <View style={styles.rankSection}>
            <Text style={styles.rankLabel}>Current Rank</Text>
            <View style={styles.shieldContainer}>
              <Shield color={currentTier.color} size={80} strokeWidth={2.5} />
              <Text style={[styles.rankNumeral, { color: currentTier.color }]}>
                {currentNumeral}
              </Text>
            </View>
            <Text style={[styles.rankName, { color: currentTier.color }]}>
              {currentTier.name} {currentNumeral}
            </Text>
            <Text style={styles.rankPoints}>{userStats.totalPoints} Points</Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.badgesEarned}</Text>
              <Text style={styles.statLabel}>Badges Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>
                {badges.length - userStats.badgesEarned}
              </Text>
              <Text style={styles.statLabel}>To Earn</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                {userStats.currentStreak}
              </Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map(category => {
              const IconComponent = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[styles.categoryButton, isActive && styles.activeCategoryButton]}
                >
                  <IconComponent size={16} color={isActive ? 'white' : '#6b7280'} />
                  <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Earned Badges Section */}
          {earnedBadges.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Earned Badges ({earnedBadges.length})</Text>
                {earnedBadges.length > 6 && (
                  <TouchableOpacity
                    onPress={() => setShowMoreEarned(!showMoreEarned)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showMoreEarned ? 'Show Less' : 'Show More'}
                    </Text>
                    {showMoreEarned ? (
                      <ChevronUp size={16} color="#667eea" />
                    ) : (
                      <ChevronDown size={16} color="#667eea" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              <FlatList
                data={displayedEarnedBadges}
                renderItem={renderBadge}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.badgeRow}
                ItemSeparatorComponent={() => <View style={styles.badgeSeparator} />}
              />
            </View>
          )}

          {/* Not Earned Badges Section */}
          {notEarnedBadges.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Available Badges ({notEarnedBadges.length})</Text>
                {notEarnedBadges.length > 6 && (
                  <TouchableOpacity
                    onPress={() => setShowMoreNotEarned(!showMoreNotEarned)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showMoreNotEarned ? 'Show Less' : 'Show More'}
                    </Text>
                    {showMoreNotEarned ? (
                      <ChevronUp size={16} color="#667eea" />
                    ) : (
                      <ChevronDown size={16} color="#667eea" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              <FlatList
                data={displayedNotEarnedBadges}
                renderItem={renderBadge}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.badgeRow}
                ItemSeparatorComponent={() => <View style={styles.badgeSeparator} />}
              />
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  rankSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rankLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  shieldContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankNumeral: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rankName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  rankPoints: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeCategoryButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeCategoryText: {
    color: 'white',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  badgeRow: {
    justifyContent: 'space-between',
  },
  badgeSeparator: {
    height: 12,
  },
  badgeCard: {
    width: (width - 52) / 2, // Account for padding and gap
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  earnedBadge: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  badgeGradient: {
    padding: 16,
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  badgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  badgePoints: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeRarity: {
    fontSize: 10,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  raritycommon: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
  },
  rarityuncommon: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  rarityrare: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  rarity_epic: {
    backgroundColor: '#f3e8ff',
    color: '#9333ea',
  },
  raritylegendary: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  earnedDate: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BadgesScreen;
