import sdl from "@kmamal/sdl";

const TWO_PI = 2 * Math.PI;

export class Beeper {
  private _playbackInstance: sdl.Sdl.Audio.AudioPlaybackInstance;
  private _channels: number;
  private _frequency: number;
  private _format: sdl.Sdl.Audio.Format;
  private _bytesPerSample: number;
  private _zeroSampleValue: number;
  private _sineAmplitude: number;
  private _sinePeriod: number;

  private _sampleTimer: NodeJS.Timeout | null;

  private _DEBUG: boolean;

  constructor() {
    this._playbackInstance = sdl.audio.openDevice({ type: "playback" });
    this._sampleTimer = null;

    const { channels, frequency, format } = this._playbackInstance;

    this._channels = channels;
    this._frequency = frequency;
    this._format = format;
    this._bytesPerSample = sdl.audio.bytesPerSample(format);
    this._zeroSampleValue = sdl.audio.zeroSampleValue(format);

    const minSampleValue = sdl.audio.minSampleValue(format);
    const maxSampleValue = sdl.audio.maxSampleValue(format);
    const range = maxSampleValue - minSampleValue;
    const amplitude = range / 2;
    this._sineAmplitude = 0.3 * amplitude;
    const sineNote = 440;
    this._sinePeriod = 1 / sineNote;

    this._DEBUG = false;
  }

  public on(): void {
    if (this._sampleTimer) {
      return;
    }

    let index = 0;

    const startTime = Date.now();
    const leadTime = (this._playbackInstance.buffered / this._frequency) * 1000;
    let lastTime = startTime - leadTime;

    this._playbackInstance.play();

    this._sampleTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;
      if (this._DEBUG)
        console.log({
          elapsed,
          queued: this._playbackInstance.queued,
        });
      if (elapsed === 0) {
        return;
      }
      const numFrames = Math.floor((elapsed / 1e3) * this._frequency);
      if (numFrames === 0) {
        return;
      }
      lastTime = now;

      const numSamples = numFrames * this._channels;
      const numBytes = numSamples * this._bytesPerSample;
      // if (this._DEBUG) console.log({ numFrames, numSamples, numBytes });
      const buffer = Buffer.alloc(numBytes);

      let offset = 0;
      for (let i = 0; i < numFrames; i++) {
        const time = index++ / this._frequency;
        const angle = (time / this._sinePeriod) * TWO_PI;
        const sample =
          this._zeroSampleValue + Math.sin(angle) * this._sineAmplitude;
        for (let j = 0; j < this._channels; j++) {
          offset = sdl.audio.writeSample(this._format, buffer, sample, offset);
        }
      }

      const arrayBuffer = buffer.buffer;
      this._playbackInstance.enqueue(Buffer.from(arrayBuffer));
    }, 0);
  }

  public off(): void {
    if (this._sampleTimer === null) {
      return;
    }

    clearInterval(this._sampleTimer);
    this._sampleTimer = null;
    this._playbackInstance.play(false);
    this._playbackInstance.clearQueue();
  }

  public setDebug(debug: boolean = true): void {
    this._DEBUG = debug;
  }
}
