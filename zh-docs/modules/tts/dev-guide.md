# TTS 开发指南

> 如何添加新的 TTS Provider、自定义语音、实现 Telephony 支持。

## 1. 添加新的 TTS Provider

### 实现 SpeechProvider 接口

```typescript
// tts/providers/your-provider.ts
import type { SpeechProvider } from "../provider-types.js";

export const yourSpeechProvider: SpeechProvider = {
  id: "your-provider",
  name: "Your TTS Provider",

  isConfigured: ({ cfg, config }) => {
    return Boolean(process.env.YOUR_API_KEY);
  },

  synthesize: async ({ text, cfg, config, target, overrides }) => {
    const response = await fetch("https://api.your-tts.com/synthesize", {
      method: "POST",
      body: JSON.stringify({ text, voice: "default" }),
    });
    return {
      audioBuffer: Buffer.from(await response.arrayBuffer()),
      outputFormat: target === "voice-note" ? "opus" : "mp3",
      voiceCompatible: target === "voice-note",
      fileExtension: target === "voice-note" ? ".opus" : ".mp3",
    };
  },

  // 可选: 电话语音合成
  synthesizeTelephony: async ({ text, cfg, config }) => {
    return {
      audioBuffer: pcmBuffer,
      outputFormat: "pcm",
      sampleRate: 8000,
    };
  },

  // 可选: 列出可用语音
  listVoices: async ({ apiKey }) => {
    return [{ id: "voice-1", name: "Voice 1", language: "en" }];
  },
};
```

### 注册 Provider

```typescript
// tts/provider-registry.ts
registerSpeechProvider(yourSpeechProvider);
```

## 2. TTS 指令标签

Agent 可以使用 `[[tts:...]]` 标签控制语音输出：

```
[[tts:voice=nova,speed=1.2]]朗读这段文字[[/tts:text]]
```

`parseTtsDirectives()` 解析这些标签并生成 `TtsDirectiveOverrides`。

## 3. 用户偏好管理

```typescript
// 读取/写入 ~/.openclaw/settings/tts.json
setTtsAutoMode(prefsPath, "always");   // 设置自动模式
setTtsProvider(prefsPath, "openai");   // 设置 Provider
setTtsMaxLength(prefsPath, 2000);      // 设置最大长度
setSummarizationEnabled(prefsPath, true); // 启用摘要
```

## 4. 测试

```bash
pnpm test -- src/tts/
```
