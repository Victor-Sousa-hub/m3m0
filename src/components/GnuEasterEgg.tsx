import { Image, StyleSheet } from 'react-native';

/**
 * The GNU mascot, discreetly, wherever a screen has nothing else to show
 * (loading, empty states). Color is baked into the asset (not tinted at
 * runtime) so it renders identically on native and web.
 */
type Props = {
  size?: number;
};

export default function GnuEasterEgg({ size = 48 }: Props) {
  return (
    <Image
      source={require('../../assets/gnu-mascot.png')}
      style={[styles.image, { width: size, height: size * (250 / 256) }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    opacity: 0.5,
  },
});
