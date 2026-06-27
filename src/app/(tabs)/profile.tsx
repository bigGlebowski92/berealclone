import { useAuth } from '@/context/authContext';
import { formatTimeRemaining } from '@/lib/date-helper';
import { uploadProfileImage } from '@/lib/supabase/storage';
import { supabase } from '@/lib/supabase/client';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivePost {
  id: string;
  image_url: string;
  description?: string;
  expires_at: string;
}

export default function Profile() {
  const { user, isLoading, updateUser, signOut } = useAuth();
  const [activePost, setActivePost] = useState<ActivePost | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const loadActivePost = useCallback(async () => {
    if (!user) {
      setActivePost(null);
      setIsLoadingPost(false);
      return;
    }

    setIsLoadingPost(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, description, expires_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActivePost(data);
    } catch (error) {
      console.error('Error loading active post:', error);
      setActivePost(null);
    } finally {
      setIsLoadingPost(false);
    }
  }, [user]);

  useEffect(() => {
    loadActivePost();
  }, [loadActivePost]);

  const openEditModal = () => {
    if (!user) return;
    setName(user.name || '');
    setUsername(user.username || '');
    setProfileImage(user.profileImage || null);
    setIsEditOpen(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need camera roll permissions to select a profile image.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need camera permissions to take a photo.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!name.trim() || !username.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    setIsSaving(true);
    try {
      const trimmedUsername = username.trim();

      if (trimmedUsername !== user.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', trimmedUsername)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          Alert.alert(
            'Error',
            'This username is already taken. Please choose another one.',
          );
          return;
        }
      }

      let profileImageUrl: string | undefined;
      if (profileImage && profileImage !== user.profileImage) {
        profileImageUrl = await uploadProfileImage(user.id, profileImage);
      }

      await updateUser({
        name: name.trim(),
        username: trimmedUsername,
        ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
      });

      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>Not signed in</Text>
      </SafeAreaView>
    );
  }

  const avatarUri = user.profileImage;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={openEditModal}>
            {avatarUri ? (
              <Image
                cachePolicy="none"
                source={{ uri: avatarUri }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.name}>{user.name || 'No name'}</Text>
          <Text style={styles.username}>@{user.username || 'username'}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Post</Text>
          {isLoadingPost ? (
            <ActivityIndicator style={styles.sectionLoader} color="#000" />
          ) : activePost ? (
            <View style={styles.postCard}>
              <Image
                cachePolicy="none"
                source={{ uri: activePost.image_url }}
                style={styles.postImage}
                contentFit="cover"
              />
              {activePost.description ? (
                <Text style={styles.postDescription}>
                  {activePost.description}
                </Text>
              ) : null}
              <Text style={styles.postMeta}>
                Expires in {formatTimeRemaining(activePost.expires_at)}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No active post. Share a moment from the Home tab.
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={openEditModal}>
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isEditOpen} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TouchableOpacity
              style={styles.editImageContainer}
              onPress={showImagePicker}
            >
              {profileImage ? (
                <Image
                  cachePolicy="none"
                  source={{ uri: profileImage }}
                  style={styles.editAvatar}
                />
              ) : (
                <View style={[styles.editAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>Edit</Text>
              </View>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  sectionLoader: {
    marginVertical: 24,
  },
  postCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
  },
  postDescription: {
    padding: 16,
    paddingBottom: 8,
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  postMeta: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  signOutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  editImageContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#000',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
