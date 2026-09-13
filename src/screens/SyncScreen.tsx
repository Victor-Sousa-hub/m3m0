import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import * as pairing from '../sync/pairing';
import * as syncStateStore from '../db/syncState';
import { syncNow } from '../sync/manualSync';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  if (state === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          placeholderTextColor={colors.placeholder}
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
        placeholderTextColor={colors.placeholder}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textMuted,
      marginBottom: 20,
      lineHeight: 20,
    },
    statusCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
    },
    statusLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    statusValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginTop: 2,
    },
    recoveryKeyValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 1,
      marginTop: 4,
    },
    recoveryKeyHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
      lineHeight: 16,
    },
    error: {
      color: colors.danger,
      marginBottom: 12,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    buttonText: {
      color: colors.primaryText,
      fontWeight: '600',
      fontSize: 16,
    },
    codeCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      marginBottom: 20,
    },
    codeValue: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 4,
    },
    codeHint: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 6,
    },
    orLabel: {
      textAlign: 'center',
      color: colors.textMuted,
      marginVertical: 20,
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    joinRow: {
      flexDirection: 'row',
      gap: 8,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text,
      letterSpacing: 2,
    },
    recoveryInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text,
      marginBottom: 12,
    },
    joinButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
  });
}
