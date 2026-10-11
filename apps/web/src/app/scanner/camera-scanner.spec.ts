import { CameraScanner } from './camera-scanner';

describe('CameraScanner', () => {
  it('stops the acquired fake stream and detaches the video', async () => {
    const track = { stop: vi.fn() };
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const scanner = new CameraScanner();
    const video = { srcObject: null, play: vi.fn() } as unknown as HTMLVideoElement;
    vi.spyOn(scanner, 'scan').mockResolvedValue();
    const stop = await scanner.start(video, vi.fn());
    stop();
    expect(track.stop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    vi.unstubAllGlobals();
  });
});
