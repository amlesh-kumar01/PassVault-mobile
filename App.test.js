import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Simple test app to isolate boolean casting error
 * Tests common TextInput props that might cause the error
 */
export default function App() {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [multilineText, setMultilineText] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Text style={styles.title}>Test App - Boolean Props</Text>
      
      {/* Test 1: Basic TextInput */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test 1: Basic Input</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type here..."
          style={styles.input}
        />
      </View>

      {/* Test 2: TextInput with autoCapitalize */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test 2: AutoCapitalize None</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Email test"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      {/* Test 3: Secure Text Entry (Boolean) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test 3: SecureTextEntry (Boolean)</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={true}
          style={styles.input}
        />
      </View>

      {/* Test 4: Multiline (Boolean) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test 4: Multiline (Boolean)</Text>
        <TextInput
          value={multilineText}
          onChangeText={setMultilineText}
          placeholder="Multiline text..."
          multiline={true}
          numberOfLines={3}
          style={[styles.input, styles.multiline]}
        />
      </View>

      {/* Test 5: All boolean props together */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Test 5: Combined Props</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Complex input"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
          editable={true}
          style={styles.input}
        />
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => alert('Test button pressed!')}
      >
        <Text style={styles.buttonText}>Test Button</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        If you see this screen without errors, the issue is in your main app code.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#4F46E5',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
