import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as deckRepository from '../data/deckRepository';
import * as streakRepository from '../data/streakRepository';
import { useCurrentUser } from '../context/UserContext';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { Deck } from '../types/models';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Decks'>;

export default function DecksScreen({ navigation }: Props) {
  const user = useCurrentUser();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
            placeholderTextColor={colors.placeholder}
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
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum baralho ainda.</Text>}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    navRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    navButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    navButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    streakRow: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginBottom: 16,
    },
    streakText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13,
    },
    addRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    addButtonText: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    deckItem: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    deckName: {
      fontSize: 16,
      color: colors.text,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textMuted,
    },
  });
}
