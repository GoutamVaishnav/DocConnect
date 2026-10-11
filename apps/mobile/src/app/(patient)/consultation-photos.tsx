import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { ConsultationHeader } from '@/components/consultation-header';
import { useConsultationDraft, type ConsultationPhoto } from '@/context/consultation-draft';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const maximumPhotos = 3;

export default function ConsultationPhotosScreen() {
  const { draft, setPhotos } = useConsultationDraft();

  async function choosePhotos() {
    const remainingSlots = maximumPhotos - draft.photos.length;
    if (remainingSlots === 0) {
      Alert.alert('Maximum photos added', `You can add up to ${maximumPhotos} photos to one consultation.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled) {
      const newPhotos: ConsultationPhoto[] = result.assets.slice(0, remainingSlots).map((asset, index) => ({
        fileName: asset.fileName ?? `Medical photo ${draft.photos.length + index + 1}`,
        id: `${asset.uri}-${Date.now()}-${index}`,
        mimeType: asset.mimeType,
        uri: asset.uri,
      }));
      setPhotos([...draft.photos, ...newPhotos]);
    }
  }

  function removePhoto(id: string) {
    setPhotos(draft.photos.filter((photo) => photo.id !== id));
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ConsultationHeader step={2} title="Add Photos" />

          <View style={styles.heading}>
            <Text style={typography.screenTitle}>Add Photos</Text>
            <Text style={styles.description}>Clear photos can help the doctor review your concern. This step is optional.</Text>
          </View>

          {draft.photos.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={choosePhotos} style={styles.uploadArea}>
              <View style={styles.uploadIcon}>
                <MaterialCommunityIcons color={colors.patient.primary} name="image-plus" size={34} />
              </View>
              <Text style={styles.uploadTitle}>Choose photos from your gallery</Text>
              <Text style={styles.uploadText}>Add up to {maximumPhotos} clear images</Text>
            </Pressable>
          ) : (
            <View style={styles.photoGrid}>
              {draft.photos.map((photo) => (
                <View key={photo.id} style={styles.photoTile}>
                  <Image accessibilityLabel={photo.fileName} source={{ uri: photo.uri }} style={styles.photo} />
                  <Pressable accessibilityLabel={`Remove ${photo.fileName}`} onPress={() => removePhoto(photo.id)} style={styles.removeButton}>
                    <MaterialCommunityIcons color={colors.surface} name="close" size={16} />
                  </Pressable>
                </View>
              ))}
              {draft.photos.length < maximumPhotos ? (
                <Pressable accessibilityLabel="Add more photos" onPress={choosePhotos} style={styles.addTile}>
                  <MaterialCommunityIcons color={colors.patient.primary} name="plus" size={30} />
                  <Text style={styles.addTileText}>Add photo</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          <View style={styles.privacyNote}>
            <MaterialCommunityIcons color={colors.patient.primary} name="shield-lock-outline" size={21} />
            <Text style={styles.privacyText}>Photos are uploaded securely only after you submit this consultation request.</Text>
          </View>

          <View style={styles.actions}>
            {draft.photos.length > 0 ? <AppButton label="Choose more photos" onPress={choosePhotos} variant="outline" /> : null}
            <AppButton label="Next" onPress={() => router.push('/review-consultation')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: 'auto',
  },
  addTile: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderColor: colors.patient.primary,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  addTileText: {
    color: colors.patient.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  heading: {
    marginBottom: spacing.xxl,
    marginTop: spacing.xxl,
  },
  photo: {
    height: 112,
    width: 112,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoTile: {
    borderRadius: radius.md,
    height: 112,
    overflow: 'hidden',
    width: 112,
  },
  privacyNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  privacyText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(24,59,91,0.85)',
    borderRadius: 16,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 28,
  },
  safeArea: {
    flex: 1,
  },
  uploadArea: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.patient.primary,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    minHeight: 225,
    padding: spacing.xl,
  },
  uploadIcon: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.pill,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  uploadText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  uploadTitle: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.md,
  },
});
