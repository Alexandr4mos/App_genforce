import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Image, Platform, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { BRAND } from '../lib/brand';

const WORDMARK = require('../assets-login/genforce-wordmark-branco.png');

/** Altura da faixa do wordmark (sem safe-area). */
export const APP_HEADER_ALTURA = 48;

const SAFE_TOP_NATIVO =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : Platform.OS === 'ios' ? 44 : 0;

/**
 * Header fixo Genforce — fundo de marca, wordmark centralizado.
 *
 * Via ref: `await ref.current.medirLogo()` → `{ x, y, width, height }` em
 * coordenadas de janela (para animações futuras).
 */
const AppHeader = forwardRef(function AppHeader({ onPressLogo }, ref) {
  const logoRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      medirLogo: () =>
        new Promise((resolve) => {
          const node = logoRef.current;
          if (!node?.measureInWindow) {
            resolve(null);
            return;
          }
          node.measureInWindow((x, y, width, height) => {
            resolve({ x, y, width, height });
          });
        }),
    }),
    []
  );

  return (
    <View
      accessibilityRole="header"
      style={[
        styles.barra,
        {
          backgroundColor: BRAND.fundo,
          paddingTop: Platform.OS === 'web' ? 0 : SAFE_TOP_NATIVO,
        },
      ]}
    >
      <View style={styles.faixa}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Genforce — ir para a tela inicial"
          onPress={onPressLogo}
          style={({ pressed }) => [styles.logoHit, pressed && { opacity: 0.85 }]}
        >
          {/* View dedicada para measureInWindow (Pressable nem sempre mede bem) */}
          <View ref={logoRef} collapsable={false}>
            <Image source={WORDMARK} style={styles.logo} resizeMode="contain" />
          </View>
        </Pressable>
      </View>
    </View>
  );
});

export default AppHeader;

const styles = StyleSheet.create({
  barra: {
    width: '100%',
    zIndex: 20,
  },
  faixa: {
    height: APP_HEADER_ALTURA,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoHit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logo: {
    width: 148,
    height: 32,
  },
});
