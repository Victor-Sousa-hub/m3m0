import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getDatabase } from '../db/database';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { Deck } from '../types/models';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Decks'>;

export default function DecksScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');

  const loadDecks = useCallback(async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Deck>(
      'SELECT id, name, exam_code as examCode, created_at as createdAt FROM decks ORDER BY created_at DESC'
    );
    setDecks(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [loadDecks])
  );

  const addDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    const db = await getDatabase();
    await db.runAsync('INSERT INTO decks (name) VALUES (?)', name);
    setNewDeckName('');
    loadDecks();
  };

  return (
    <View style={styles.container}>
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

      <FlatList
        data={decks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={decks.length === 0 && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum baralho ainda.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.deckItem}
            onPress={() =>
              navigation.navigate('DeckDetail', { deckId: item.id, deckName: item.name })
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
