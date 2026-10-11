import { Injectable } from '@angular/core';
import jsQR from 'jsqr';

@Injectable({ providedIn: 'root' })
export class CameraScanner {
  async start(video: HTMLVideoElement, onCode: (code: string) => void): Promise<() => void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    let stopped = false;
    video.srcObject = stream;
    void video.play();
    void this.scan(video, onCode, () => stopped);
    return () => {
      stopped = true;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }

  async scan(
    video: HTMLVideoElement,
    onCode: (code: string) => void,
    stopped: () => boolean,
  ): Promise<void> {
    const detector =
      'BarcodeDetector' in globalThis
        ? new (
            globalThis as typeof globalThis & {
              BarcodeDetector: new (options: { formats: string[] }) => {
                detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
              };
            }
          ).BarcodeDetector({ formats: ['qr_code'] })
        : null;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    while (!stopped()) {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const code = detector
          ? (await detector.detect(video))[0]?.rawValue
          : jsQR(
              context.getImageData(0, 0, canvas.width, canvas.height).data,
              canvas.width,
              canvas.height,
            )?.data;
        if (code) {
          onCode(code);
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}
