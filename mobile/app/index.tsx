import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { user } = useAuthStore();

  if (!user) return <Redirect href="/(auth)/login" />;

  switch (user.user_type) {
    case 'consumer':
      return <Redirect href="/(app)/(consumer)" />;
    case 'provider':
      return <Redirect href="/(app)/(provider)" />;
    case 'company':
      return <Redirect href="/(app)/(company)" />;
    case 'admin':
      return <Redirect href="/(app)/(admin)" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
