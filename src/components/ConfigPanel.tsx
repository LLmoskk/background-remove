import React from 'react';
import { Settings, Monitor, Cpu, Zap, Image, Palette } from 'lucide-react';
import { Config } from '@imgly/background-removal';

interface ConfigPanelProps {
  config: Config;
  onConfigChange: (config: Config) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  isOpen,
  onToggle
}) => {
  const updateConfig = (updates: Partial<Config>) => {
    onConfigChange({ ...config, ...updates });
  };

  const updateOutputConfig = (updates: Partial<Config['output']>) => {
    onConfigChange({
      ...config,
      output: { ...config.output, ...updates }
    });
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-6 right-6 z-50 flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <Settings className="w-4 h-4 mr-2 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">设置</span>
      </button>

      {/* Config Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">AI处理设置</h2>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Device Selection */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Monitor className="w-4 h-4 mr-2" />
                处理设备
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig({ device: 'cpu' })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    config.device === 'cpu'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Cpu className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">CPU</div>
                </button>
                <button
                  onClick={() => updateConfig({ device: 'gpu' })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    config.device === 'gpu'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Zap className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">GPU</div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                GPU模式需要浏览器支持WebGPU，否则自动降级到CPU
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Image className="w-4 h-4 mr-2" />
                AI模型
              </label>
              <div className="space-y-2">
                {[
                  { value: 'isnet', label: '标准模型', desc: '平衡速度和质量' },
                  { value: 'isnet_fp16', label: '优化模型', desc: '推荐，更快处理' },
                  { value: 'isnet_quint8', label: '轻量模型', desc: '最快速度' }
                ].map((model) => (
                  <button
                    key={model.value}
                    onClick={() => updateConfig({ model: model.value as any })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      config.model === model.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{model.label}</div>
                    <div className="text-xs text-gray-500">{model.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Format */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Palette className="w-4 h-4 mr-2" />
                输出格式
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { value: 'image/png', label: 'PNG' },
                  { value: 'image/jpeg', label: 'JPEG' },
                  { value: 'image/webp', label: 'WebP' }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => updateOutputConfig({ format: format.value as any })}
                    className={`p-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 ${
                      config.output.format === format.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                输出类型
              </label>
              <div className="space-y-2">
                {[
                  { value: 'foreground', label: '前景（去背景）', desc: '保留主体，移除背景' },
                  { value: 'background', label: '背景', desc: '仅保留背景部分' },
                  { value: 'mask', label: '蒙版', desc: '黑白蒙版图像' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateOutputConfig({ type: type.value as any })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      config.output.type === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                输出质量: {Math.round(config.output.quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={config.output.quality}
                onChange={(e) => updateOutputConfig({ quality: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低质量</span>
                <span>高质量</span>
              </div>
            </div>

            {/* Debug Mode */}
            <div>
              <label className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">调试模式</span>
                <button
                  onClick={() => updateConfig({ debug: !config.debug })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.debug ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.debug ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                在控制台显示详细的处理信息
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={onToggle}
        />
      )}
    </div>
  );
};