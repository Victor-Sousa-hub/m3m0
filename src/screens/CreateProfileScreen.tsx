import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createUser } from '../db/users';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/tokens';
import type { User } from '../types/models';

type Props = {
  onProfileCreated: (user: User) => void;
};

export default function CreateProfileScreen({ onProfileCreated }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Digite um nome para continuar.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const user = await createUser(trimmed);
      onProfileCreated(user);
    } catch {
      setError('Não foi possível criar o perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo ao m3m0</Text>
        <Text style={styles.subtitle}>
          Crie seu perfil para acompanhar sua pontuação nos simulados.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoFocus
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          <Text style={styles.buttonText}>{isSaving ? 'Criando...' : 'Começar'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles({ colors, spacing, radius, typography }: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
    },
    content: {
      padding: spacing.xl,
    },
    title: {
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: typography.size.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
      fontFamily: typography.fontFamily.regular,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.size.md,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      fontFamily: typography.fontFamily.regular,
    },
    error: {
      color: colors.incorrect,
      marginBottom: spacing.sm,
      fontFamily: typography.fontFamily.regular,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.textOnAccent,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.md,
    },
  });
}
