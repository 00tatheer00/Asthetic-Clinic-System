declare module 'qz-tray' {
  export interface QzPrintConfigOptions {
    bounds?: { x?: number; y?: number; width?: number; height?: number };
    colorType?: 'color' | 'grayscale' | 'blackwhite';
    copies?: number;
    density?: number | string;
    duplex?: boolean | string;
    fallbackDensity?: number;
    interpolation?: string;
    jobName?: string;
    legacy?: boolean;
    margins?: number | { top?: number; right?: number; bottom?: number; left?: number };
    orientation?: 'portrait' | 'landscape' | 'reverse-landscape';
    paperThickness?: number | string;
    printerTray?: string;
    rasterize?: boolean;
    rotation?: number;
    scaleContent?: boolean;
    size?: { width?: number; height?: number };
    units?: 'in' | 'mm' | 'cm';
    altPrinting?: boolean;
    encoding?: string;
    spool?: { size?: number };
  }

  export interface QzPrintData {
    type: 'pixel' | 'raw' | 'pdf' | 'image' | 'html';
    format?: 'plain' | 'html' | 'image' | 'pdf' | 'command' | 'base64' | 'hex';
    flavor?: 'plain' | 'base64' | 'file';
    data: string | unknown;
    options?: Record<string, unknown>;
  }

  export interface QzWebSocketOptions {
    host?: string;
    port?: { secure?: number[]; insecure?: number[] };
    usingSecure?: boolean;
    protocol?: string;
    keepAlive?: number;
    retries?: number;
    delay?: number;
  }

  export interface QzTrayStatic {
    websocket: {
      connect(options?: QzWebSocketOptions): Promise<void>;
      disconnect(): Promise<void>;
      isActive(): boolean;
      getConnectionInfo(): unknown;
    };
    printers: {
      find(query?: string): Promise<string | string[]>;
      getDefault(): Promise<string>;
      getDetails(printer?: string): Promise<unknown>;
    };
    configs: {
      create(printer: string, options?: QzPrintConfigOptions): unknown;
    };
    print(config: unknown, data: QzPrintData[]): Promise<void>;
    version: string;
    security?: {
      setCertificatePromise(promise: (resolve: (cert: string) => void, reject: (err: unknown) => void) => void): void;
      setSignatureAlgorithm(algo: string): void;
      setSignaturePromise(promise: (toSign: string) => (resolve: (sig: string) => void, reject: (err: unknown) => void) => void): void;
    };
  }

  const qz: QzTrayStatic;
  export default qz;
}
