import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import * as pairing from '../sync/pairing';
import * as syncStateStore from '../db/syncState';
import { syncNow } from '../sync/manualSync';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/tokens';
import type { SyncState } from '../db/syncState';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'nunca';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR');
}

/** Groups the 16-digit recovery key as "1234 5678 9012 3456" — display only. */
function formatRecoveryKey(key: string): string {
  return key.match(/.{1,4}/g)?.join(' ') ?? key;
}

type Props = {
  /** Fires once right after this device successfully pairs — lets a caller
   * rendering this screen outside the navigator (the web pairing gate)
   * react immediately instead of polling. */
  onPaired?: () => void;
};

export default function SyncScreen({ onPaired }: Props = {}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [state, setState] = useState<SyncState | null | undefined>(undefined);
  const [code, setCode] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [pairingResult, setPairingResult] = useState<{ pairingCode: string; expiresAt: string } | null>(
    null
  );
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    syncStateStore.getSyncState().then(setState);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleGenerateCode = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const result = await pairing.pairAsNewAccount();
      setPairingResult(result);
      refresh();
    } catch {
      setError('Não foi possível gerar o código. Verifique sua conexão.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setIsBusy(true);
    setError(null);
    try {
      await pairing.joinWithCode(trimmed);
      setCode('');
      refresh();
      onPaired?.();
    } catch {
      setError('Código inválido, expirado ou sem conexão.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRecover = async () => {
    const trimmed = recoveryKey.replace(/\D/g, '');
    if (!trimmed) return;
    setIsBusy(true);
    setError(null);
    try {
      await pairing.recoverWithKey(trimmed);
      setRecoveryKey('');
      refresh();
      onPaired?.();
    } catch {
      setError('Chave inválida ou sem conexão.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleInviteDevice = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const result = await pairing.inviteNewDevice();
      setPairingResult(result);
    } catch {
      setError('Não foi possível gerar o código. Verifique sua conexão.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setIsBusy(true);
    setError(null);
    try {
      await syncNow();
      refresh();
    } catch {
      setError('Não foi possível sincronizar agora.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegenerateKey = async () => {
    setIsBusy(true);
    setError(null);
    try {
      await pairing.regenerateMyKey();
      refresh();
    } catch {
      setError('Não foi possível gerar uma nova chave agora.');
    } finally {
      setIsBusy(false);
    }
  };

  if (state === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Shown right after generating a code, regardless of pairing state, so the
  // user has time to read/copy it before the screen moves on to anything else.
  if (pairingResult) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Código gerado</Text>
        <Text style={styles.subtitle}>Digite este código no outro dispositivo para parear.</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeValue}>{pairingResult.pairingCode}</Text>
          <Text style={styles.codeHint}>Válido por 15 minutos.</Text>
        </View>

        {state?.syncSecret && (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Sua chave de recuperação</Text>
            <Text style={styles.recoveryKeyValue} selectable>
              {formatRecoveryKey(state.syncSecret)}
            </Text>
            <Text style={styles.recoveryKeyHint}>
              Guarde em local seguro — ela não expira e recupera este streak em qualquer
              dispositivo. Você pode ver esta chave de novo depois, na tela de sincronização.
            </Text>
          </View>
        )}

        <Pressable
          style={styles.button}
          onPress={() => {
            setPairingResult(null);
            onPaired?.();
          }}
        >
          <Text style={styles.buttonText}>Concluir</Text>
        </Pressable>
      </View>
    );
  }

  if (state) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sincronizado</Text>
        <Text style={styles.subtitle}>
          Este dispositivo está pareado. O streak e o histórico são compartilhados
          automaticamente com os outros dispositivos pareados na mesma conta.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Última sincronização</Text>
          <Text style={styles.statusValue}>{formatTimestamp(state.lastSyncedAt)}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Sua chave de recuperação</Text>
          <Text style={styles.recoveryKeyValue} selectable>
            {formatRecoveryKey(state.syncSecret)}
          </Text>
          <Text style={styles.recoveryKeyHint}>
            Guarde em local seguro. Com ela você recupera seu streak e histórico em qualquer
            dispositivo, a qualquer momento — sem expirar.
          </Text>
          {state.syncSecret.length !== 16 && (
            <>
              <Text style={styles.recoveryKeyHint}>
                Essa chave é de um formato antigo, mais difícil de guardar. Você pode gerar uma
                nova de 16 dígitos sem perder nada.
              </Text>
              <Pressable
                style={[styles.linkButton, isBusy && styles.buttonDisabled]}
                onPress={handleRegenerateKey}
                disabled={isBusy}
              >
                <Text style={styles.linkButtonText}>Gerar nova chave (16 dígitos)</Text>
              </Pressable>
            </>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.button, isBusy && styles.buttonDisabled]} onPress={handleSyncNow} disabled={isBusy}>
          <Text style={styles.buttonText}>{isBusy ? 'Sincronizando...' : 'Sincronizar agora'}</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, isBusy && styles.buttonDisabled]}
          onPress={handleInviteDevice}
          disabled={isBusy}
        >
          <Text style={styles.secondaryButtonText}>Adicionar outro dispositivo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sincronização</Text>
      <Text style={styles.subtitle}>
        Pareie este dispositivo uma única vez para compartilhar streak e histórico com seus
        outros dispositivos (Android e PC). Depois de parear, não pede login de novo.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.button, isBusy && styles.buttonDisabled]} onPress={handleGenerateCode} disabled={isBusy}>
        <Text style={styles.buttonText}>Gerar código neste dispositivo</Text>
      </Pressable>

      <Text style={styles.orLabel}>ou</Text>

      <Text style={styles.sectionLabel}>Entrar com código de outro dispositivo</Text>
      <View style={styles.joinRow}>
        <TextInput
          style={styles.input}
          placeholder="Código"
          placeholderTextColor={colors.textSecondary}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Pressable style={[styles.joinButton, isBusy && styles.buttonDisabled]} onPress={handleJoin} disabled={isBusy}>
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
      </View>

      <Text style={styles.orLabel}>ou</Text>

      <Text style={styles.sectionLabel}>Recuperar com minha chave</Text>
      <TextInput
        style={styles.recoveryInput}
        placeholder="0000 0000 0000 0000"
        placeholderTextColor={colors.textSecondary}
        value={recoveryKey}
        onChangeText={(text) => setRecoveryKey(text.replace(/\D/g, '').slice(0, 16))}
        keyboardType="number-pad"
        maxLength={19}
      />
      <Pressable
        style={[styles.secondaryButton, isBusy && styles.buttonDisabled]}
        onPress={handleRecover}
        disabled={isBusy}
      >
        <Text style={styles.secondaryButtonText}>Recuperar streak</Text>
      </Pressable>
    </View>
  );
}

