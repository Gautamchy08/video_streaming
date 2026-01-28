import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* User Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="person-outline" size={22} color="#888" />
            <Text style={styles.settingsItemText}>Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#444" />
        </View>

        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="notifications-outline" size={22} color="#888" />
            <Text style={styles.settingsItemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#444" />
        </View>

        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#888" />
            <Text style={styles.settingsItemText}>Privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#444" />
        </View>

        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="help-circle-outline" size={22} color="#888" />
            <Text style={styles.settingsItemText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#444" />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Video App v1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 All rights reserved</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  settingsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  appInfo: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 12,
    color: '#444',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#333',
  },
});
