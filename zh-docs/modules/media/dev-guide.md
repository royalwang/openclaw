# 媒体处理开发指南

> 如何添加媒体理解 Provider、扩展文件处理、自定义图片生成。

## 1. 项目结构

```
src/media/                  # 媒体管道
├── pipeline.ts             # 处理流水线
├── transcription.ts        # 音频转录
└── types.ts

src/media-understanding/    # 媒体理解
├── runtime.ts              # Provider 运行时
└── types.ts

src/image-generation/       # 图片生成
├── runtime.ts              # 生成运行时
├── provider-registry.ts    # Provider 注册
└── types.ts

src/link-understanding/     # 链接理解
├── fetch.ts                # URL 内容抓取
└── types.ts
```

## 2. 添加媒体理解 Provider

```typescript
// 通过插件 SDK
api.registerMediaUnderstandingProvider({
  id: "your-vision",
  name: "Your Vision Provider",
  
  supportedMimeTypes: ["image/png", "image/jpeg"],
  
  understand: async ({ buffer, mimeType, prompt }) => {
    const result = await callYourVisionApi(buffer, prompt);
    return { text: result.description };
  },
});
```

## 3. 添加图片生成 Provider

```typescript
api.registerImageGenerationProvider({
  id: "your-gen",
  generate: async ({ prompt, size }) => {
    const imageBuffer = await generateImage(prompt, size);
    return { buffer: imageBuffer, mimeType: "image/png" };
  },
});
```

## 4. 测试

```bash
pnpm test -- src/media/
pnpm test -- src/media-understanding/
pnpm test -- src/image-generation/
```
