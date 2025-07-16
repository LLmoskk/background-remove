import { removeBackground, Config, preload } from '@imgly/background-removal';

let isModelLoaded = false;

// 默认配置
export const defaultConfig: Config = {
  debug: false,
  device: 'cpu',
  model: 'isnet_fp16',
  output: {
    format: 'image/png',
    quality: 0.8,
    type: 'foreground',
  },
};

export async function loadModel(config: Config = defaultConfig): Promise<void> {
  if (!isModelLoaded) {
    try {
      // 预加载模型
      await preload({
        model: config.model,
        debug: config.debug,
        device: config.device,
      });
      isModelLoaded = true;
    } catch (error) {
      console.error('Failed to preload model:', error);
      throw error;
    }
  }
}

export async function processImageBackgroundRemoval(
  imageFile: File, 
  config: Config = defaultConfig
): Promise<Blob> {
  try {
    // 确保模型已加载
    if (!isModelLoaded) {
      await loadModel(config);
    }

    // 处理图片
    const blob = await removeBackground(imageFile, config);
    return blob;
  } catch (error) {
    console.error('Background removal failed:', error);
    throw new Error('背景去除失败，请重试');
  }
}

// 检查模型是否已加载
export function isModelReady(): boolean {
  return isModelLoaded;
}

// 重置模型状态（当配置改变时）
export function resetModel(): void {
  isModelLoaded = false;
}