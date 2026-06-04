import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { adminApi } from '@/api/admin';
import { User } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { formatDateOnly } from '@/utils/date';

const TYPE_FILTERS = ['Todos', 'consumer', 'provider', 'company', 'admin'];
const TYPE_LABELS: Record<string, string> = { Todos: 'Todos', consumer: 'Consumidor', provider: 'Prestador', company: 'Empresa', admin: 'Admin' };

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');

  const load = useCallback(async () => {
    const { data } = await adminApi.getUsers({
      search: search || undefined,
      user_type: filter !== 'Todos' ? filter : undefined,
    });
    if (data) setUsers(data);
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(() => { setLoading(true); load().finally(() => setLoading(false)); }, 300);
    return () => clearTimeout(t);
  }, [search, filter]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuários</Text>
        <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Buscar..." placeholderTextColor={Colors.neutral[600]} />
        <FlatList
          data={TYPE_FILTERS}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <Pressable onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipActive]}>
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{TYPE_LABELS[item]}</Text>
            </Pressable>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        />
      </View>

      {loading ? <LoadingScreen /> : users.length === 0 ? (
        <EmptyState icon="users-group" title="Nenhum usuário encontrado" subtitle="Ajuste os filtros." />
      ) : (
        <FlashList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image source={item.profile_photo_url ? { uri: item.profile_photo_url } : require('@/assets/placeholder-avatar.png')} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.date}>{formatDateOnly(item.date_joined)}</Text>
              </View>
              <StatusBadge status={item.user_type ?? 'consumer'} customLabel={TYPE_LABELS[item.user_type ?? '']} />
            </View>
          )}
          estimatedItemSize={72}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutral[900] },
  header: { padding: Spacing.screenHorizontal, gap: Spacing[3] },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.neutral[0] },
  search: { height: 48, borderRadius: Radius.lg, backgroundColor: Colors.neutral[800], paddingHorizontal: Spacing[3], color: Colors.neutral[0], fontFamily: FontFamily.regular, fontSize: FontSize.base },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 7, borderWidth: 1, borderColor: Colors.neutral[700] },
  chipActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  chipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.neutral[400] },
  chipTextActive: { color: Colors.neutral[0] },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: Spacing[10] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.neutral[800] },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.neutral[700] },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.neutral[0] },
  email: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[400] },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.neutral[600] },
});
