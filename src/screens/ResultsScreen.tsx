import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ route, navigation }: Props) {
  const { deckName, score, total } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.deckName}>{deckName}</Text>
      <Text style={styles.percentage}>{percentage}%</Text>
      <Text style={styles.scoreText}>
        {score} de {total} perguntas corretas
      </Text>

      <Pressable style={styles.button} onPress={() => navigation.popToTop()}>
        <Text style={styles.buttonText}>Voltar aos baralhos</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    deckName: {
      fontSize: 16,
      color: colors.textMuted,
      marginBottom: 8,
    },
    percentage: {
      fontSize: 56,
      fontWeight: '800',
      color: colors.primary,
    },
    scoreText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 8,
      marginBottom: 32,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    buttonText: {
      color: colors.primaryText,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
