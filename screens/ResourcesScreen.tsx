import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';

type Resource = {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
};

export default function ResourcesScreen() {
  const resources: Resource[] = [
    {
      id: '1',
      title: 'Emergency Protocols',
      description: 'Standard operating procedures for different emergency types',
      icon: '📋',
      action: () => {},
    },
    {
      id: '2',
      title: 'Contact Directory',
      description: 'Important contacts: Police, Fire, Medical, etc.',
      icon: '📞',
      action: () => {},
    },
    {
      id: '3',
      title: 'First Aid Guide',
      description: 'Quick reference for common medical emergencies',
      icon: '🏥',
      action: () => {},
    },
    {
      id: '4',
      title: 'Legal Guidelines',
      description: 'Legal considerations and documentation requirements',
      icon: '⚖️',
      action: () => {},
    },
    {
      id: '5',
      title: 'Communication Templates',
      description: 'Pre-written messages for different scenarios',
      icon: '💬',
      action: () => {},
    },
    {
      id: '6',
      title: 'Training Materials',
      description: 'Videos and documents for ongoing training',
      icon: '🎓',
      action: () => {},
    },
  ];

  const quickLinks = [
    { name: 'Police', number: '991', icon: '👮' },
    { name: 'Ambulance', number: '992', icon: '🚑' },
    { name: 'Fire', number: '993', icon: '🚒' },
  ];

  async function callNumber(number: string) {
    const url = `tel:${number}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Emergency Contacts</Text>
        <View style={styles.quickLinksGrid}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.number}
              style={styles.quickLinkCard}
              onPress={() => callNumber(link.number)}
            >
              <Text style={styles.quickLinkIcon}>{link.icon}</Text>
              <Text style={styles.quickLinkName}>{link.name}</Text>
              <Text style={styles.quickLinkNumber}>{link.number}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources & Tools</Text>
        {resources.map((resource) => (
          <Pressable
            key={resource.id}
            style={styles.resourceCard}
            onPress={resource.action}
          >
            <View style={styles.resourceIcon}>
              <Text style={styles.resourceIconText}>{resource.icon}</Text>
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
            </View>
            <Text style={styles.resourceArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics & Reports</Text>
        <Pressable style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Cases Handled</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <Text style={styles.statArrow}>›</Text>
        </Pressable>
        
        <Pressable style={styles.statCard}>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Average Response Time</Text>
            <Text style={styles.statValue}>-- min</Text>
          </View>
          <Text style={styles.statArrow}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  quickLinkIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickLinkName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  quickLinkNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceIconText: {
    fontSize: 24,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  resourceArrow: {
    fontSize: 24,
    color: '#CBD5E1',
    marginLeft: 8,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  statArrow: {
    fontSize: 24,
    color: '#CBD5E1',
  },
});