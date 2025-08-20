import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  Modal,
  Image,
  FlatList,
  Dimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { 
  LogOut, 
  User as UserIcon, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Trash2, 
  Grid, 
  Upload, 
  Lock, 
  AlertTriangle, 
  Shield,
  TrendingUp,
  Calendar
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  _count?: {
    habits: number;
  };
}

interface UserStats {
  totalPoints: number;
  badgesEarned: number;
  currentStreak: number;
  habitsCompleted: number;
}

interface DefaultAvatar {
  id: string;
  filename: string;
  url: string;
}

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    badgesEarned: 0,
    currentStreak: 0,
    habitsCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  
  // Edit profile states
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Password reset states
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Avatar states
  const [showDefaultAvatars, setShowDefaultAvatars] = useState(false);
  const [defaultAvatars, setDefaultAvatars] = useState<DefaultAvatar[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Rank calculation logic
  const userPoints = userStats.totalPoints;
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
    if (userPoints >= tierThresholds[i]) {
      tierIndex = Math.floor(i / 3);
      numeralIndex = i % 3;
    }
  }
  const currentTier = tiers[tierIndex] || tiers[tiers.length - 1];
  const currentNumeral = numerals[numeralIndex] || numerals[2];

  useEffect(() => {
    const getTokenAndFetchData = async () => {
      if (user) {
        // Get token from secure storage
        const { authService } = await import('../services/auth');
        const storedToken = await authService.getStoredToken();
        setToken(storedToken);
        
        if (storedToken) {
          await fetchProfileData(storedToken);
        }
      }
    };
    
    getTokenAndFetchData();
  }, [user]);

  const fetchProfileData = async (authToken: string) => {
    try {
      // Import apiClient dynamically to avoid circular imports
      const { apiClient } = await import('../services/api');
      
      const profileResponse = await apiClient.get('/profile');

      if (profileResponse.status === 200) {
        const profileData = profileResponse.data;
        setProfile(profileData.user || profileData);
        setEditName(profileData.user?.name || profileData.name || '');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim() || !token) return;
    
    setSaving(true);
    try {
      const { apiClient } = await import('../services/api');
      
      const response = await apiClient.put('/profile', { name: editName.trim() });

      if (response.status === 200) {
        const updatedProfile = response.data;
        setProfile(updatedProfile);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', `Failed to update profile: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    setResettingPassword(true);
    try {
      const { apiClient } = await import('../services/api');
      
      const response = await apiClient.post('/auth/reset-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordReset(false);
      } else {
        Alert.alert('Error', `Failed to update password: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm account deletion');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your habits and data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setDeletingAccount(true);
            try {
              const { apiClient } = await import('../services/api');
              
              const response = await apiClient.delete('/auth/delete-account');

              if (response.status === 200) {
                Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
                signOut();
              } else {
                Alert.alert('Error', `Failed to delete account: ${response.data.error || 'Unknown error'}`);
              }
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete account. Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          }
        }
      ]
    );
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose how you would like to update your profile photo',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImagePicker },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openImagePicker = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image picker:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setUploadingAvatar(true);
    try {
      const { apiClient } = await import('../services/api');
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await apiClient.post('/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        const updatedProfile = response.data.user;
        setProfile(updatedProfile);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        Alert.alert('Error', `Failed to upload photo: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.avatar) return;

    Alert.alert(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            setUploadingAvatar(true);
            try {
              const { apiClient } = await import('../services/api');
              
              const response = await apiClient.delete('/upload-avatar');

              if (response.status === 200) {
                const updatedProfile = response.data.user;
                setProfile(updatedProfile);
                Alert.alert('Success', 'Profile photo removed successfully!');
              } else {
                Alert.alert('Error', `Failed to remove photo: ${response.data.error || 'Unknown error'}`);
              }
            } catch (error: any) {
              console.error('Error removing avatar:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove photo. Please try again.');
            } finally {
              setUploadingAvatar(false);
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <LinearGradient colors={['#f5f7fa', '#c3cfe2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} // Add bottom padding for tab bar
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileHeader}>
              {/* Avatar */}
              <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
                {profile.avatar ? (
                  <>
                    {console.log('Avatar URL:', profile.avatar.startsWith('http') 
                      ? profile.avatar 
                      : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '')}${profile.avatar}`)}
                    <Image 
                      source={{ 
                        uri: profile.avatar.startsWith('http') 
                          ? profile.avatar 
                          : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '')}${profile.avatar}`
                      }} 
                      style={styles.avatar}
                      onError={(error) => {
                        console.error('Image loading error:', error);
                        console.log('Failed to load image URL:', profile.avatar?.startsWith('http') 
                          ? profile.avatar 
                          : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '')}${profile.avatar}`);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully');
                      }}
                    />
                  </>
                ) : (
                  <LinearGradient colors={['#667eea', '#764ba2']} style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                
                {/* Remove Avatar Button */}
                {profile.avatar && (
                  <TouchableOpacity
                    onPress={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    style={[styles.removeAvatarButton, uploadingAvatar && styles.disabledButton]}
                  >
                    <Trash2 color="white" size={12} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <Text style={styles.pageTitle}>My Profile</Text>
                <Text style={styles.pageSubtitle}>Manage your account settings</Text>
              </View>

              {/* Rank */}
              <View style={styles.rankContainer}>
                <Text style={styles.rankLabel}>Rank</Text>
                <View style={styles.shieldContainer}>
                  <Shield color={currentTier.color} size={40} strokeWidth={2.5} />
                  <Text style={[styles.rankNumeral, { color: currentTier.color }]}>
                    {currentNumeral}
                  </Text>
                </View>
                <Text style={[styles.rankName, { color: currentTier.color }]}>
                  {currentTier.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <UserIcon color="#667eea" size={20} />
              <Text style={styles.cardTitle}>Profile Information</Text>
            </View>
            <View style={styles.cardContent}>
              {/* Name Field */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Name</Text>
                {editing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      style={styles.textInput}
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving || !editName.trim()}
                        style={[styles.editButton, styles.saveButton, (!editName.trim() || saving) && styles.disabledButton]}
                      >
                        {saving ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Save color="white" size={16} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditName(profile.name);
                          setEditing(false);
                        }}
                        style={[styles.editButton, styles.cancelButton]}
                      >
                        <X color="#6b7280" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldValue}>{profile.name}</Text>
                    <TouchableOpacity
                      onPress={() => setEditing(true)}
                      style={styles.editIconButton}
                    >
                      <Edit3 color="#6b7280" size={16} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Email Field */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldValue}>{profile.email}</Text>
                </View>
                <Text style={styles.fieldNote}>Email cannot be changed</Text>
              </View>
            </View>
          </View>

          {/* Password & Security Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lock color="#667eea" size={20} />
              <Text style={styles.cardTitle}>Password & Security</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.securityRow}>
                <View style={styles.securityInfo}>
                  <Text style={styles.securityTitle}>Change Password</Text>
                  <Text style={styles.securityDescription}>
                    Update your account password for better security
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPasswordReset(!showPasswordReset)}
                  style={[styles.securityButton, showPasswordReset && styles.securityButtonActive]}
                >
                  <Text style={[styles.securityButtonText, showPasswordReset && styles.securityButtonTextActive]}>
                    {showPasswordReset ? 'Cancel' : 'Change'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPasswordReset && (
                <View style={styles.passwordForm}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Current Password</Text>
                    <TextInput
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                      style={styles.textInput}
                      placeholder="Enter current password"
                      secureTextEntry
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>New Password</Text>
                    <TextInput
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                      style={styles.textInput}
                      placeholder="Enter new password (min. 6 characters)"
                      secureTextEntry
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Confirm New Password</Text>
                    <TextInput
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                      style={styles.textInput}
                      placeholder="Confirm new password"
                      secureTextEntry
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handlePasswordReset}
                    disabled={resettingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    style={[styles.primaryButton, (resettingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) && styles.disabledButton]}
                  >
                    {resettingPassword ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Account Statistics Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TrendingUp color="#10b981" size={20} />
              <Text style={styles.cardTitle}>Account Statistics</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.statsContainer}>
                <LinearGradient colors={['#dbeafe', '#bfdbfe']} style={styles.statCard}>
                  <Text style={styles.statNumber}>{profile._count?.habits || 0}</Text>
                  <Text style={styles.statLabel}>Active Habits</Text>
                </LinearGradient>
                <LinearGradient colors={['#dcfce7', '#bbf7d0']} style={styles.statCard}>
                  <Calendar color="#059669" size={24} style={styles.statIcon} />
                  <Text style={styles.statLabel}>Member Since</Text>
                  <Text style={styles.statDate}>{memberSince}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Danger Zone Card */}
          <View style={[styles.card, styles.dangerCard]}>
            <View style={styles.cardHeader}>
              <AlertTriangle color="#dc2626" size={20} />
              <Text style={[styles.cardTitle, { color: '#dc2626' }]}>Danger Zone</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.securityRow}>
                <View style={styles.securityInfo}>
                  <Text style={styles.dangerTitle}>Delete Account</Text>
                  <Text style={styles.securityDescription}>
                    Permanently delete your account and all data
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  style={[styles.dangerButton, showDeleteConfirm && styles.dangerButtonActive]}
                >
                  <Text style={[styles.dangerButtonText, showDeleteConfirm && styles.dangerButtonTextActive]}>
                    {showDeleteConfirm ? 'Cancel' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDeleteConfirm && (
                <View style={styles.deleteForm}>
                  <View style={styles.warningBox}>
                    <AlertTriangle color="#dc2626" size={20} />
                    <View style={styles.warningContent}>
                      <Text style={styles.warningTitle}>Warning: This action cannot be undone!</Text>
                      <Text style={styles.warningText}>
                        Deleting your account will permanently remove all your habits, progress data, and profile information.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Type "DELETE" to confirm</Text>
                    <TextInput
                      value={deleteConfirmText}
                      onChangeText={setDeleteConfirmText}
                      style={[styles.textInput, styles.dangerInput]}
                      placeholder="Type DELETE here"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                    style={[styles.dangerButton, styles.fullWidthButton, (deletingAccount || deleteConfirmText !== 'DELETE') && styles.disabledButton]}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Trash2 color="white" size={16} />
                        <Text style={styles.dangerButtonText}>Delete My Account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <LogOut color="#ef4444" size={20} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  removeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  profileInfo: {
    flex: 1,
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
  rankContainer: {
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 4,
  },
  shieldContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankNumeral: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rankName: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fieldValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  editIconButton: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dangerInput: {
    borderColor: '#fca5a5',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  securityInfo: {
    flex: 1,
    marginRight: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  securityButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  securityButtonActive: {
    backgroundColor: '#e5e7eb',
  },
  securityButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  securityButtonTextActive: {
    color: '#374151',
  },
  passwordForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
    marginBottom: 4,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerButtonActive: {
    backgroundColor: '#e5e7eb',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButtonTextActive: {
    color: '#374151',
  },
  fullWidthButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  deleteForm: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 16,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#7f1d1d',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
});

export default ProfileScreen;
