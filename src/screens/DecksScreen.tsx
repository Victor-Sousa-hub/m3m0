import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getDatabase } from '../db/database';
import type { Deck } from '../types/models';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Decks'>;

export default function DecksScreen({ navigation }: Props) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: '#2f6feb',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deckItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deckName: {
    fontSize: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});
