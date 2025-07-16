import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, X, ImageIcon, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { processImageBackgroundRemoval, loadModel, isModelReady, resetModel, defaultConfig } from './utils/backgroundRemoval';
import { ConfigPanel } from './components/ConfigPanel';
import { Config } from '@imgly/background-removal';

interface ProcessedImage {
  original: string;
  processed: string;
  filename: string;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 预加载模型
  React.useEffect(() => {
    const initModel = async () => {
      try {
        setLoadingProgress(20);
        await loadModel(config);
        setLoadingProgress(100);
        setModelLoaded(true);
      } catch (err) {
        console.error('模型加载失败:', err);
        setError('AI模型加载失败，请刷新页面重试');
        setModelLoaded(false);
      }
    };
    
    initModel();
  }, []);

  // 当配置改变时重新加载模型
  const handleConfigChange = useCallback(async (newConfig: Config) => {
    setConfig(newConfig);
    
    // 如果模型相关配置改变，重新加载模型
    if (
      newConfig.model !== config.model || 
      newConfig.device !== config.device ||
      newConfig.debug !== config.debug
    ) {
      setModelLoaded(false);
      setLoadingProgress(0);
      resetModel();
      
      try {
        setLoadingProgress(20);
        await loadModel(newConfig);
        setLoadingProgress(100);
        setModelLoaded(true);
        setError(null);
      } catch (err) {
        console.error('模型重新加载失败:', err);
        setError('AI模型加载失败，请检查配置或刷新页面重试');
        setModelLoaded(false);
      }
    }
  }, [config]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择有效的图片文件（JPG、PNG、WEBP等）');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('图片文件大小不能超过10MB');
      return;
    }

    if (!isModelReady()) {
      setError('AI模型尚未加载完成，请稍候再试');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const originalUrl = URL.createObjectURL(file);
      
      // 使用当前配置处理图片
      const processedBlob = await processImageBackgroundRemoval(file, config);
      const processedUrl = URL.createObjectURL(processedBlob);

      setProcessedImage({
        original: originalUrl,
        processed: processedUrl,
        filename: file.name
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理图片时出现错误，请重试');
      console.error('Background removal error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [config]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const downloadImage = useCallback(() => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage.processed;
    
    // 根据输出格式确定文件扩展名
    const extension = config.output.format === 'image/png' ? 'png' : 
                     config.output.format === 'image/jpeg' ? 'jpg' : 'webp';
    
    const outputType = config.output.type === 'foreground' ? 'no-bg' :
                      config.output.type === 'background' ? 'bg-only' : 'mask';
    
    link.download = `${outputType}-${processedImage.filename.replace(/\.[^/.]+$/, '')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage, config]);

  const reset = useCallback(() => {
    if (processedImage) {
      URL.revokeObjectURL(processedImage.original);
      URL.revokeObjectURL(processedImage.processed);
    }
    setProcessedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processedImage]);

  const getOutputTypeLabel = () => {
    switch (config.output.type) {
      case 'foreground': return '去背景后';
      case 'background': return '背景部分';
      case 'mask': return '蒙版图像';
      default: return '处理结果';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Config Panel */}
        <ConfigPanel
          config={config}
          onConfigChange={handleConfigChange}
          isOpen={configPanelOpen}
          onToggle={() => setConfigPanelOpen(!configPanelOpen)}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI背景去除工具
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            使用先进的AI技术，精准识别并去除图片背景。支持人物、物体、动物等多种场景，一键生成透明背景图片
          </p>
          
          {/* Model Loading Progress */}
          {!modelLoaded && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在加载AI模型 ({config.model})...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Area */}
        {!processedImage && !isProcessing && modelLoaded && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragOver 
                  ? 'border-purple-500 bg-purple-50 scale-105' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-purple-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    拖拽图片到这里或点击上传
                  </h3>
                  <p className="text-gray-500 mb-6">
                    支持 JPG、PNG、WEBP 格式，文件大小不超过 10MB
                  </p>
                  
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    选择图片
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  AI正在处理图片...
                </h3>
                <p className="text-gray-500">
                  正在使用 {config.model} 模型进行{config.output.type === 'foreground' ? '背景去除' : config.output.type === 'background' ? '背景提取' : '蒙版生成'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {processedImage && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">处理结果</h2>
              <div className="flex space-x-3">
                <button
                  onClick={downloadImage}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载图片
                </button>
                <button
                  onClick={reset}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新处理
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                  原始图片
                </h3>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-inner">
                  <img
                    src={processedImage.original}
                    alt="原始图片"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mr-2"></div>
                  {getOutputTypeLabel()}
                </h3>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner" style={{
                  backgroundImage: config.output.type === 'foreground' ? `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3e%3cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23e5e7eb' stroke-width='0.5'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='20' height='20' fill='url(%23grid)' /%3e%3c/svg%3e")` : 'none',
                  backgroundColor: config.output.type === 'foreground' ? '#f9fafb' : '#ffffff'
                }}>
                  <img
                    src={processedImage.processed}
                    alt={getOutputTypeLabel()}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Config Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">当前配置</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">模型:</span> {config.model}
                </div>
                <div>
                  <span className="font-medium">设备:</span> {config.device.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">格式:</span> {config.output.format.split('/')[1].toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">质量:</span> {Math.round(config.output.quality * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI智能识别</h3>
            <p className="text-gray-600">
              采用最新的深度学习算法，精准识别图片中的主体和背景，支持复杂场景处理
            </p>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Loader2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">灵活配置</h3>
            <p className="text-gray-600">
              支持多种AI模型、输出格式和处理模式，满足不同场景的需求
            </p>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">高质量输出</h3>
            <p className="text-gray-600">
              保持原图分辨率和质量，支持PNG、JPEG、WebP多种格式输出
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;