function createStyles({ colors, spacing, radius, typography }: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    title: {
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      lineHeight: 20,
      fontFamily: typography.fontFamily.regular,
    },
    statusCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    statusLabel: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
    statusValue: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginTop: spacing.unit,
    },
    recoveryKeyValue: {
      fontSize: typography.size.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      letterSpacing: 1,
      marginTop: spacing.xs,
    },
    recoveryKeyHint: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      lineHeight: 16,
      fontFamily: typography.fontFamily.regular,
    },
    linkButton: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
    },
    linkButtonText: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.accent,
    },
    error: {
      color: colors.incorrect,
      marginBottom: spacing.md,
      fontFamily: typography.fontFamily.regular,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.md,
    },
    buttonText: {
      color: colors.textOnAccent,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.size.md,
    },
    codeCard: {
      backgroundColor: colors.accentMuted,
      borderRadius: radius.md,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    codeValue: {
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.accent,
      letterSpacing: 4,
    },
    codeHint: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      marginTop: spacing.xs,
      fontFamily: typography.fontFamily.regular,
    },
    orLabel: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginVertical: spacing.xl,
      fontFamily: typography.fontFamily.regular,
    },
    sectionLabel: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    joinRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      letterSpacing: 2,
      fontFamily: typography.fontFamily.regular,
    },
    recoveryInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      marginBottom: spacing.md,
      fontFamily: typography.fontFamily.regular,
    },
    joinButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
  });
}
