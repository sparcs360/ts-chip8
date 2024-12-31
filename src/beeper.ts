import sdl from "@kmamal/sdl";

const TWO_PI = 2 * Math.PI;

export class Beeper {
  private _playbackInstance: sdl.Sdl.Audio.AudioPlaybackInstance;
  private _channels: number;
  private _frequency: number;
  private _format: sdl.Sdl.Audio.Format;
  private _bytesPerSample: number;
  private _zeroSampleValue: number;
  private _sineTime: number = 0;
  private _sineAmplitude: number;
  private _sinePeriod: number;

  private _sampleTimer: NodeJS.Timeout | null;

  private _DEBUG: boolean;
  private _DEBUG_onAt: number = 0;

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

    this._resetPlayBuffer();

    this._DEBUG = false;
  }

  public on(): void {
    if (this._DEBUG) {
      this._DEBUG_onAt = Date.now();
      console.log(
        {
          rt: this._DEBUG_onAt,
          t: this._sineTime,
        },
        "on()"
      );
    }

    if (this._sampleTimer) {
      return;
    }

    this._sampleTimer = setInterval(() => {
      this._fillPlayBuffer(250);
    }, 100);

    this._playbackInstance.play();
  }

  public off(): void {
    if (this._DEBUG) {
      const offAt = Date.now();
      console.log(
        {
          rt: offAt,
          d: offAt - this._DEBUG_onAt,
          t: this._sineTime,
        },
        "off()"
      );
    }

    if (this._sampleTimer === null) {
      return;
    }

    clearInterval(this._sampleTimer);
    this._sampleTimer = null;

    this._resetPlayBuffer();
  }

  private _resetPlayBuffer(): void {
    this._playbackInstance.pause();
    this._playbackInstance.clearQueue();
    this._sineTime = 0;
    this._fillPlayBuffer(500);
  }

  private _fillPlayBuffer(ms: number): void {
    const numFrames = Math.floor((ms * this._frequency) / 1000);
    const numBytes = numFrames * this._channels * this._bytesPerSample;
    const queuedBytes = this._playbackInstance.queued;
    const requiredBytes = numBytes - queuedBytes;
    const requiredFrames =
      requiredBytes / this._channels / this._bytesPerSample;
    if (this._DEBUG) {
      console.log(
        {
          rt: Date.now(),
          t: this._sineTime,
          qb: queuedBytes,
          rf: requiredFrames,
          rb: requiredBytes,
        },
        `_fillPlayBuffer(${ms})`
      );
    }

    if (requiredBytes <= 0) {
      return undefined;
    }

    const buffer = Buffer.alloc(requiredBytes);

    let offset = 0;
    for (let i = 0; i < requiredFrames; i++) {
      const time = this._sineTime++ / this._frequency;
      const angle = (time / this._sinePeriod) * TWO_PI;
      const sample =
        this._zeroSampleValue + Math.sin(angle) * this._sineAmplitude;
      for (let j = 0; j < this._channels; j++) {
        offset = sdl.audio.writeSample(this._format, buffer, sample, offset);
      }
    }

    this._playbackInstance.enqueue(Buffer.from(buffer.buffer));
  }

  public setDebug(debug: boolean = true): void {
    this._DEBUG = debug;
  }
}
