import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSupabase } from '@/hooks/useSupabase';
import { uploadNotes } from '@/services/storage';
import { generateQuizFromNotes } from '@/services/api';

export default function UploadScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
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
            subjectId: 'upload',
            topicIds: [],
            questionCount: questions.length,
            questionType: 'Mixed',
            difficulty: 'Medium',
            timerEnabled: false,
            timerMinutes: 0,
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }}
    >
      <View style={{ flex: 1, padding: 16, gap: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="close"
              size={28}
              color={isDark ? '#FFFFFF' : '#1A1A2E'}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          >
            Upload Notes
          </Text>
        </View>

        <Text
          style={{
            fontSize: 15,
            color: isDark ? '#ADB5BD' : '#6C757D',
            lineHeight: 22,
          }}
        >
          Upload your notes, textbook pages, or study materials and we'll
          generate a quiz from them using AI.
        </Text>

        {/* Upload Options */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={pickDocument}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 8,
              padding: 20,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: isDark ? '#2D3A5C' : '#E5E7EB',
              borderStyle: 'dashed',
            }}
          >
            <Ionicons name="document" size={32} color="#6C5CE7" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#1A1A2E',
              }}
            >
              Browse Files
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#ADB5BD' : '#6C757D',
                textAlign: 'center',
              }}
            >
              PDF, PPTX, Images
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 8,
              padding: 20,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: isDark ? '#2D3A5C' : '#E5E7EB',
              borderStyle: 'dashed',
            }}
          >
            <Ionicons name="camera" size={32} color="#FD79A8" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#1A1A2E',
              }}
            >
              Take Photo
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#ADB5BD' : '#6C757D',
                textAlign: 'center',
              }}
            >
              Snap your notes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected File Preview */}
        {file && (
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Ionicons
                name={
                  file.type.includes('image')
                    ? 'image'
                    : file.type.includes('pdf')
                      ? 'document-text'
                      : 'document'
                }
                size={32}
                color="#6C5CE7"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: isDark ? '#FFFFFF' : '#1A1A2E',
                  }}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#ADB5BD' : '#6C757D',
                  }}
                >
                  Ready to process
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {error ? (
          <Text style={{ color: '#FF6B6B', fontSize: 14, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        {(uploading || generating) && (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text
              style={{
                fontSize: 15,
                color: isDark ? '#ADB5BD' : '#6C757D',
              }}
            >
              {uploading ? 'Uploading...' : 'Generating quiz from your notes...'}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <Button
          title="Generate Quiz"
          onPress={handleGenerate}
          disabled={!file || uploading || generating}
          loading={uploading || generating}
          size="lg"
          icon={<Ionicons name="sparkles" size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
