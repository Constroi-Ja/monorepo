import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { storesApi } from '@/api/stores';
import { cartApi } from '@/api/cart';
import { ProductCard } from '@/components/shared/ProductCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InfoBox } from '@/components/shared/InfoBox';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import { Store, StoreItem } from '@/types';
import { isStoreOpen } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';

const HEADER_HEIGHT = 240;

export default function StoreDetailScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const insets = useSafeAreaInsets();
  const increment = useCartStore((s) => s.increment);
  const addToast = useUiStore((s) => s.addToast);

  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const id = Number(storeId);
    const [storeRes, itemsRes] = await Promise.allSettled([
      storesApi.getById(id),
      storesApi.getItems({ company_id: id }),
    ]);
    if (storeRes.status === 'fulfilled' && storeRes.value.data) setStore(storeRes.value.data);
    if (itemsRes.status === 'fulfilled' && itemsRes.value.data) setItems(itemsRes.value.data);
  }, [storeId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (item: StoreItem) => {
    const { error } = await cartApi.addItem(item.id, 1);
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    increment();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToast(`${item.name} adicionado ao carrinho!`);
  };

  if (loading) return <LoadingScreen />;
  if (!store) return (
    <View style={styles.root}>
      <InfoBox type="error" message="Loja não encontrada." style={{ margin: 16 }} />
    </View>
  );

  const isOpen = isStoreOpen(store.opening_time, store.closing_time);

  const headerImageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  const headerImageTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* Back button overlay */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 12 }]}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Animated.View
          style={[
            styles.heroWrapper,
            {
              transform: [
                { scaleX: headerImageScale },
                { scaleY: headerImageScale },
                { translateY: headerImageTranslate },
              ],
            },
          ]}
        >
          <Image
            source={store.image_url ? { uri: store.image_url } : require('@/assets/placeholder-store.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
        </Animated.View>

        {/* Store Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.storeName}>{store.company_name}</Text>
            <View style={[styles.openBadge, !isOpen && styles.closedBadge]}>
              <Text style={[styles.openText, !isOpen && styles.closedText]}>
                {isOpen ? '● Aberta' : '● Fechada'}
              </Text>
            </View>
          </View>
          <Text style={styles.category}>{store.category}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{Number(store.rating).toFixed(1)} ({store.rating_count ?? 0} avaliações)</Text>
            {store.distance > 0 && <Text style={styles.meta}>{Number(store.distance).toFixed(1)} km</Text>}
            {store.eta_minutes && <Text style={styles.meta}>⏱ {store.eta_minutes} min</Text>}
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Produtos ({items.length})</Text>
          <FlashList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={() => {}}
                onAdd={() => handleAddToCart(item)}
              />
            )}
            numColumns={2}
            estimatedItemSize={180}
            scrollEnabled={false}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.background },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#fff', fontSize: 24, fontFamily: FontFamily.bold, marginTop: -2 },
  heroWrapper: { height: HEADER_HEIGHT, overflow: 'hidden' },
  heroImage: { width: '100%', height: HEADER_HEIGHT, backgroundColor: Colors.neutral[200] },
  infoCard: {
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing[3],
    marginTop: -20,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  storeName: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.neutral[900] },
  openBadge: { backgroundColor: Colors.success.light, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  closedBadge: { backgroundColor: Colors.error.light },
  openText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.success.dark },
  closedText: { color: Colors.error.dark },
  category: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[500] },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.neutral[600] },
  itemsSection: { padding: Spacing[3], gap: Spacing[3] },
  sectionTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.neutral[900] },
});
