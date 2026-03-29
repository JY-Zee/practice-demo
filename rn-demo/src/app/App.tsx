import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <View style={styles.container}>
      {/* 计数器 + 按钮，点击按钮数值加1 */}
      <Text>点击次数：{count}</Text>
      <Pressable
        style={{
          marginTop: 16,
          paddingHorizontal: 24,
          paddingVertical: 12,
          backgroundColor: '#409eff',
          borderRadius: 6,
        }}
        // 使用 onTouchEnd 适配 RN/WEB，标准推荐 TouchableOpacity 或 Pressable，但为简单展示直接用 View
        onPress={() => {
          console.log('1111', 1111)
          setCount(count + 1)}}
        accessibilityRole="button"
        accessibilityLabel="增加计数"
      >
        <Text style={{ color: '#fff' }}>按钮</Text>
      </Pressable>
      <Text>RN Demo - 生产级框架</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
