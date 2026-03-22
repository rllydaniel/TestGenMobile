import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSupabase } from '@/hooks/useSupabase';
import { uploadNotes } from '@/services/storage';
import { generateQuizFromNotes } from '@/services/api';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

export default function UploadScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const supabase = useSupabase();

  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? '' });
      setError('');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({ uri: asset.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' });
      setError('');
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const publicUrl = await uploadNotes(supabase, file.uri, file.name);
      setUploading(false);
      setGenerating(true);

      const questions = await generateQuizFromNotes(supabase, publicUrl, 10);
      setGenerating(false);

      router.replace({
        pathname: '/(app)/test/[id]',
        params: {
          id: 'upload',
          config: JSON.stringify({
            subjectId: 'upload', topicIds: [], questionCount: questions.length,
            questionType: 'Mixed', difficulty: 'Medium', timerEnabled: false, timerMinutes: 0,
          }),
          questions: JSON.stringify(questions),
        },
      });
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed. Please try again.');
      setUploading(false);
      setGenerating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View style={{ flex: 1, paddingHorizontal: SPACING.screenH, paddingTop: insets.top + SPACING.md, gap: SPACING.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZES.xl - 2, fontFamily: FONTS.displaySemiBold, color: colors.textPrimary, lineHeight: (FONT_SIZES.xl - 2) * 1.2 }}>
            Upload Notes
          </Text>
        </View>

        <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansRegular, color: colors.textMuted, lineHeight: FONT_SIZES.base * 1.6 }}>
          Upload your notes, textbook pages, or study materials and we'll generate a quiz from them using AI.
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={pickDocument}
            style={{
              flex: 1, alignItems: 'center', gap: SPACING.sm, padding: 20,
              borderRadius: RADIUS.lg, borderWidth: 2,
              borderColor: colors.border, borderStyle: 'dashed',
              minHeight: 44,
            }}
          >
            <Ionicons name="document" size={32} color={colors.primary} />
            <Text style={{ fontSize: FONT_SIZES.sm + 1, fontFamily: FONTS.sansSemiBold, color: colors.textPrimary, lineHeight: (FONT_SIZES.sm + 1) * 1.5 }}>
              Browse Files
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansRegular, color: colors.textMuted, textAlign: 'center', lineHeight: FONT_SIZES.xs * 1.5 }}>
              PDF, PPTX, Images
            </Text>
          </Pressable>

          <Pressable
            onPress={pickImage}
            style={{
              flex: 1, alignItems: 'center', gap: SPACING.sm, padding: 20,
              borderRadius: RADIUS.lg, borderWidth: 2,
              borderColor: colors.border, borderStyle: 'dashed',
              minHeight: 44,
            }}
          >
            <Ionicons name="camera" size={32} color={colors.warning} />
            <Text style={{ fontSize: FONT_SIZES.sm + 1, fontFamily: FONTS.sansSemiBold, color: colors.textPrimary, lineHeight: (FONT_SIZES.sm + 1) * 1.5 }}>
              Take Photo
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansRegular, color: colors.textMuted, textAlign: 'center', lineHeight: FONT_SIZES.xs * 1.5 }}>
              Snap your notes
            </Text>
          </Pressable>
        </View>

        {file && (
          <Card style={{ backgroundColor: colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons
                name={file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'document-text' : 'document'}
                size={32}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansSemiBold, color: colors.textPrimary, lineHeight: FONT_SIZES.base * 1.5 }} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansRegular, color: colors.textMuted, lineHeight: FONT_SIZES.sm * 1.5 }}>
                  Ready to process
                </Text>
              </View>
              <Pressable onPress={() => setFile(null)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </Pressable>
            </View>
          </Card>
        )}

        {error ? (
          <Text style={{ color: colors.error, fontSize: FONT_SIZES.sm + 1, fontFamily: FONTS.sansRegular, textAlign: 'center', lineHeight: (FONT_SIZES.sm + 1) * 1.5 }}>
            {error}
          </Text>
        ) : null}

        {(uploading || generating) && (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: SPACING.md }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansRegular, color: colors.textMuted, lineHeight: FONT_SIZES.base * 1.5 }}>
              {uploading ? 'Uploading...' : 'Generating quiz from your notes...'}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ paddingBottom: insets.bottom + SPACING.md }}>
          <Button
            label="Generate Quiz"
            onPress={handleGenerate}
            disabled={!file || uploading || generating}
            loading={uploading || generating}
            size="lg"
            icon={<Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />}
          />
        </View>
      </View>
    </View>
  );
}
