// Desmos 加载器

// 消除 Desmos 频繁读取 Canvas 引起的警告 (Canvas2D: Multiple readback operations using getImageData...)
let isPatched = false;
const patchCanvasContext = () => {
  if (isPatched) return;
  isPatched = true;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  // @ts-expect-error - Desmos internal patch
  HTMLCanvasElement.prototype.getContext = function (
    contextId: string,
    options?: CanvasRenderingContext2DSettings
  ) {
    if (contextId === '2d') {
      // 只有在没有显式设置 false 的情况下才加上 true，尽量降低副作用
      if (!options || options.willReadFrequently !== false) {
        options = { ...options, willReadFrequently: true };
      }
    }
    return originalGetContext.call(this, contextId, options);
  };
};

export const loadDesmos = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    patchCanvasContext();

    if (window.Desmos) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('desmos-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Desmos script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'desmos-script';
    const apiKey = import.meta.env.VITE_DESMOS_API_KEY || 'dcb31709b452b1cf9dc26972add0fda6';
    script.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${apiKey}&lang=zh-CN`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Desmos script'));

    document.head.appendChild(script);
  });
};
