import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 3) {
      Alert.alert('Error', 'Password must be at least 3 characters');
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password);
      router.push('/(auth)/onboading');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign up');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoComplete="password"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            autoCapitalize="none"
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.linkButtonText}>
              Already have an account?{' '}
              <Text style={styles.linkButtonTextBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#666',
    fontSize: 14,
  },
  linkButtonTextBold: {
    fontWeight: '600',
    color: '#000',
  },
});
