import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { useAuth } from '@/contexts/AuthContext';

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  last?: boolean;
}

function MenuRow({ icon, label, onPress, last }: MenuRowProps) {
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
        onPress={onPress}
      >
        <View style={styles.menuIconBox}>
          <Ionicons name={icon} size={20} color={Colors.text.secondary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.gray[300]} />
      </Pressable>
      {!last && <View style={styles.divider} />}
    </>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, supabaseUser, signOut } = useAuth();

  const displayName =
    user?.full_name || supabaseUser?.user_metadata?.full_name || 'FlowSplit User';
  const displayEmail = user?.email || supabaseUser?.email;
  const displayPhone = user?.phone_number || supabaseUser?.phone;
  const initials = displayName?.[0]?.toUpperCase() || '?';

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileDetail}>
              {displayEmail || displayPhone || 'No contact info'}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="person-outline" label="Edit Profile" />
            <MenuRow
              icon="card-outline"
              label="Bank Accounts"
              onPress={() => router.push('/bank-accounts')}
            />
            <MenuRow icon="notifications-outline" label="Notifications" last />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="help-circle-outline" label="Help Center" />
            <MenuRow icon="document-text-outline" label="Terms of Service" />
            <MenuRow icon="shield-outline" label="Privacy Policy" last />
          </View>
        </View>

        {/* Log Out */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.75 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error.text} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>FlowSplit v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingHorizontal: Spacing.page,
    paddingVertical: Spacing[4],
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing[6],
    gap: Spacing[6],
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xl,
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  profileName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  profileDetail: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // Sections
  section: {
    gap: Spacing[2],
  },
  sectionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
    paddingLeft: Spacing[1],
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    ...Shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[4],
  },
  menuRowPressed: {
    backgroundColor: Colors.gray[50],
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginLeft: Spacing[5] + 32 + Spacing[4],
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    paddingVertical: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.error.border,
    ...Shadows.card,
  },
  logoutText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.error.text,
  },

  version: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingBottom: Spacing[4],
  },
});
