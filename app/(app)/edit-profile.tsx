import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState(profile?.username ?? user?.user_metadata?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() ?? 'jpg';
      const fileName = `${user!.id}-${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) {
        Alert.alert('Upload Failed', uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        username: username.trim() || 'Student',
        bio: bio.trim(),
        avatarUrl,
      } as any);
      router.back();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const initial = (username || 'U')[0].toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.xl }}>
          <Pressable
            onPress={() => router.back()}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZES.xl, fontFamily: FONTS.displaySemiBold, color: colors.textPrimary, lineHeight: FONT_SIZES.xl * 1.2, flex: 1 }}>
            Edit Profile
          </Text>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
          <Pressable onPress={pickImage} style={{ position: 'relative' }}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary }}
              />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 40, fontFamily: FONTS.sansBold, color: '#FFFFFF' }}>{initial}</Text>
              </View>
            )}
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: colors.appBackground,
            }}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
          <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.sm, color: colors.textMuted, marginTop: SPACING.sm }}>
            Tap to change photo
          </Text>
        </View>

        {/* Username */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xs, color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: SPACING.sm }}>
            USERNAME
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your name"
            placeholderTextColor={colors.textFaint}
            style={{
              fontFamily: FONTS.sansRegular,
              fontSize: FONT_SIZES.base,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              minHeight: 48,
            }}
            maxLength={30}
          />
        </View>

        {/* Bio */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.xs, color: colors.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: SPACING.sm }}>
            BIO
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.textFaint}
            multiline
            numberOfLines={4}
            style={{
              fontFamily: FONTS.sansRegular,
              fontSize: FONT_SIZES.base,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
            maxLength={200}
          />
          <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.xs, color: colors.textFaint, marginTop: 4, textAlign: 'right' }}>
            {bio.length}/200
          </Text>
        </View>

        {/* Save */}
        <Button
          label={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          loading={saving}
          size="lg"
        />
      </ScrollView>
    </View>
  );
}
