import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import * as streakRepository from '../data/streakRepository';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import GnuEasterEgg from '../components/GnuEasterEgg';
import type { Theme } from '../theme/tokens';
import type { Deck } from '../types/models';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Decks'>;

export default function DecksScreen({ navigation }: Props) {
  const user = useCurrentUser();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);

  const loadDecks = useCallback(async () => {
    setDecks(await deckRepository.listDecks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
      streakRepository.getStreak(user.id).then((streak) => setCurrentStreak(streak.currentStreak));
    }, [loadDecks, user.id])
  );

  const addDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    await deckRepository.createDeck(name);
    setNewDeckName('');
    loadDecks();
  };

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <Pressable style={styles.navButton} onPress={() => navigation.navigate('Stats')}>
          <Text style={styles.navButtonText}>📊 Estatísticas</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => navigation.navigate('Sync')}>
          <Text style={styles.navButtonText}>🔗 Sincronização</Text>
        </Pressable>
      </View>

      {currentStreak > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakText}>
            🔥 Sequência de {currentStreak} dia{currentStreak === 1 ? '' : 's'}
          </Text>
        </View>
      )}

      {deckRepository.supportsCustomDecks && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Nome do baralho"
            placeholderTextColor={colors.textSecondary}
            value={newDeckName}
            onChangeText={setNewDeckName}
            onSubmitEditing={addDeck}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={addDeck}>
            <Text style={styles.addButtonText}>Adicionar</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={decks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={decks.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <GnuEasterEgg />
            <Text style={styles.emptyText}>Nenhum baralho ainda.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.deckItem}
            onPress={() =>
              navigation.navigate('DeckDetail', {
                deckId: item.id,
                deckName: item.name,
                deckKind: item.kind,
              })
            }
          >
            <Text style={styles.deckName}>{item.name}</Text>
          </Pressable>
        )}
      />
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
    navRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    navButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    navButtonText: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    streakRow: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentMuted,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginBottom: spacing.lg,
    },
    streakText: {
      color: colors.accent,
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.size.sm,
    },
    addRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.regular,
    },
    addButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
    addButtonText: {
      color: colors.textOnAccent,
      fontFamily: typography.fontFamily.medium,
    },
    deckItem: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    deckName: {
      fontSize: typography.size.md,
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.regular,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      gap: spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
  });
}
