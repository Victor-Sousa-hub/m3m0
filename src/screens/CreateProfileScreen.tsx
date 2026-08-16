import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { createUser } from '../db/users';
import type { User } from '../types/models';

type Props = {
  onProfileCreated: (user: User) => void;
};

export default function CreateProfileScreen({ onProfileCreated }: Props) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  error: {
    color: '#c0392b',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2f6feb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
