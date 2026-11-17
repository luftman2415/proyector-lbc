/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Music, BookOpen, Monitor, Sliders, Plus, Trash2, ArrowUp, ArrowDown,
  Search, Upload, Download, Eye, EyeOff, RefreshCw, Check, Copy,
  Sparkles, ExternalLink, Play, Pause, RotateCcw, AlertCircle, FileText,
  CheckCircle2, Image, Video, Mic, Settings, Home, Clock, Volume2, VolumeX,
  FolderOpen, FolderPlus, Sun, Moon, Type, AlignCenter, AlignLeft, Disc, Square,
  HelpCircle, Radio, ScrollText, GripVertical, Pencil, X
} from 'lucide-react';

import { Song, SongSection, SetlistsState, ProjectedContent, KaraokeItem, KaraokeSetlistsState } from './types';
import { parsearCancionesDesdeJSON, parsearCancionesDesdeArchivo, buscarCanciones, normalizarTexto } from './utils/songParser';
import { INITIAL_FEATURED_SONGS } from './data/defaultSongs';
import { VANILLA_APP_JS } from './utils/vanillaTemplates';
import { LIBROS_BIBLIA_COMPLETOS, VERSIONES_BIBLIA, BibleBookMeta } from './data/bibleMetadata';
import { obtenerVersiculosCapitulo, guardarLibroImportado, BibleVerse, VersiculoProyectado } from './data/bibleStore';
import { FONDOS_PREDETERMINADOS, BackgroundPreset } from './data/backgroundsData';
import { DIAPOSITIVAS_INICIALES, SlideItem, obtenerFallbackArteSVG } from './data/slidesData';
import { HelpModal } from './components/HelpModal';
import { ObsPanel } from './components/ObsPanel';
import { PredicaPanel } from './components/PredicaPanel';
// ==================== MOTOR SOUNDTOUCH PURE JS (SIN DEPENDENCIAS EXTERNAS) ====================
// Implementación 100% nativa de WSOLA (Waveform Similarity Overlap-Add) para modulación de tono
// Cero dependencias npm externas: funciona de inmediato en local y offline sin ejecutar npm install

class FifoSampleBuffer {
  private _vector: Float32Array;
  private _position: number;
  private _frameCount: number;

  constructor() {
    this._vector = new Float32Array();
    this._position = 0;
    this._frameCount = 0;
  }
  get vector() { return this._vector; }
  get position() { return this._position; }
  get startIndex() { return this._position * 2; }
  get frameCount() { return this._frameCount; }
  get endIndex() { return (this._position + this._frameCount) * 2; }

  clear() {
    this._vector.fill(0);
    this._position = 0;
    this._frameCount = 0;
  }
  put(numFrames: number) {
    this._frameCount += numFrames;
  }
  putSamples(samples: Float32Array, position = 0, numFrames = 0) {
    const sourceOffset = position * 2;
    if (!(numFrames >= 0)) {
      numFrames = (samples.length - sourceOffset) / 2;
    }
    const numSamples = numFrames * 2;
    this.ensureCapacity(numFrames + this._frameCount);
    const destOffset = this.endIndex;
    this.vector.set(samples.subarray(sourceOffset, sourceOffset + numSamples), destOffset);
    this._frameCount += numFrames;
  }
  putBuffer(buffer: FifoSampleBuffer, position = 0, numFrames = 0) {
    if (!(numFrames >= 0)) {
      numFrames = buffer.frameCount - position;
    }
    this.putSamples(buffer.vector, buffer.position + position, numFrames);
  }
  receive(numFrames?: number) {
    if (numFrames === undefined || !(numFrames >= 0) || numFrames > this._frameCount) {
      numFrames = this.frameCount;
    }
    this._frameCount -= numFrames;
    this._position += numFrames;
  }
  receiveSamples(output: Float32Array, numFrames = 0) {
    const numSamples = numFrames * 2;
    const sourceOffset = this.startIndex;
    output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
    this.receive(numFrames);
  }
  extract(output: Float32Array, position = 0, numFrames = 0) {
    const sourceOffset = this.startIndex + position * 2;
    const numSamples = numFrames * 2;
    output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
  }
  ensureCapacity(numFrames = 0) {
    const minLength = Math.floor(numFrames * 2);
    if (this._vector.length < minLength) {
      const newVector = new Float32Array(minLength);
      newVector.set(this._vector.subarray(this.startIndex, this.endIndex));
      this._vector = newVector;
      this._position = 0;
    } else {
      this.rewind();
    }
  }
  ensureAdditionalCapacity(numFrames = 0) {
    this.ensureCapacity(this._frameCount + numFrames);
  }
  rewind() {
    if (this._position > 0) {
      this._vector.set(this._vector.subarray(this.startIndex, this.endIndex));
      this._position = 0;
    }
  }
}

abstract class AbstractFifoSamplePipe {
  protected _inputBuffer: FifoSampleBuffer;
  protected _outputBuffer: FifoSampleBuffer;

  constructor(createBuffers: boolean) {
    if (createBuffers) {
      this._inputBuffer = new FifoSampleBuffer();
      this._outputBuffer = new FifoSampleBuffer();
    } else {
      this._inputBuffer = null as any;
      this._outputBuffer = null as any;
    }
  }
  get inputBuffer() { return this._inputBuffer; }
  set inputBuffer(b: FifoSampleBuffer) { this._inputBuffer = b; }
  get outputBuffer() { return this._outputBuffer; }
  set outputBuffer(b: FifoSampleBuffer) { this._outputBuffer = b; }
  clear() {
    this._inputBuffer?.clear();
    this._outputBuffer?.clear();
  }
  abstract process(): void;
}

class RateTransposer extends AbstractFifoSamplePipe {
  private _rate = 1;
  private slopeCount = 0;
  private prevSampleL = 0;
  private prevSampleR = 0;

  constructor(createBuffers = false) {
    super(createBuffers);
    this.reset();
  }
  get rate() { return this._rate; }
  set rate(r: number) { this._rate = r; }
  reset() {
    this.slopeCount = 0;
    this.prevSampleL = 0;
    this.prevSampleR = 0;
  }
  clear() {
    super.clear();
    this.reset();
  }
  process() {
    const numFrames = this._inputBuffer.frameCount;
    this._outputBuffer.ensureAdditionalCapacity(numFrames / this._rate + 1);
    const numFramesOutput = this.transpose(numFrames);
    this._inputBuffer.receive();
    this._outputBuffer.put(numFramesOutput);
  }
  transpose(numFrames = 0) {
    if (numFrames === 0) return 0;
    const src = this._inputBuffer.vector;
    const srcOffset = this._inputBuffer.startIndex;
    const dest = this._outputBuffer.vector;
    const destOffset = this._outputBuffer.endIndex;
    let used = 0;
    let i = 0;
    while (this.slopeCount < 1.0) {
      dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * this.prevSampleL + this.slopeCount * src[srcOffset];
      dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * this.prevSampleR + this.slopeCount * src[srcOffset + 1];
      i++;
      this.slopeCount += this._rate;
    }
    this.slopeCount -= 1.0;
    if (numFrames !== 1) {
      out: while (true) {
        while (this.slopeCount > 1.0) {
          this.slopeCount -= 1.0;
          used++;
          if (used >= numFrames - 1) break out;
        }
        const srcIndex = srcOffset + 2 * used;
        dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * src[srcIndex] + this.slopeCount * src[srcIndex + 2];
        dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * src[srcIndex + 1] + this.slopeCount * src[srcIndex + 3];
        i++;
        this.slopeCount += this._rate;
      }
    }
    this.prevSampleL = src[srcOffset + 2 * numFrames - 2];
    this.prevSampleR = src[srcOffset + 2 * numFrames - 1];
    return i;
  }
}

const _SCAN_OFFSETS = [
  [124, 186, 248, 310, 372, 434, 496, 558, 620, 682, 744, 806, 868, 930, 992, 1054, 1116, 1178, 1240, 1302, 1364, 1426, 1488, 0],
  [-100, -75, -50, -25, 25, 50, 75, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [-20, -15, -10, -5, 5, 10, 15, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [-4, -3, -2, -1, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

class Stretch extends AbstractFifoSamplePipe {
  private _quickSeek = true;
  private midBuffer: Float32Array | null = null;
  private refMidBuffer: Float32Array | null = null;
  private overlapLength = 0;
  private autoSeqSetting = true;
  private autoSeekSetting = true;
  private _tempo = 1;
  private sampleRate = 44100;
  private sequenceMs = 0;
  private seekWindowMs = 0;
  private overlapMs = 8;
  private seekWindowLength = 0;
  private seekLength = 0;
  private nominalSkip = 0;
  private skipFract = 0;
  private sampleReq = 0;

  constructor(createBuffers = false) {
    super(createBuffers);
    this.setParameters(44100, 0, 0, 8);
  }
  clear() {
    super.clear();
    this.midBuffer = null;
    if (this.refMidBuffer) this.refMidBuffer.fill(0);
    this.skipFract = 0;
  }
  setParameters(sampleRate: number, sequenceMs: number, seekWindowMs: number, overlapMs: number) {
    if (sampleRate > 0) this.sampleRate = sampleRate;
    if (overlapMs > 0) this.overlapMs = overlapMs;
    this.autoSeqSetting = sequenceMs <= 0;
    this.autoSeekSetting = seekWindowMs <= 0;
    this.sequenceMs = sequenceMs;
    this.seekWindowMs = seekWindowMs;
    this.calculateSequenceParameters();
    this.calculateOverlapLength(this.overlapMs);
    this.tempo = this._tempo;
  }
  set tempo(newTempo: number) {
    this._tempo = newTempo;
    this.calculateSequenceParameters();
    this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength);
    this.skipFract = 0;
    const intskip = Math.floor(this.nominalSkip + 0.5);
    this.sampleReq = Math.max(intskip + this.overlapLength, this.seekWindowLength) + this.seekLength;
  }
  get tempo() { return this._tempo; }

  private calculateOverlapLength(overlapInMsec: number) {
    let newOvl = (this.sampleRate * overlapInMsec) / 1000;
    newOvl = newOvl < 16 ? 16 : newOvl;
    newOvl -= newOvl % 8;
    this.overlapLength = newOvl;
    this.refMidBuffer = new Float32Array(this.overlapLength * 2);
    this.midBuffer = new Float32Array(this.overlapLength * 2);
  }
  private calculateSequenceParameters() {
    if (this.autoSeqSetting) {
      const seq = 125.0 + ((50.0 - 125.0) / (4.0 - 0.25)) * (this._tempo - 0.25);
      this.sequenceMs = Math.floor(Math.max(50.0, Math.min(125.0, seq)) + 0.5);
    }
    if (this.autoSeekSetting) {
      const seek = 25.0 + ((15.0 - 25.0) / (4.0 - 0.25)) * (this._tempo - 0.25);
      this.seekWindowMs = Math.floor(Math.max(15.0, Math.min(25.0, seek)) + 0.5);
    }
    this.seekWindowLength = Math.floor((this.sampleRate * this.sequenceMs) / 1000);
    this.seekLength = Math.floor((this.sampleRate * this.seekWindowMs) / 1000);
  }
  private seekBestOverlapPosition() {
    return this._quickSeek ? this.seekBestOverlapPositionStereoQuick() : this.seekBestOverlapPositionStereo();
  }
  private seekBestOverlapPositionStereo() {
    this.preCalculateCorrelationReferenceStereo();
    let bestOffset = 0;
    let bestCorrelation = -Number.MAX_VALUE;
    for (let i = 0; i < this.seekLength; i++) {
      const correlation = this.calculateCrossCorrelationStereo(2 * i, this.refMidBuffer!);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = i;
      }
    }
    return bestOffset;
  }
  private seekBestOverlapPositionStereoQuick() {
    this.preCalculateCorrelationReferenceStereo();
    let bestOffset = 0;
    let bestCorrelation = -Number.MAX_VALUE;
    let correlationOffset = 0;
    for (let scanCount = 0; scanCount < 4; scanCount++) {
      let j = 0;
      while (_SCAN_OFFSETS[scanCount][j]) {
        const tempOffset = correlationOffset + _SCAN_OFFSETS[scanCount][j];
        if (tempOffset >= this.seekLength) break;
        const correlation = this.calculateCrossCorrelationStereo(2 * tempOffset, this.refMidBuffer!);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = tempOffset;
        }
        j++;
      }
      correlationOffset = bestOffset;
    }
    return bestOffset;
  }
  private preCalculateCorrelationReferenceStereo() {
    for (let i = 0; i < this.overlapLength; i++) {
      const temp = i * (this.overlapLength - i);
      const ctx = i * 2;
      this.refMidBuffer![ctx] = this.midBuffer![ctx] * temp;
      this.refMidBuffer![ctx + 1] = this.midBuffer![ctx + 1] * temp;
    }
  }
  private calculateCrossCorrelationStereo(mixingPosition: number, compare: Float32Array) {
    const mixing = this._inputBuffer.vector;
    mixingPosition += this._inputBuffer.startIndex;
    let correlation = 0;
    const calcLength = 2 * this.overlapLength;
    for (let i = 2; i < calcLength; i += 2) {
      const mixingOffset = i + mixingPosition;
      correlation += mixing[mixingOffset] * compare[i] + mixing[mixingOffset + 1] * compare[i + 1];
    }
    return correlation;
  }
  private overlap(overlapPosition: number) {
    const input = this._inputBuffer.vector;
    const inputPosition = 2 * overlapPosition + this._inputBuffer.startIndex;
    const output = this._outputBuffer.vector;
    const outputPosition = this._outputBuffer.endIndex;
    const frameScale = 1 / this.overlapLength;
    for (let i = 0; i < this.overlapLength; i++) {
      const tempFrame = (this.overlapLength - i) * frameScale;
      const fi = i * frameScale;
      const ctx = 2 * i;
      output[ctx + outputPosition] = input[ctx + inputPosition] * fi + this.midBuffer![ctx] * tempFrame;
      output[ctx + outputPosition + 1] = input[ctx + inputPosition + 1] * fi + this.midBuffer![ctx + 1] * tempFrame;
    }
  }
  process() {
    if (this.midBuffer === null) {
      if (this._inputBuffer.frameCount < this.overlapLength) return;
      this.midBuffer = new Float32Array(this.overlapLength * 2);
      this._inputBuffer.receiveSamples(this.midBuffer, this.overlapLength);
    }
    while (this._inputBuffer.frameCount >= this.sampleReq) {
      const offset = this.seekBestOverlapPosition();
      this._outputBuffer.ensureAdditionalCapacity(this.overlapLength);
      this.overlap(Math.floor(offset));
      this._outputBuffer.put(this.overlapLength);
      const temp = this.seekWindowLength - 2 * this.overlapLength;
      if (temp > 0) {
        this._outputBuffer.putBuffer(this._inputBuffer, offset + this.overlapLength, temp);
      }
      const start = this._inputBuffer.startIndex + 2 * (offset + this.seekWindowLength - this.overlapLength);
      this.midBuffer.set(this._inputBuffer.vector.subarray(start, start + 2 * this.overlapLength));
      this.skipFract += this.nominalSkip;
      const overlapSkip = Math.floor(this.skipFract);
      this.skipFract -= overlapSkip;
      this._inputBuffer.receive(overlapSkip);
    }
  }
}

class SoundTouch {
  private transposer = new RateTransposer(false);
  private stretch = new Stretch(false);
  private _inputBuffer = new FifoSampleBuffer();
  private _intermediateBuffer = new FifoSampleBuffer();
  private _outputBuffer = new FifoSampleBuffer();
  private _rate = 0;
  private _tempo = 0;
  private virtualPitch = 1.0;
  private virtualRate = 1.0;
  private virtualTempo = 1.0;

  constructor() {
    this.calculateEffectiveRateAndTempo();
  }
  clear() {
    this.transposer.clear();
    this.stretch.clear();
  }
  get rate() { return this._rate; }
  set rate(r: number) {
    this.virtualRate = r;
    this.calculateEffectiveRateAndTempo();
  }
  get tempo() { return this._tempo; }
  set tempo(t: number) {
    this.virtualTempo = t;
    this.calculateEffectiveRateAndTempo();
  }
  set pitch(p: number) {
    this.virtualPitch = p;
    this.calculateEffectiveRateAndTempo();
  }
  set pitchSemitones(semitones: number) {
    this.pitch = Math.exp((0.69314718056 * semitones) / 12.0);
  }
  get inputBuffer() { return this._inputBuffer; }
  get outputBuffer() { return this._outputBuffer; }

  private calculateEffectiveRateAndTempo() {
    this._tempo = this.virtualTempo / this.virtualPitch;
    this._rate = this.virtualRate * this.virtualPitch;
    this.stretch.tempo = this._tempo;
    this.transposer.rate = this._rate;
    if (this._rate > 1.0) {
      if (this._outputBuffer !== this.transposer.outputBuffer) {
        this.stretch.inputBuffer = this._inputBuffer;
        this.stretch.outputBuffer = this._intermediateBuffer;
        this.transposer.inputBuffer = this._intermediateBuffer;
        this.transposer.outputBuffer = this._outputBuffer;
      }
    } else {
      if (this._outputBuffer !== this.stretch.outputBuffer) {
        this.transposer.inputBuffer = this._inputBuffer;
        this.transposer.outputBuffer = this._intermediateBuffer;
        this.stretch.inputBuffer = this._intermediateBuffer;
        this.stretch.outputBuffer = this._outputBuffer;
      }
    }
  }
  process() {
    if (this._rate > 1.0) {
      this.stretch.process();
      this.transposer.process();
    } else {
      this.transposer.process();
      this.stretch.process();
    }
  }
}

class SimpleFilter {
  private historyBufferSize = 22050;
  private _sourcePosition = 0;
  private outputBufferPosition = 0;
  private _position = 0;

  constructor(
    private sourceSound: WebAudioBufferSource,
    private pipe: SoundTouch,
    private callback: () => void = () => {}
  ) {}

  get position() { return this._position; }
  get sourcePosition() { return this._sourcePosition; }
  set sourcePosition(pos: number) {
    this.clear();
    this._sourcePosition = pos;
  }
  clear() {
    this.pipe.clear();
    this.outputBufferPosition = 0;
  }
  onEnd() { this.callback(); }

  fillInputBuffer(numFrames = 0) {
    const samples = new Float32Array(numFrames * 2);
    const numFramesExtracted = this.sourceSound.extract(samples, numFrames, this._sourcePosition);
    this._sourcePosition += numFramesExtracted;
    this.pipe.inputBuffer.putSamples(samples, 0, numFramesExtracted);
  }
  fillOutputBuffer(numFrames = 0) {
    while (this.pipe.outputBuffer.frameCount < numFrames) {
      const numInputFrames = 8192 * 2 - this.pipe.inputBuffer.frameCount;
      this.fillInputBuffer(numInputFrames);
      if (this.pipe.inputBuffer.frameCount < 8192 * 2) break;
      this.pipe.process();
    }
  }
  extract(target: Float32Array, numFrames = 0) {
    this.fillOutputBuffer(this.outputBufferPosition + numFrames);
    const numFramesExtracted = Math.min(numFrames, this.pipe.outputBuffer.frameCount - this.outputBufferPosition);
    this.pipe.outputBuffer.extract(target, this.outputBufferPosition, numFramesExtracted);
    const currentFrames = this.outputBufferPosition + numFramesExtracted;
    this.outputBufferPosition = Math.min(this.historyBufferSize, currentFrames);
    this.pipe.outputBuffer.receive(Math.max(currentFrames - this.historyBufferSize, 0));
    this._position += numFramesExtracted;
    return numFramesExtracted;
  }
}

class WebAudioBufferSource {
  private _position = 0;
  constructor(public buffer: AudioBuffer) {}
  get dualChannel() { return this.buffer.numberOfChannels > 1; }
  get position() { return this._position; }
  set position(v: number) { this._position = v; }

  extract(target: Float32Array, numFrames = 0, position = 0) {
    this._position = position;
    const left = this.buffer.getChannelData(0);
    const right = this.dualChannel ? this.buffer.getChannelData(1) : left;
    for (let i = 0; i < numFrames; i++) {
      target[i * 2] = left[i + position] || 0;
      target[i * 2 + 1] = right[i + position] || 0;
    }
    return Math.min(numFrames, Math.max(0, left.length - position));
  }
}

class PitchShifter {
  private _soundtouch = new SoundTouch();
  private _filter: SimpleFilter;
  private _node: ScriptProcessorNode;
  public duration: number;
  public sampleRate: number;
  public timePlayed = 0;
  public sourcePosition = 0;

  constructor(
    context: AudioContext,
    buffer: AudioBuffer,
    bufferSize = 4096,
    onEnd: () => void = () => {}
  ) {
    const source = new WebAudioBufferSource(buffer);
    this.duration = buffer.duration;
    this.sampleRate = context.sampleRate;
    this._filter = new SimpleFilter(source, this._soundtouch, onEnd);

    this._node = context.createScriptProcessor(bufferSize, 2, 2);
    const samples = new Float32Array(bufferSize * 2);

    this._node.onaudioprocess = (event) => {
      const left = event.outputBuffer.getChannelData(0);
      const right = event.outputBuffer.getChannelData(1);
      const framesExtracted = this._filter.extract(samples, bufferSize);
      this.sourcePosition = this._filter.sourcePosition;
      this.timePlayed = this.sourcePosition / this.sampleRate;

      if (framesExtracted === 0) {
        this._filter.onEnd();
      }
      for (let i = 0; i < bufferSize; i++) {
        left[i] = i < framesExtracted ? samples[i * 2] : 0;
        right[i] = i < framesExtracted ? samples[i * 2 + 1] : 0;
      }
    };
  }

  get percentagePlayed() {
    return (100 * this._filter.sourcePosition) / (this.duration * this.sampleRate);
  }
  set percentagePlayed(perc: number) {
    this._filter.sourcePosition = Math.floor((perc / 100) * this.duration * this.sampleRate);
    this.sourcePosition = this._filter.sourcePosition;
    this.timePlayed = this.sourcePosition / this.sampleRate;
  }
  set pitchSemitones(semitone: number) {
    this._soundtouch.pitchSemitones = semitone;
  }
  set tempo(tempo: number) {
    this._soundtouch.tempo = tempo;
  }
  connect(dest: AudioNode) {
    this._node.connect(dest);
  }
  disconnect() {
    try { this._node.disconnect(); } catch (e) {}
  }
}

// Motor Profesional de Cambio de Tono en Tiempo Real basado en SoundTouch (WSOLA)
// Permite subir/bajar semitonos manteniendo la velocidad y el tiempo de la canción 100% constantes
export class PitchAudioPlayer {
  private ctx: AudioContext | null = null;
  private shifter: any = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private currentPitch: number = 0;
  private currentVolume: number = 0.85;
  private isMuted: boolean = false;
  private durationSec: number = 0;
  private trackingTimer: any = null;
  private onTimeUpdateCb: ((curr: number, dur: number) => void) | null = null;
  private onEndCb: (() => void) | null = null;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async load(source: File | string, pitch = 0): Promise<number> {
    this.stop();
    const ctx = this.getContext();
    let arrayBuffer: ArrayBuffer;

    if (source instanceof File) {
      arrayBuffer = await source.arrayBuffer();
    } else {
      const res = await fetch(source);
      arrayBuffer = await res.arrayBuffer();
    }

    this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.durationSec = this.audioBuffer.duration;
    this.currentPitch = pitch;
    this.initShifter(0);
    return this.durationSec;
  }

  private initShifter(startPercentage = 0) {
    if (!this.audioBuffer) return;
    const ctx = this.getContext();

    if (this.shifter) {
      try { this.shifter.disconnect(); } catch (e) {}
      this.shifter = null;
    }

    if (!this.gainNode) {
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, ctx.currentTime);
      this.gainNode.connect(ctx.destination);
    }

    this.shifter = new (PitchShifter as any)(ctx, this.audioBuffer, 4096, () => {
      this.isPlaying = false;
      this.stopTracking();
      if (this.onEndCb) this.onEndCb();
    });

    this.shifter.tempo = 1.0;
    this.shifter.pitchSemitones = this.currentPitch;
    if (startPercentage > 0) {
      this.shifter.percentagePlayed = startPercentage;
    }
  }

  public play() {
    if (!this.audioBuffer) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!this.shifter) {
      this.initShifter(0);
    }

    if (this.shifter && this.gainNode) {
      try {
        this.shifter.disconnect();
      } catch (e) {}
      this.shifter.connect(this.gainNode);
    }

    this.isPlaying = true;
    this.startTracking();
  }

  public pause() {
    if (this.shifter) {
      try {
        this.shifter.disconnect();
      } catch (e) {}
    }
    this.isPlaying = false;
    this.stopTracking();
  }

  public stop() {
    this.pause();
    if (this.shifter) {
      this.shifter.percentagePlayed = 0;
    }
  }

  public seek(seconds: number) {
    if (!this.durationSec || this.durationSec <= 0) return;
    const perc = Math.max(0, Math.min(100, (seconds / this.durationSec) * 100));
    if (this.shifter) {
      this.shifter.percentagePlayed = perc;
    }
  }

  public setPitch(semitones: number) {
    this.currentPitch = semitones;
    if (this.shifter) {
      this.shifter.pitchSemitones = semitones;
      this.shifter.tempo = 1.0; // Velocidad y tiempo 100% constantes
    }
  }

  public setVolume(vol0to100: number, muted = false) {
    this.currentVolume = Math.max(0, Math.min(1, vol0to100 / 100));
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      const target = this.isMuted ? 0 : this.currentVolume;
      this.gainNode.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  public getCurrentTime(): number {
    if (!this.shifter || !this.durationSec) return 0;
    return this.shifter.timePlayed || ((this.shifter.percentagePlayed || 0) / 100) * this.durationSec;
  }

  public getDuration(): number {
    return this.durationSec;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public onTimeUpdate(cb: (curr: number, dur: number) => void) {
    this.onTimeUpdateCb = cb;
  }

  public onEnd(cb: () => void) {
    this.onEndCb = cb;
  }

  private startTracking() {
    this.stopTracking();
    this.trackingTimer = setInterval(() => {
      if (this.isPlaying && this.onTimeUpdateCb) {
        this.onTimeUpdateCb(this.getCurrentTime(), this.durationSec);
      }
    }, 200);
  }

  private stopTracking() {
    if (this.trackingTimer) {
      clearInterval(this.trackingTimer);
      this.trackingTimer = null;
    }
  }

  public clear() {
    this.stop();
    if (this.shifter) {
      try { this.shifter.disconnect(); } catch (e) {}
      this.shifter = null;
    }
    this.audioBuffer = null;
    this.durationSec = 0;
  }
}

// Tipografías estándar garantizadas en Windows (funcionan 100% offline)
export const FUENTES_SISTEMA = [
  { id: "'Segoe UI', system-ui, -apple-system, sans-serif", nombre: "Segoe UI (Moderna de Windows)" },
  { id: "'Impact', 'Arial Black', sans-serif", nombre: "Impact (Gruesa, Máximo Impacto)" },
  { id: "'Georgia', 'Times New Roman', serif", nombre: "Georgia (Clásica Eclesiástica con Serifa)" },
  { id: "'Trebuchet MS', 'Verdana', sans-serif", nombre: "Trebuchet MS (Redonda y Clara)" },
  { id: "'Verdana', sans-serif", nombre: "Verdana (Espaciada para Gran Distancia)" },
  { id: "'Calibri', 'Candara', sans-serif", nombre: "Calibri (Moderna Suave)" },
  { id: "'Courier New', monospace", nombre: "Courier New (Estilo Máquina de Escribir)" }
];

export default function App() {
  // Navigation tabs matching church operations
  const [moduloActivo, setModuloActivo] = useState<'portada' | 'biblia' | 'canciones' | 'predica' | 'fondos' | 'video' | 'karaoke' | 'anuncios' | 'obs' | 'config' | 'descargar'>('portada');

  // Help modal state
  const [mostrarAyuda, setMostrarAyuda] = useState<boolean>(false);

  // Clock
  const [horaActual, setHoraActual] = useState<string>('');
  const [fechaActual, setFechaActual] = useState<string>('');

  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date();
      setHoraActual(ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setFechaActual(ahora.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    actualizarReloj();
    const timer = setInterval(actualizarReloj, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const mostrarToast = (texto: string, tipo: 'exito' | 'error' | 'info' | 'success' = 'exito') => {
    const t = tipo === 'success' ? 'exito' : tipo;
    setNotificacion({ tipo: t, texto });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // BroadcastChannel & Projection
  const canalRef = useRef<BroadcastChannel | null>(null);
  const [proyeccionActual, setProyeccionActual] = useState<ProjectedContent | null>(null);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [proyectorConectado, setProyectorConectado] = useState<boolean>(false);
  const [tamanoFuente, setTamanoFuente] = useState<number>(() => {
    const s = localStorage.getItem('lbc_tamano_fuente');
    return s ? Number(s) : 52;
  });
  const [fondoActivo, setFondoActivo] = useState<string>(() => {
    return localStorage.getItem('lbc_fondo_activo') || FONDOS_PREDETERMINADOS[0].cssBackground || '';
  });
  const [tipoFondoActivo, setTipoFondoActivo] = useState<string>(() => {
    return localStorage.getItem('lbc_tipo_fondo') || FONDOS_PREDETERMINADOS[0].tipo || 'anim';
  });

  // Fondos personalizados subidos por el operador (Imágenes o Videos MP4 en bucle)
  const [fondosPersonalizados, setFondosPersonalizados] = useState<BackgroundPreset[]>(() => {
    try {
      const g = localStorage.getItem('lbc_fondos_subidos');
      return g ? JSON.parse(g) : [];
    } catch (e) {
      return [];
    }
  });
  const fondoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Ajustes de visualización y contraste de fondos (contain, cover, fill)
  const [modoAjusteFondo, setModoAjusteFondo] = useState<'contain' | 'cover' | 'fill'>(() => {
    return (localStorage.getItem('lbc_modo_ajuste_fondo') as any) || 'contain';
  });
  const [oscurecedorFondo, setOscurecedorFondo] = useState<number>(() => {
    const s = localStorage.getItem('lbc_scrim_fondo');
    return s !== null ? parseFloat(s) : 0.45;
  });

  // Ajustes de visualización y contraste para Diapositivas & Canva (contain, cover, fill)
  const [modoAjusteDiapositiva, setModoAjusteDiapositiva] = useState<'contain' | 'cover' | 'fill'>(() => {
    return (localStorage.getItem('lbc_modo_ajuste_diapositiva') as any) || 'contain';
  });
  const [oscurecedorDiapositiva, setOscurecedorDiapositiva] = useState<number>(() => {
    const s = localStorage.getItem('lbc_scrim_diapositiva');
    return s !== null ? parseFloat(s) : 0;
  });

  // Control de Pitch (Tono / Semitonos) para Karaoke & Audio
  const [pitchSemitonos, setPitchSemitonos] = useState<number>(0);
  const [audioFileCargado, setAudioFileCargado] = useState<File | null>(null);
  const [cargandoAudio, setCargandoAudio] = useState<boolean>(false);

  // Estados para reproductor de YouTube
  const [youtubeInputUrl, setYoutubeInputUrl] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('');
  const [youtubeEnProyector, setYoutubeEnProyector] = useState<boolean>(false);

  // ==================== AJUSTES PERSONALIZADOS DEL SISTEMA ====================
  const [fuenteProyector, setFuenteProyector] = useState<string>(() => {
    return localStorage.getItem('lbc_fuente') || "'Segoe UI', system-ui, -apple-system, sans-serif";
  });
  const [colorTextoProyector, setColorTextoProyector] = useState<string>(() => {
    return localStorage.getItem('lbc_color_texto') || '#ffffff';
  });
  const [sombraTexto, setSombraTexto] = useState<boolean>(() => {
    return localStorage.getItem('lbc_sombra') !== 'false';
  });
  const [alineacionProyector, setAlineacionProyector] = useState<'center' | 'left'>(() => {
    return (localStorage.getItem('lbc_alineacion') as any) || 'center';
  });
  const [temaOperador, setTemaOperador] = useState<'oscuro' | 'claro'>(() => {
    return (localStorage.getItem('lbc_tema') as any) || 'oscuro';
  });
  const [nombreCongregacion, setNombreCongregacion] = useState<string>(() => {
    return localStorage.getItem('lbc_nombre_iglesia') || 'Iglesia Cristiana Cuadrangular Las Brisas';
  });

  // COMUNICACIÓN DUAL ROBUSTA (BroadcastChannel + StorageEvent)
  // Garantiza envío instantáneo en Windows / Electron sin retrasos ni congelamientos
  const enviarAlProyector = (data: any) => {
    try {
      canalRef.current?.postMessage(data);
    } catch (e) {}

    try {
      localStorage.setItem('proyector_lbc_msg', JSON.stringify({ ...data, _ts: Date.now() }));
    } catch (e) {}

    // Publicar en la Red Local para el computador de transmisión con OBS Studio
    try {
      fetch('http://127.0.0.1:3001/api/obs-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, _ts: Date.now() })
      }).catch(() => {});
    } catch (e) {}
  };

  const emitirAjustesProyector = (nuevos: {
    fuente?: string;
    colorTexto?: string;
    sombraTexto?: boolean;
    alineacion?: string;
    tamano?: number;
  }) => {
    enviarAlProyector({
      accion: 'ajustesProyector',
      fuente: nuevos.fuente !== undefined ? nuevos.fuente : fuenteProyector,
      colorTexto: nuevos.colorTexto !== undefined ? nuevos.colorTexto : colorTextoProyector,
      sombraTexto: nuevos.sombraTexto !== undefined ? nuevos.sombraTexto : sombraTexto,
      alineacion: nuevos.alineacion !== undefined ? nuevos.alineacion : alineacionProyector,
      tamano: nuevos.tamano !== undefined ? nuevos.tamano : tamanoFuente
    });
  };

  // ==================== BIBLIA COMPLETA (66 LIBROS) ====================
  const [filtroTestamento, setFiltroTestamento] = useState<'todos' | 'antiguo' | 'nuevo'>('todos');
  const [busquedaLibro, setBusquedaLibro] = useState<string>('');
  const [libroSeleccionado, setLibroSeleccionado] = useState<BibleBookMeta>(LIBROS_BIBLIA_COMPLETOS.find(l => l.archivo === 'genesis.json') || LIBROS_BIBLIA_COMPLETOS[0]);
  const [versionBiblia, setVersionBiblia] = useState<string>('rv1960');
  const [capituloActual, setCapituloActual] = useState<string>('1');
  const [versiculosCapitulo, setVersiculosCapitulo] = useState<BibleVerse[]>([]);
  const [versiculoActivoNum, setVersiculoActivoNum] = useState<number>(1);
  const [busquedaVersiculoTexto, setBusquedaVersiculoTexto] = useState<string>('');
  const [historialVersiculos, setHistorialVersiculos] = useState<VersiculoProyectado[]>([]);

  // Folder and file inputs for Bible files
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const bibleFileInputRef = useRef<HTMLInputElement | null>(null);
  const listaVersiculosRef = useRef<HTMLDivElement | null>(null);
  const nuevaLetraRef = useRef<HTMLTextAreaElement | null>(null);
  const editLetraRef = useRef<HTMLTextAreaElement | null>(null);
  // Insertar marcador en la posición actual del cursor
const insertarMarcador = (
  tipo: string,
  textarea: HTMLTextAreaElement | null,
  actualizarLetra: (texto: string) => void
) => {
  if (!textarea) return;

  const texto = textarea.value;
  const inicio = textarea.selectionStart;
  const fin = textarea.selectionEnd;

  const antes = texto.slice(0, inicio);
  const despues = texto.slice(fin);

  const saltoAntes = antes.length > 0 && !antes.endsWith('\n') ? '\n' : '';

  const saltoDespues = despues.length > 0 && !despues.startsWith('\n') ? '\n' : '';

  const marcador = `${saltoAntes}[${tipo}]${saltoDespues ? '\n' : ''}`;
  const nuevoTexto = antes + marcador + despues;
  const nuevaPosicion = antes.length + marcador.length;

  actualizarLetra(nuevoTexto);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(nuevaPosicion, nuevaPosicion);
  });
};

  // Load verses when book, chapter or version changes
  useEffect(() => {
    let montado = true;
    const cargar = async () => {
      const vers = await obtenerVersiculosCapitulo(versionBiblia, libroSeleccionado.archivo, capituloActual);
      if (montado) {
        setVersiculosCapitulo(vers);
        if (vers.length > 0 && !vers.some(v => v.numero === versiculoActivoNum)) {
          setVersiculoActivoNum(vers[0].numero);
        }
      }
    };
    cargar();
    return () => { montado = false; };
  }, [libroSeleccionado, capituloActual, versionBiblia]);

  // Reiniciar la lista al cambiar de libro o capítulo
useEffect(() => {
  if (listaVersiculosRef.current) {
    listaVersiculosRef.current.scrollTop = 0;
  }
}, [libroSeleccionado, capituloActual]);

  // Project selected Bible verse
  const proyectarVersiculo = (versiculo: BibleVerse) => {
    setVersiculoActivoNum(versiculo.numero);
    setIsBlackout(false);

    const cita = `${libroSeleccionado.nombre} ${capituloActual}:${versiculo.numero}`;
    const salidaFormatted = `"${versiculo.texto}"\n\n— ${cita} (${versionBiblia.toUpperCase()})`;

    setProyeccionActual({
      id: `biblia-${libroSeleccionado.id}-${capituloActual}-${versiculo.numero}`,
      tipo: 'biblia',
      texto: `"${versiculo.texto}"`,
      pie: `— ${cita} (${versionBiblia.toUpperCase()})`,
      titulo: cita
    });

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: salidaFormatted,
        tipo: 'biblia'
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrar',
      texto: salidaFormatted,
      tipo: 'biblia'
    });

    // Add to history
    const nuevoHistorial: VersiculoProyectado = {
      id: `${Date.now()}`,
      cita,
      texto: versiculo.texto,
      version: versionBiblia.toUpperCase(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };
    setHistorialVersiculos(prev => [nuevoHistorial, ...prev.slice(0, 20)]);
  };

  // Bulk Bible folder / files importer
  const handleCargaArchivosBiblia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let cargados = 0;
    Array.from(files).forEach(file => {
      if (!file.name.endsWith('.json')) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          let version = versionBiblia;
          const rutaCompleta = (file as any).webkitRelativePath || file.name;
          for (const v of VERSIONES_BIBLIA) {
            if (rutaCompleta.toLowerCase().includes(v.codigo)) {
              version = v.codigo;
              break;
            }
          }

          await guardarLibroImportado(version, file.name, json);
          cargados++;

          if (cargados === files.length) {
            mostrarToast(`¡Se indexaron ${cargados} libros bíblicos exitosamente en tu PC!`);
            obtenerVersiculosCapitulo(versionBiblia, libroSeleccionado.archivo, capituloActual).then(setVersiculosCapitulo);
          }
        } catch (err) {
          console.warn(`Error al leer archivo bíblico ${file.name}:`, err);
        }
      };
      reader.readAsText(file);
    });
  };

  // Filtered books
  const librosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaLibro);
    return LIBROS_BIBLIA_COMPLETOS.filter(l => {
      const coincideTestamento = filtroTestamento === 'todos' || l.testamento === filtroTestamento;
      const coincideTexto = !texto || normalizarTexto(l.nombre).includes(texto);
      return coincideTestamento && coincideTexto;
    });
  }, [busquedaLibro, filtroTestamento]);

  // Filtered verses in active chapter
  const versiculosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaVersiculoTexto);
    if (!texto) return versiculosCapitulo;
    return versiculosCapitulo.filter(v => 
      String(v.numero) === texto || normalizarTexto(v.texto).includes(texto)
    );
  }, [versiculosCapitulo, busquedaVersiculoTexto]);

  // Llevar la lista al versículo seleccionado cuando se limpia el filtro
  useEffect(() => {
    if (busquedaVersiculoTexto !== '') return;

    const lista = listaVersiculosRef.current;
    if (!lista) return;

    const versiculo = lista.querySelector(
      `[data-versiculo="${versiculoActivoNum}"]`
    ) as HTMLElement | null;

    if (versiculo) {
      versiculo.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [busquedaVersiculoTexto]);

  // ==================== CANCIONES & SETLISTS ====================
  const [repertorio, setRepertorio] = useState<Song[]>(INITIAL_FEATURED_SONGS);
  const [cancionSeleccionada, setCancionSeleccionada] = useState<Song | null>(INITIAL_FEATURED_SONGS[0]);
  const [seccionActivaIdx, setSeccionActivaIdx] = useState<number>(-1);
  const [busquedaCanciones, setBusquedaCanciones] = useState<string>('');
  const [buscarEnLetra, setBuscarEnLetra] = useState<boolean>(false);
  const [setlistActual, setSetlistActual] = useState<string>('domingo');
  const [setlists, setSetlists] = useState<SetlistsState>(() => {
    const guardado = localStorage.getItem('lbc_setlists');
    if (guardado) {
      try { return JSON.parse(guardado); } catch (e) {}
    }
    return {
      general: [],
      miercoles: [INITIAL_FEATURED_SONGS[1], INITIAL_FEATURED_SONGS[5]],
      sabado: [INITIAL_FEATURED_SONGS[3], INITIAL_FEATURED_SONGS[7]],
      domingo: [INITIAL_FEATURED_SONGS[0], INITIAL_FEATURED_SONGS[2], INITIAL_FEATURED_SONGS[4]]
    };
  });

  const [mostrarModalNuevaCancion, setMostrarModalNuevaCancion] = useState<boolean>(false);
  const [nuevaTitulo, setNuevaTitulo] = useState<string>('');
  const [errorNuevaCancion, setErrorNuevaCancion] = useState<boolean>(false);
  const [nuevaAutor, setNuevaAutor] = useState<string>('');
  const [nuevaLetra, setNuevaLetra] = useState<string>('');
  const songFileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal: Editar Canción y Letras
  const [mostrarModalEditarCancion, setMostrarModalEditarCancion] = useState<boolean>(false);
  const [mostrarConfirmarEliminarCancion, setMostrarConfirmarEliminarCancion] = useState<boolean>(false);
  const [cancionEditando, setCancionEditando] = useState<Song | null>(null);
  const [editTitulo, setEditTitulo] = useState<string>('');
  const [editAutor, setEditAutor] = useState<string>('');
  const [editLetra, setEditLetra] = useState<string>('');

  // Initialize BroadcastChannel
  useEffect(() => {
    const canal = new BroadcastChannel('proyector_lbc');
    canalRef.current = canal;

    canal.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.accion === 'proyector_abierto' || data.accion === 'pong') {
        setProyectorConectado(true);
        // Sincronizar ajustes al proyector recién conectado
        enviarAlProyector({ accion: 'fondo', fondo: fondoActivo });
        emitirAjustesProyector({
          fuente: fuenteProyector,
          colorTexto: colorTextoProyector,
          sombraTexto,
          alineacion: alineacionProyector,
          tamano: tamanoFuente
        });
      }
    };

    enviarAlProyector({ accion: 'ping' });
    cargarCancionesIniciales();

    return () => { canal.close(); };
  }, []);

  const cargarCancionesIniciales = async () => {
    const guardado = localStorage.getItem('proyector_lbc_canciones');
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRepertorio(parsed);
          setCancionSeleccionada(parsed[0]);
          return;
        }
      } catch (e) {}
    }

    try {
      let todas: Song[] = [];
      const resp1 = await fetch('/data/cancioneros/Corario.json');
      if (resp1.ok) {
        const d1 = await resp1.json();
        todas = todas.concat(parsearCancionesDesdeJSON(d1, 'Corario'));
      }
      const resp2 = await fetch('/data/cancioneros/Mi%20Cancionero.json');
      if (resp2.ok) {
        const d2 = await resp2.json();
        todas = todas.concat(parsearCancionesDesdeJSON(d2, 'Mi Cancionero'));
      }
      if (todas.length > 0) {
        const map = new Map<string, Song>();
        todas.forEach(c => map.set(c.title.toLowerCase(), c));
        const finalSongs = Array.from(map.values());
        setRepertorio(finalSongs);
        setCancionSeleccionada(finalSongs[0]);
        localStorage.setItem('proyector_lbc_canciones', JSON.stringify(finalSongs));
      }
    } catch (e) {}
  };

  const handleArchivosCanciones = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let cargados = 0;
    const nuevasCanciones: Song[] = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const contenido = event.target?.result as string;
          const parsed = parsearCancionesDesdeArchivo(contenido, file.name);
          if (parsed && parsed.length > 0) {
            nuevasCanciones.push(...parsed);
          }
          cargados++;

          if (cargados === files.length) {
            if (nuevasCanciones.length === 0) {
              mostrarToast(`No se encontraron canciones reconocibles en los archivos`, 'error');
              return;
            }
            const map = new Map<string, Song>();
            repertorio.forEach(c => map.set(c.title.toLowerCase(), c));
            nuevasCanciones.forEach(c => map.set(c.title.toLowerCase(), c));
            const finalLista = Array.from(map.values());
            setRepertorio(finalLista);
            setCancionSeleccionada(finalLista[0]);
            localStorage.setItem('proyector_lbc_canciones', JSON.stringify(finalLista));
            mostrarToast(`¡Se importaron ${nuevasCanciones.length} canciones con éxito desde tus archivos! Total en repertorio: ${finalLista.length}`);
          }
        } catch (err) {
          mostrarToast(`Error al procesar archivo ${file.name}`, 'error');
        }
      };
      reader.readAsText(file);
    });
  };

  const cancionesFiltradas = useMemo(() => {
    return buscarCanciones(repertorio, busquedaCanciones, buscarEnLetra);
  }, [repertorio, busquedaCanciones, buscarEnLetra]);

  const eliminarCancionDelRepertorio = (idCancion: string) => {
    setRepertorio(prev => {
      const nuevaLista = prev.filter(c => c.id !== idCancion);
      try {
        localStorage.setItem('proyector_lbc_canciones', JSON.stringify(nuevaLista));
      } catch (e) {}
      return nuevaLista;
    });
    if (cancionSeleccionada?.id === idCancion) {
      setCancionSeleccionada(null);
      setSeccionActivaIdx(-1);
    }
    mostrarToast('Canción eliminada del repertorio');
  };

  const proyectarEstrofa = (seccion: SongSection, cancion: Song, indice: number) => {
    setSeccionActivaIdx(indice);
    setIsBlackout(false);

    const textoEstrofa = seccion.lines.join('\n');

    setProyeccionActual({
      id: `${cancion.id}-sec-${indice}`,
      tipo: 'cancion',
      texto: textoEstrofa,
      pie: `🎵 ${cancion.title} (${seccion.label})`,
      titulo: cancion.title
    });

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: textoEstrofa,
        tipo: 'cancion',
        pie: ''
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrar',
      texto: textoEstrofa,
      tipo: 'cancion',
      pie: ''
    });
  };

  const avanzarEstrofa = () => {
    if (!cancionSeleccionada || !cancionSeleccionada.sections) return;
    if (seccionActivaIdx < cancionSeleccionada.sections.length - 1) {
      const siguiente = seccionActivaIdx + 1;
      proyectarEstrofa(cancionSeleccionada.sections[siguiente], cancionSeleccionada, siguiente);
    }
  };

  const retrocederEstrofa = () => {
    if (!cancionSeleccionada || !cancionSeleccionada.sections) return;
    if (seccionActivaIdx > 0) {
      const previo = seccionActivaIdx - 1;
      proyectarEstrofa(cancionSeleccionada.sections[previo], cancionSeleccionada, previo);
    }
  };

  const abrirModalEditarCancion = (cancion: Song | null) => {
    if (!cancion) return;
    setCancionEditando(cancion);
    setEditTitulo(cancion.title);
    setEditAutor(cancion.author || '');

// Formatear estrofas en texto limpio y legible
const texto = (cancion.sections || []).map(sec => {
  let encabezado = '';

  if (sec.type === 'chorus') {
    encabezado = '[CORO]\n';
  } else if (sec.type === 'bridge') {
    encabezado = '[PUENTE]\n';
  } else if (sec.type === 'pre-chorus') {
    encabezado = '[PRE-CORO]\n';
  } else if (sec.type === 'verse') {
    encabezado = '[ESTROFA]\n';
  } else if (sec.label) {
    encabezado = `[${sec.label.toUpperCase()}]\n`;
  }

  return `${encabezado}${sec.lines.join('\n')}`;
}).join('\n\n');

    setEditLetra(texto);
    setMostrarModalEditarCancion(true);
  };

  const guardarEdicionCancion = () => {
    if (!cancionEditando) return;
    if (!editTitulo.trim()) {
      mostrarToast('Ingresa un título para la alabanza', 'error');
      return;
    }
    if (!editLetra.trim()) {
      mostrarToast('Ingresa la letra de la alabanza', 'error');
      return;
    }

    // Parsear bloques separados por renglón vacío (doble enter)
    const bloques = editLetra.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    let contadorEstrofa = 1;

    const nuevasSecciones: SongSection[] = bloques.map(bloque => {
      const rawLines = bloque.split('\n').map(l => l.trim()).filter(Boolean);
      let label = '';
      let type: SongSection['type'] = 'verse';
      let lines = rawLines;

      if (rawLines.length > 0) {
        const firstLine = rawLines[0];
        const matchTag = firstLine.match(/^\[?(coro|chorus|puente|bridge|pre-coro|estrofa\s*\d*|verso\s*\d*)\]?:?$/i);

        if (matchTag) {
          const tag = matchTag[1].toLowerCase();
          if (tag.includes('coro')) {
            type = 'chorus';
            label = 'Coro';
          } else if (tag.includes('puente') || tag.includes('bridge')) {
            type = 'bridge';
            label = 'Puente';
          } else if (tag.includes('pre-coro')) {
            type = 'pre-chorus';
            label = 'Pre-Coro';
          } else {
            type = 'verse';
            label = firstLine.replace(/[\[\]:]/g, '').trim();
          }
          lines = rawLines.slice(1);
        } else if (firstLine.toLowerCase().startsWith('coro:')) {
          type = 'chorus';
          label = 'Coro';
          lines = [firstLine.replace(/^coro:\s*/i, ''), ...rawLines.slice(1)].filter(Boolean);
        } else if (firstLine.toLowerCase().includes('coro')) {
          type = 'chorus';
          label = 'Coro';
        }
      }

      if (!label) {
        if (type === 'chorus') {
          label = 'Coro';
        } else if (type === 'bridge') {
          label = 'Puente';
        } else {
          label = `Estrofa ${contadorEstrofa++}`;
        }
      }

      if (lines.length === 0) {
        lines = rawLines;
      }

      return {
        label,
        type,
        lines
      };
    });

    const cancionActualizada: Song = {
      ...cancionEditando,
      title: editTitulo.trim(),
      author: editAutor.trim() || 'Desconocido',
      sections: nuevasSecciones.length > 0 ? nuevasSecciones : [{ label: 'Estrofa 1', type: 'verse', lines: [editLetra] }]
    };

    // 1. Actualizar en repertorio general
    const nuevoRepertorio = repertorio.map(s => s.id === cancionEditando.id ? cancionActualizada : s);
    setRepertorio(nuevoRepertorio);
    try {
      localStorage.setItem('proyector_lbc_canciones', JSON.stringify(nuevoRepertorio));
    } catch (e) {}

    // 2. Si está seleccionada en Canciones
    if (cancionSeleccionada && cancionSeleccionada.id === cancionEditando.id) {
      setCancionSeleccionada(cancionActualizada);
    }

    // 3. Si está seleccionada en Karaoke
    if (karaokeCancion && karaokeCancion.id === cancionEditando.id) {
      setKaraokeCancion(cancionActualizada);
    }

    // 4. Actualizar en setlists de días
    setSetlists(prev => {
      const updated: SetlistsState = { ...prev };
      (Object.keys(updated) as (keyof SetlistsState)[]).forEach(dia => {
        updated[dia] = updated[dia].map(s => s.id === cancionEditando.id ? cancionActualizada : s);
      });
      try {
        localStorage.setItem('proyector_lbc_setlists', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 5. Actualizar en karaokeSetlists
    setKaraokeSetlists(prev => {
      const updated: KaraokeSetlistsState = { ...prev };
      (Object.keys(updated) as (keyof KaraokeSetlistsState)[]).forEach(dia => {
        updated[dia] = updated[dia].map(item => {
          if (item.songId === cancionEditando.id || item.song.id === cancionEditando.id) {
            return {
              ...item,
              songTitle: cancionActualizada.title,
              song: cancionActualizada
            };
          }
          return item;
        });
      });
      try {
        localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 6. Si se está proyectando esta alabanza, actualizar el pie en vivo
    if (proyeccionActual && proyeccionActual.tipo === 'cancion' && (proyeccionActual.pie?.includes(cancionEditando.title) || proyeccionActual.pie?.includes(cancionActualizada.title))) {
      setProyeccionActual(prev => prev ? ({
        ...prev,
        pie: `${cancionActualizada.title} • ${cancionActualizada.author}`
      }) : null);
    }

    setMostrarModalEditarCancion(false);
    setCancionEditando(null);
    mostrarToast(`¡Alabanza "${cancionActualizada.title}" actualizada y guardada!`);
  };

  const eliminarCancionActual = () => {
    if (!cancionEditando) return;

    setMostrarConfirmarEliminarCancion(true);
    return;
  };

  const confirmarEliminarCancion = () => {
    if (!cancionEditando) return;

    const nuevoRepertorio = repertorio.filter(s => s.id !== cancionEditando.id);
    setRepertorio(nuevoRepertorio);
    try {
      localStorage.setItem('proyector_lbc_canciones', JSON.stringify(nuevoRepertorio));
    } catch (e) {}

    if (cancionSeleccionada && cancionSeleccionada.id === cancionEditando.id) {
      setCancionSeleccionada(nuevoRepertorio[0] || null);
    }
    if (karaokeCancion && karaokeCancion.id === cancionEditando.id) {
      setKaraokeCancion(nuevoRepertorio[0] || INITIAL_FEATURED_SONGS[0]);
    }

    setMostrarModalEditarCancion(false);
    setCancionEditando(null);
    setMostrarConfirmarEliminarCancion(false);
    mostrarToast(`Alabanza eliminada del cancionero`);
  };

  const toggleBlackout = () => {
    const nuevo = !isBlackout;
    setIsBlackout(nuevo);
    enviarAlProyector({ accion: 'blackout', activo: nuevo });
  };

  const limpiarPantalla = () => {
    setProyeccionActual(null);
    setSeccionActivaIdx(-1);
    setImagenActivaIdx(-1);
    try {
      localStorage.removeItem('proyector_lbc_actual');
    } catch (e) {}
    enviarAlProyector({ accion: 'limpiar' });
  };

  // Diapositivas & Galería de Imágenes (Canva, Avisos, Banners, 14 Imágenes Litúrgicas)
  const [imagenesGuardadas, setImagenesGuardadas] = useState<SlideItem[]>(() => {
    // Mapa rápido de las imágenes predeterminadas oficiales con su dataUrl real embebida (Base64)
    const mapaPredeterminados = new Map(DIAPOSITIVAS_INICIALES.map(d => [d.id, d.dataUrl]));

    const guardado = localStorage.getItem('lbc_imagenes_guardadas');
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 1. Actualizar items predeterminados para asegurar que usen la fotografía real en Base64
          // (reemplazando cualquier ruta '/fondos/fondo_*.jpg' que falle en discos locales sin esa carpeta)
          const actualizados = parsed.map((item: SlideItem) => {
            if (mapaPredeterminados.has(item.id)) {
              return { ...item, dataUrl: mapaPredeterminados.get(item.id)! };
            }
            return item;
          });

          // 2. Asegurar que las 14 imágenes litúrgicas y momentos predeterminados siempre estén presentes
          const idsExistentes = new Set(actualizados.map((item: SlideItem) => item.id));
          const faltantes = DIAPOSITIVAS_INICIALES.filter(init => !idsExistentes.has(init.id));
          const listaFinal = [...actualizados, ...faltantes];

          // Persistir la lista actualizada
          try {
            localStorage.setItem('lbc_imagenes_guardadas', JSON.stringify(listaFinal));
          } catch (e) {}

          return listaFinal;
        }
      } catch (e) {}
    }
    return DIAPOSITIVAS_INICIALES;
  });
  const [cancionAEliminar, setCancionAEliminar] = useState<Song | null>(null);
  const [imagenAEliminar, setImagenAEliminar] = useState<SlideItem | null>(null);
  const [imagenActivaIdx, setImagenActivaIdx] = useState<number>(-1);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const galeriaFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sub-pestaña activa dentro de Diapositivas & Canva:
  // 'iglesia' -> 10 momentos predeterminados de la iglesia + flyers subidos
  // 'galeria' -> 13 paisajes y biblias litúrgicas + fotos de paisajes subidas
  const [subPestanaDiapositivas, setSubPestanaDiapositivas] = useState<'iglesia' | 'galeria'>('iglesia');

  const diapositivasIglesia = useMemo(() => {
    return imagenesGuardadas.filter(img =>
      img.id.startsWith('momento-') ||
      (img.categoria !== 'predeterminado' && !img.id.startsWith('img-pred-'))
    );
  }, [imagenesGuardadas]);

  const galeriaPaisajes = useMemo(() => {
    return imagenesGuardadas.filter(img =>
      img.id.startsWith('img-pred-') ||
      img.categoria === 'predeterminado'
    );
  }, [imagenesGuardadas]);

  const proyectarImagen = (slide: SlideItem, idx: number) => {
    setImagenActivaIdx(idx);
    setIsBlackout(false);
    setProyeccionActual({
      id: slide.id,
      tipo: 'imagen',
      texto: slide.titulo,
      titulo: slide.titulo,
      url: slide.dataUrl
    });

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: slide.titulo,
        tipo: 'imagen',
        url: slide.dataUrl
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrarMedia',
      tipo: 'imagen',
      url: slide.dataUrl,
      titulo: slide.titulo,
      modoAjuste: modoAjusteDiapositiva,
      opacidadScrim: oscurecedorDiapositiva
    });
    mostrarToast(`Proyectando: "${slide.titulo}"`);
  };

  const cambiarModoAjusteDiapositiva = (modo: 'contain' | 'cover' | 'fill') => {
    setModoAjusteDiapositiva(modo);
    try {
      localStorage.setItem('lbc_modo_ajuste_diapositiva', modo);
    } catch (e) {}
    enviarAlProyector({ accion: 'ajusteMedia', modoAjuste: modo, opacidadScrim: oscurecedorDiapositiva });
    enviarAlProyector({ accion: 'ajusteDiapositiva', modoAjuste: modo, opacidadScrim: oscurecedorDiapositiva });
    mostrarToast(`Ajuste de diapositiva: ${modo === 'contain' ? 'Completa (No cortar)' : modo === 'cover' ? 'Rellenar Pantalla' : 'Pantalla Completa'}`, 'info');
  };

  const cambiarOscurecedorDiapositiva = (val: number) => {
    setOscurecedorDiapositiva(val);
    try {
      localStorage.setItem('lbc_scrim_diapositiva', String(val));
    } catch (e) {}
    enviarAlProyector({ accion: 'ajusteMedia', modoAjuste: modoAjusteDiapositiva, opacidadScrim: val });
    enviarAlProyector({ accion: 'ajusteDiapositiva', modoAjuste: modoAjusteDiapositiva, opacidadScrim: val });
    mostrarToast(`Filtro oscuro para letras: ${Math.round(val * 100)}%`, 'info');
  };

  const eliminarImagen = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const slide = imagenesGuardadas.find(img => img.id === id);
    if (!slide) return;
    const nuevas = imagenesGuardadas.filter(img => img.id !== id);
    setImagenesGuardadas(nuevas);
    try {
      localStorage.setItem('lbc_imagenes_guardadas', JSON.stringify(nuevas));
    } catch (err) {}

    if (proyeccionActual?.id === id) {
      limpiarPantalla();
    }
    mostrarToast(`Imagen "${slide.titulo}" eliminada`, 'info');
  };

  const procesarSubidaArchivosImagen = (files: FileList | null, categoriaPorDefecto: 'evento' | 'predeterminado') => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files).filter(file => {
      const isImg = (file.type && file.type.startsWith('image/')) ||
                    /\.(png|jpe?g|webp|gif|bmp|svg|jfif|tif|tiff)$/i.test(file.name);
      return isImg;
    });

    if (filesArray.length === 0) {
      mostrarToast('Por favor selecciona archivos de imagen válidos (PNG, JPG, WebP)', 'error');
      return;
    }

    let procesados = 0;
    const nuevosItems: SlideItem[] = [];

    const finalizarCarga = () => {
      if (nuevosItems.length === 0) return;
      setImagenesGuardadas(prev => {
        const combinadas = [...nuevosItems, ...prev];
        try {
          // Guardar con límite de 45 para máxima fluidez
          localStorage.setItem('lbc_imagenes_guardadas', JSON.stringify(combinadas.slice(0, 45)));
        } catch (err) {
          console.warn('Storage limit warning, kept in memory:', err);
        }
        return combinadas;
      });
      const dest = categoriaPorDefecto === 'predeterminado' ? 'Galería de Paisajes' : 'Diapositivas de la Iglesia';
      mostrarToast(`¡Se agregaron ${nuevosItems.length} imágenes a ${dest}!`);
    };

    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          procesados++;
          if (procesados === filesArray.length) finalizarCarga();
          return;
        }

        const img = new window.Image();
        img.onload = () => {
          let targetW = img.naturalWidth || img.width;
          let targetH = img.naturalHeight || img.height;
          const maxDim = 1920;

          if (targetW > maxDim || targetH > maxDim) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          let finalDataUrl = rawDataUrl;

          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          const nombreLimpio = file.name.replace(/\.[^/.]+$/, '');
          nuevosItems.push({
            id: `slide-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            titulo: nombreLimpio,
            categoria: categoriaPorDefecto,
            fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
            dataUrl: finalDataUrl,
            esPredeterminado: false
          });

          procesados++;
          if (procesados === filesArray.length) finalizarCarga();
        };

        img.onerror = () => {
          const nombreLimpio = file.name.replace(/\.[^/.]+$/, '');
          nuevosItems.push({
            id: `slide-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            titulo: nombreLimpio,
            categoria: categoriaPorDefecto,
            fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
            dataUrl: rawDataUrl,
            esPredeterminado: false
          });
          procesados++;
          if (procesados === filesArray.length) finalizarCarga();
        };

        img.src = rawDataUrl;
      };

      reader.readAsDataURL(file);
    });

    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    if (galeriaFileInputRef.current) galeriaFileInputRef.current.value = '';
  };

  const handleSubirImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    procesarSubidaArchivosImagen(e.target.files, 'evento');
  };

  const handleSubirImagenGaleria = (e: React.ChangeEvent<HTMLInputElement>) => {
    procesarSubidaArchivosImagen(e.target.files, 'predeterminado');
  };

  const avanzarImagen = () => {
    const listaActual = subPestanaDiapositivas === 'iglesia' ? diapositivasIglesia : galeriaPaisajes;
    if (!listaActual || listaActual.length === 0) return;
    const curIdx = listaActual.findIndex(s => s.id === proyeccionActual?.id);
    const sig = (curIdx + 1) % listaActual.length;
    proyectarImagen(listaActual[sig], sig);
  };

  const retrocederImagen = () => {
    const listaActual = subPestanaDiapositivas === 'iglesia' ? diapositivasIglesia : galeriaPaisajes;
    if (!listaActual || listaActual.length === 0) return;
    const curIdx = listaActual.findIndex(s => s.id === proyeccionActual?.id);
    const ant = curIdx <= 0 ? listaActual.length - 1 : curIdx - 1;
    proyectarImagen(listaActual[ant], ant);
  };

  // Navegación secuencial por versículos de la Biblia
  const avanzarVersiculo = () => {
    if (!versiculosCapitulo || versiculosCapitulo.length === 0) return;
    const idx = versiculosCapitulo.findIndex(v => v.numero === versiculoActivoNum);
    if (idx !== -1 && idx < versiculosCapitulo.length - 1) {
      proyectarVersiculo(versiculosCapitulo[idx + 1]);
    }
  };

  const retrocederVersiculo = () => {
    if (!versiculosCapitulo || versiculosCapitulo.length === 0) return;
    const idx = versiculosCapitulo.findIndex(v => v.numero === versiculoActivoNum);
    if (idx > 0) {
      proyectarVersiculo(versiculosCapitulo[idx - 1]);
    }
  };

  const ventanaProyectorRef = useRef<Window | null>(null);

  // Escuchar estado del proyector desde Electron (TV HDMI)
  useEffect(() => {
    if ((window as any).electronAPI?.onEstadoProyector) {
      (window as any).electronAPI.onEstadoProyector((data: any) => {
        setProyectorConectado(!!data.abierto);
        if (data.abierto) {
          mostrarToast(data.esSecundaria ? '📺 ¡Transmitiendo en Pantalla 2 (TV de la congregación)!' : '🖥️ Proyector activado', 'success');
          setTimeout(() => {
            enviarAlProyector({
              accion: 'fondo',
              fondo: fondoActivo,
              tipoFondo: tipoFondoActivo,
              modoAjuste: modoAjusteFondo,
              opacidadScrim: oscurecedorFondo
            });
            emitirAjustesProyector({
              fuente: fuenteProyector,
              colorTexto: colorTextoProyector,
              sombraTexto,
              alineacion: alineacionProyector,
              tamano: tamanoFuente
            });
            if (proyeccionActual) {
              enviarAlProyector({
                accion: proyeccionActual.tipo === 'imagen' ? 'mostrarMedia' : 'mostrar',
                texto: proyeccionActual.texto,
                pie: proyeccionActual.pie || '',
                tipo: proyeccionActual.tipo,
                url: proyeccionActual.url
              });
            }
          }, 400);
        } else {
          mostrarToast('⏹️ Proyección en TV desactivada', 'info');
        }
      });
    }
  }, [fondoActivo, tipoFondoActivo, modoAjusteFondo, oscurecedorFondo, proyeccionActual, fuenteProyector, colorTextoProyector, sombraTexto, alineacionProyector, tamanoFuente]);

  // TOGGLE AUTOMÁTICO: Con 1 clic abre DIRECTAMENTE en la Pantalla 2 (TV por HDMI) sin tener que arrastrar la ventana con el mouse; con otro clic se apaga.
  const toggleVentanaProyector = () => {
    if ((window as any).electronAPI?.toggleProyector) {
      (window as any).electronAPI.toggleProyector();
      return;
    }

    // Modo navegador web alternativo (Chrome / Edge en Windows)
    if (ventanaProyectorRef.current && !ventanaProyectorRef.current.closed) {
      ventanaProyectorRef.current.close();
      ventanaProyectorRef.current = null;
      setProyectorConectado(false);
      mostrarToast('⏹️ Proyector cerrado', 'info');
    } else {
      let url = 'display.html';
      if (window.location.protocol === 'file:') {
        url = window.location.href.replace(/index\.html.*/i, 'display.html');
      } else if (window.location.href.includes('index.html')) {
        url = window.location.href.replace(/index\.html.*/i, 'display.html');
      } else {
        url = '/display.html';
      }

      // Detectar coordenadas del Televisor / Proyector HDMI (Pantalla 2 extendida)
      // En Windows, la segunda pantalla se encuentra a la derecha de la principal:
      const tvLeft = window.screen.availWidth || window.screen.width || 1920;
      const tvTop = 0;
      const tvWidth = 1920;
      const tvHeight = 1080;

      const winFeatures = `left=${tvLeft},top=${tvTop},width=${tvWidth},height=${tvHeight},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`;
      const ventana = window.open(url, 'ProyectorLBC_Display', winFeatures);

      if (ventana) {
        ventanaProyectorRef.current = ventana;
        try {
          ventana.moveTo(tvLeft, tvTop);
          ventana.resizeTo(tvWidth, tvHeight);
          ventana.focus();
        } catch (e) {}
      }

      setProyectorConectado(true);
      mostrarToast('📺 ¡Proyectando directamente en Pantalla 2 (TV de la congregación)!', 'success');

      setTimeout(() => {
        enviarAlProyector({
          accion: 'fondo',
          fondo: fondoActivo,
          tipoFondo: tipoFondoActivo,
          modoAjuste: modoAjusteFondo,
          opacidadScrim: oscurecedorFondo
        });
        emitirAjustesProyector({
          fuente: fuenteProyector,
          colorTexto: colorTextoProyector,
          sombraTexto,
          alineacion: alineacionProyector,
          tamano: tamanoFuente
        });
        if (proyeccionActual) {
          enviarAlProyector({
            accion: proyeccionActual.tipo === 'imagen' ? 'mostrarMedia' : 'mostrar',
            texto: proyeccionActual.texto,
            pie: proyeccionActual.pie || '',
            tipo: proyeccionActual.tipo,
            url: proyeccionActual.url,
            modoAjuste: modoAjusteDiapositiva,
            opacidadScrim: oscurecedorDiapositiva
          });
        }
      }, 400);
    }
  };

  const abrirVentanaProyector = () => {
    toggleVentanaProyector();
  };

  const cambiarTamanoFuente = (nuevoTamano: number) => {
    setTamanoFuente(nuevoTamano);
    try {
      localStorage.setItem('lbc_tamano_fuente', String(nuevoTamano));
    } catch (e) {}
    enviarAlProyector({ accion: 'tamanoFuente', tamano: nuevoTamano });
  };

  const cambiarModoAjusteFondo = (modo: 'contain' | 'cover' | 'fill') => {
    setModoAjusteFondo(modo);
    try {
      localStorage.setItem('lbc_modo_ajuste_fondo', modo);
    } catch (e) {}
    enviarAlProyector({ accion: 'ajusteFondo', modoAjuste: modo, opacidadScrim: oscurecedorFondo });
    mostrarToast(`Ajuste de imagen: ${modo === 'contain' ? 'Completa (No cortar)' : modo === 'cover' ? 'Rellenar Pantalla' : 'Pantalla Completa'}`, 'info');
  };

  const cambiarOscurecedorFondo = (val: number) => {
    setOscurecedorFondo(val);
    try {
      localStorage.setItem('lbc_scrim_fondo', String(val));
    } catch (e) {}
    enviarAlProyector({ accion: 'ajusteFondo', modoAjuste: modoAjusteFondo, opacidadScrim: val });
  };

  const seleccionarFondo = (fondo: BackgroundPreset) => {
    const bg = fondo.url || fondo.cssBackground || '';
    const tipo = fondo.tipo || (bg.startsWith('anim-') ? 'anim' : bg.startsWith('video:') ? 'video' : 'estatico');
    setFondoActivo(bg);
    setTipoFondoActivo(tipo);
    try {
      localStorage.setItem('lbc_fondo_activo', bg);
      localStorage.setItem('lbc_tipo_fondo', tipo);
    } catch (e) {}
    enviarAlProyector({
      accion: 'fondo',
      fondo: bg,
      tipoFondo: tipo,
      modoAjuste: modoAjusteFondo,
      opacidadScrim: oscurecedorFondo
    });
    mostrarToast(`Fondo "${fondo.nombre}" activado en el proyector`);
  };

  const handleSubirFondo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const esVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
    const esImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|jfif)$/i.test(file.name);

    if (!esVideo && !esImg) {
      mostrarToast('Selecciona una imagen (PNG, JPG) o un video en bucle (MP4, WebM)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const nombreLimpio = file.name.replace(/\.[^/.]+$/, '');
      const nuevoFondo: BackgroundPreset = {
        id: `fondo-custom-${Date.now()}`,
        nombre: nombreLimpio,
        categoria: esVideo ? 'animado' : 'adoracion',
        url: esVideo ? '' : dataUrl,
        cssBackground: esVideo ? `video:${dataUrl}` : dataUrl,
        tipo: esVideo ? 'video' : 'estatico',
        esSubido: true
      };

      setFondosPersonalizados(prev => {
        const actualizados = [nuevoFondo, ...prev];
        try {
          localStorage.setItem('lbc_fondos_subidos', JSON.stringify(actualizados.slice(0, 10)));
        } catch (err) {
          console.warn('LocalStorage limit for backgrounds, keeping in memory', err);
        }
        return actualizados;
      });

      seleccionarFondo(nuevoFondo);
      mostrarToast(`¡Nuevo fondo ${esVideo ? 'animado en video' : 'visual'} agregado y activado!`);
    };

    reader.readAsDataURL(file);
    if (fondoFileInputRef.current) fondoFileInputRef.current.value = '';
  };

  const eliminarFondoPersonalizado = (id: string, e?: React.MouseEvent) => {
  e?.stopPropagation();

  const fondoAEliminar = fondosPersonalizados.find(f => f.id === id);
  if (!fondoAEliminar) return;

  if (!window.confirm(`¿Deseas eliminar el fondo "${fondoAEliminar.nombre}"?`)) {
    return;
  }

  setFondosPersonalizados(prev => {
    const filtrados = prev.filter(f => f.id !== id);
    try {
      localStorage.setItem('lbc_fondos_subidos', JSON.stringify(filtrados));
    } catch (err) {}
    return filtrados;
  });

  mostrarToast('Fondo personalizado eliminado', 'info');
};

  // Manejadores para YouTube
  const extraerYoutubeId = (url: string) => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : '';
  };

  const cargarVideoYoutube = () => {
    const id = extraerYoutubeId(youtubeInputUrl);
    if (!id) {
      mostrarToast('Enlace de YouTube no válido. Pega un enlace completo (ej: https://www.youtube.com/watch?v=...)', 'error');
      return;
    }
    setYoutubeVideoId(id);
    mostrarToast('Video de YouTube listo para proyectar');
  };

  const proyectarYoutubeEnProyector = () => {
    const id = youtubeVideoId || extraerYoutubeId(youtubeInputUrl);
    if (!id) {
      mostrarToast('Por favor pega un enlace de YouTube válido primero', 'error');
      return;
    }
    setYoutubeVideoId(id);
    setYoutubeEnProyector(true);
    setVideoEnProyector(false);
    setIsBlackout(false);

    enviarAlProyector({
      accion: 'mostrarMedia',
      tipo: 'youtube',
      youtubeId: id,
      url: `https://www.youtube.com/watch?v=${id}`
    });
    mostrarToast('Video de YouTube transmitido a la pantalla del proyector');
  };

  const detenerYoutubeEnProyector = () => {
    setYoutubeEnProyector(false);
    enviarAlProyector({ accion: 'detenerMedia' });
    limpiarPantalla();
    mostrarToast('Proyección de YouTube detenida');
  };

  // Keyboard navigation contextualizada al módulo activo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (moduloActivo === 'biblia' || proyeccionActual?.tipo === 'biblia') {
          avanzarVersiculo();
        } else if (moduloActivo === 'anuncios' || proyeccionActual?.tipo === 'imagen') {
          avanzarImagen();
        } else {
          avanzarEstrofa();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (moduloActivo === 'biblia' || proyeccionActual?.tipo === 'biblia') {
          retrocederVersiculo();
        } else if (moduloActivo === 'anuncios' || proyeccionActual?.tipo === 'imagen') {
          retrocederImagen();
        } else {
          retrocederEstrofa();
        }
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'F5') {
        e.preventDefault();
        toggleBlackout();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'F4' || e.key === 'Escape') {
        e.preventDefault();
        limpiarPantalla();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancionSeleccionada, seccionActivaIdx, moduloActivo, proyeccionActual, versiculosCapitulo, versiculoActivoNum, imagenesGuardadas, imagenActivaIdx, isBlackout]);


  // Video player state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [videoVolume, setVideoVolume] = useState<number>(100);
  const [videoLoop, setVideoLoop] = useState<boolean>(true);
  const [videoEnProyector, setVideoEnProyector] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const proyectarVideoEnProyector = () => {
    if (!videoUrl) return;
    setIsBlackout(false);
    setVideoEnProyector(true);
    setProyeccionActual({
      id: `video-${Date.now()}`,
      tipo: 'video',
      texto: 'Reproduciendo Video de Culto',
      titulo: 'Video en Pantalla'
    });
    enviarAlProyector({
      accion: 'mostrarMedia',
      tipo: 'video',
      url: videoUrl,
      loop: videoLoop,
      conAudio: videoVolume > 0,
      volumen: videoVolume / 100
    });
    mostrarToast('Video transmitido a la pantalla del proyector');
  };

  const detenerVideoEnProyector = () => {
    setVideoEnProyector(false);
    enviarAlProyector({ accion: 'detenerMedia' });
    limpiarPantalla();
    mostrarToast('Proyección de video finalizada');
  };

  // ==================== MOTOR DE TONO (SOUNDTOUCH WSOLA PITCH SHIFTER) ====================
  // Modulación real de tono en semitonos (-6 a +6) SIN MODIFICAR EL TIEMPO NI LA VELOCIDAD
  const pitchPlayerRef = useRef<PitchAudioPlayer | null>(null);

  // ==================== KARAOKE & PISTAS AUDIO ====================
  const [karaokeCancion, setKaraokeCancion] = useState<Song>(INITIAL_FEATURED_SONGS[0]);
  const [karaokePistaUrl, setKaraokePistaUrl] = useState<string>('');
  const [karaokePistaNombre, setKaraokePistaNombre] = useState<string>('Pista Instrumental de Alabanza (Audio)');
  const [karaokePlaying, setKaraokePlaying] = useState<boolean>(false);
  const [karaokeCurrentTime, setKaraokeCurrentTime] = useState<number>(0);
  const [karaokeDuration, setKaraokeDuration] = useState<number>(180);
  const [karaokeVolume, setKaraokeVolume] = useState<number>(85);
  const [karaokeMuted, setKaraokeMuted] = useState<boolean>(false);
  const [karaokeSeccionIdx, setKaraokeSeccionIdx] = useState<number>(0);
  const [mostrarModalEliminarPistaActual, setMostrarModalEliminarPistaActual] = useState<boolean>(false);
  const [karaokeItemAEliminar, setKaraokeItemAEliminar] = useState<{ item: KaraokeItem; index: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const karaokeSetlistFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const player = new PitchAudioPlayer();
    pitchPlayerRef.current = player;
    player.setVolume(karaokeVolume, karaokeMuted);
    player.setPitch(pitchSemitonos);

    player.onTimeUpdate((curr, dur) => {
      setKaraokeCurrentTime(curr);
      if (dur > 0) setKaraokeDuration(dur);
    });

    player.onEnd(() => {
      setKaraokePlaying(false);
      setKaraokeCurrentTime(0);
    });

    return () => {
      player.clear();
    };
  }, []);

  // Eliminar la pista de audio cargada actualmente y dejar el reproductor limpio
  const eliminarPistaActual = () => {
    pitchPlayerRef.current?.clear();
    setKaraokePlaying(false);
    setKaraokePistaUrl('');
    setKaraokePistaNombre('Sin pista cargada');
    setAudioFileCargado(null);
    setKaraokeCurrentTime(0);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
    mostrarToast('Pista de audio eliminada del reproductor', 'info');
  };

  const toggleKaraokePlay = () => {
    if (!karaokePistaUrl && !audioFileCargado) {
      mostrarToast('Primero carga una pista MP3 o selecciona una del Setlist', 'info');
      return;
    }

    if (karaokePlaying) {
      pitchPlayerRef.current?.pause();
      setKaraokePlaying(false);
      mostrarToast('Pista en pausa', 'info');
    } else {
      pitchPlayerRef.current?.play();
      setKaraokePlaying(true);
      mostrarToast('Reproduciendo pista de alabanza...', 'info');
    }
  };

  const stopKaraoke = () => {
    pitchPlayerRef.current?.stop();
    setKaraokePlaying(false);
    setKaraokeCurrentTime(0);
  };

  const handleSeekKaraoke = (val: number) => {
    setKaraokeCurrentTime(val);
    pitchPlayerRef.current?.seek(val);
  };

  const cambiarPitchSemitonos = (deltaOVal: number, esAbsoluto = false) => {
    const nuevo = esAbsoluto ? deltaOVal : Math.max(-6, Math.min(6, pitchSemitonos + deltaOVal));
    setPitchSemitonos(nuevo);
    pitchPlayerRef.current?.setPitch(nuevo);

    const desc = nuevo === 0
      ? 'Tono Original (0)'
      : nuevo > 0
      ? `+${nuevo} semitono${nuevo > 1 ? 's' : ''} (más agudo)`
      : `${nuevo} semitono${Math.abs(nuevo) > 1 ? 's' : ''} (más grave)`;
    mostrarToast(`Tono ajustado: ${desc} • Velocidad y tiempo 100% constantes`, 'info');
  };


  // Free text / Announcements
  const [textoLibre, setTextoLibre] = useState<string>('');
  const proyectarTextoManual = () => {
    if (!textoLibre.trim()) return;
    setProyeccionActual({
      id: `texto-${Date.now()}`,
      tipo: 'texto',
      texto: textoLibre,
      titulo: 'Anuncio / Aviso'
    });
    setIsBlackout(false);

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: textoLibre,
        tipo: 'texto'
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrar',
      texto: textoLibre,
      tipo: 'texto'
    });
  };

  // Reordenar Setlist de Canciones con Mouse (Botones y Drag & Drop)
  const [arrastrandoCancionIdx, setArrastrandoCancionIdx] = useState<number | null>(null);
  const setlistItems = setlists[setlistActual] || [];

  const moverCancionEnSetlist = (idx: number, direccion: 'arriba' | 'abajo') => {
    const destino = direccion === 'arriba' ? idx - 1 : idx + 1;
    if (destino < 0 || destino >= setlistItems.length) return;
    const copia = [...setlistItems];
    const temp = copia[idx];
    copia[idx] = copia[destino];
    copia[destino] = temp;
    const nuevoSetlists = { ...setlists, [setlistActual]: copia };
    setSetlists(nuevoSetlists);
    try {
      localStorage.setItem('lbc_setlists', JSON.stringify(nuevoSetlists));
    } catch (e) {}
  };

  const reordenarCancionEnSetlist = (origenIdx: number, destinoIdx: number) => {
    if (origenIdx === destinoIdx || origenIdx < 0 || destinoIdx < 0 || origenIdx >= setlistItems.length || destinoIdx >= setlistItems.length) return;
    const copia = [...setlistItems];
    const [elemento] = copia.splice(origenIdx, 1);
    copia.splice(destinoIdx, 0, elemento);
    const nuevoSetlists = { ...setlists, [setlistActual]: copia };
    setSetlists(nuevoSetlists);
    try {
      localStorage.setItem('lbc_setlists', JSON.stringify(nuevoSetlists));
    } catch (e) {}
    mostrarToast('Orden de canciones en el Setlist actualizado');
  };

  // ==================== SETLISTS DE KARAOKE & PISTAS ====================
  const [karaokeSetlistActual, setKaraokeSetlistActual] = useState<string>('domingo');
  const [karaokeSetlists, setKaraokeSetlists] = useState<KaraokeSetlistsState>(() => {
    const guardado = localStorage.getItem('lbc_karaoke_setlists');
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {
      domingo: [
        { id: 'k-1', songId: INITIAL_FEATURED_SONGS[0].id, songTitle: INITIAL_FEATURED_SONGS[0].title, song: INITIAL_FEATURED_SONGS[0], pistaNombre: 'Pista de Alabanza 1' },
        { id: 'k-2', songId: INITIAL_FEATURED_SONGS[2].id, songTitle: INITIAL_FEATURED_SONGS[2].title, song: INITIAL_FEATURED_SONGS[2], pistaNombre: 'Pista de Alabanza 2' },
        { id: 'k-3', songId: INITIAL_FEATURED_SONGS[4].id, songTitle: INITIAL_FEATURED_SONGS[4].title, song: INITIAL_FEATURED_SONGS[4], pistaNombre: 'Pista de Alabanza 3' }
      ],
      sabado: [
        { id: 'k-4', songId: INITIAL_FEATURED_SONGS[3].id, songTitle: INITIAL_FEATURED_SONGS[3].title, song: INITIAL_FEATURED_SONGS[3], pistaNombre: 'Pista Juvenil' },
        { id: 'k-5', songId: INITIAL_FEATURED_SONGS[7].id, songTitle: INITIAL_FEATURED_SONGS[7].title, song: INITIAL_FEATURED_SONGS[7], pistaNombre: 'Pista de Alabanza' }
      ],
      miercoles: [
        { id: 'k-6', songId: INITIAL_FEATURED_SONGS[1].id, songTitle: INITIAL_FEATURED_SONGS[1].title, song: INITIAL_FEATURED_SONGS[1], pistaNombre: 'Pista Devocional' },
        { id: 'k-7', songId: INITIAL_FEATURED_SONGS[5].id, songTitle: INITIAL_FEATURED_SONGS[5].title, song: INITIAL_FEATURED_SONGS[5], pistaNombre: 'Pista de Oración' }
      ],
      general: []
    };
  });

  const [arrastrandoKaraokeIdx, setArrastrandoKaraokeIdx] = useState<number | null>(null);
  const karaokeSetlistItems = karaokeSetlists[karaokeSetlistActual] || [];

  // Búsqueda rápida en Karaoke para no desplegar lista de 561 canciones
  const [busquedaKaraoke, setBusquedaKaraoke] = useState<string>('');

  const cancionesFiltradasKaraoke = useMemo(() => {
    if (!busquedaKaraoke.trim()) return repertorio;
    const txt = normalizarTexto(busquedaKaraoke);
    return repertorio.filter(s => normalizarTexto(s.title).includes(txt));
  }, [repertorio, busquedaKaraoke]);

  const seleccionarCancionKaraoke = (cancion: Song) => {
    setKaraokeCancion(cancion);
    setKaraokeSeccionIdx(0);
    setKaraokePistaNombre(`Pista de ${cancion.title}`);
  };

  const handleBusquedaKaraokeChange = (texto: string) => {
    setBusquedaKaraoke(texto);
    if (texto.trim()) {
      const txt = normalizarTexto(texto);
      const primeraCoincidencia = repertorio.find(s => normalizarTexto(s.title).includes(txt));
      if (primeraCoincidencia) {
        seleccionarCancionKaraoke(primeraCoincidencia);
      }
    }
  };

  const agregarCancionAKaraokeSetlist = (cancion: Song) => {
    const nuevoItem: KaraokeItem = {
      id: `k-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      songId: cancion.id,
      songTitle: cancion.title,
      song: cancion,
      pistaNombre: `Pista de ${cancion.title}`
    };
    const listaActual = karaokeSetlists[karaokeSetlistActual] || [];
    const nuevaLista = [...listaActual, nuevoItem];
    const nuevoState = { ...karaokeSetlists, [karaokeSetlistActual]: nuevaLista };
    setKaraokeSetlists(nuevoState);
    try {
      localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(nuevoState));
    } catch (e) {}
    mostrarToast(`"${cancion.title}" agregada a la lista de pistas (${karaokeSetlistActual})`);
  };

  const moverKaraokeEnSetlist = (idx: number, direccion: 'arriba' | 'abajo') => {
    const destino = direccion === 'arriba' ? idx - 1 : idx + 1;
    if (destino < 0 || destino >= karaokeSetlistItems.length) return;
    const copia = [...karaokeSetlistItems];
    const temp = copia[idx];
    copia[idx] = copia[destino];
    copia[destino] = temp;
    const nuevoState = { ...karaokeSetlists, [karaokeSetlistActual]: copia };
    setKaraokeSetlists(nuevoState);
    try {
      localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(nuevoState));
    } catch (e) {}
  };

  const reordenarKaraokeEnSetlist = (origenIdx: number, destinoIdx: number) => {
    if (origenIdx === destinoIdx || origenIdx < 0 || destinoIdx < 0 || origenIdx >= karaokeSetlistItems.length || destinoIdx >= karaokeSetlistItems.length) return;
    const copia = [...karaokeSetlistItems];
    const [elemento] = copia.splice(origenIdx, 1);
    copia.splice(destinoIdx, 0, elemento);
    const nuevoState = { ...karaokeSetlists, [karaokeSetlistActual]: copia };
    setKaraokeSetlists(nuevoState);
    try {
      localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(nuevoState));
    } catch (e) {}
    mostrarToast('Orden de pistas actualizado');
  };

  const pedirEliminarKaraokeDeSetlist = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = karaokeSetlistItems[idx];
    if (item) {
      setKaraokeItemAEliminar({ item, index: idx });
    }
  };

  const confirmarEliminarKaraokeDeSetlist = (idx: number) => {
    const nuevaLista = karaokeSetlistItems.filter((_, i) => i !== idx);
    const nuevoState = { ...karaokeSetlists, [karaokeSetlistActual]: nuevaLista };
    setKaraokeSetlists(nuevoState);
    try {
      localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(nuevoState));
    } catch (e) {}
    mostrarToast('Pista retirada del setlist', 'info');
  };

  const seleccionarKaraokeItem = (item: KaraokeItem) => {
    setKaraokeCancion(item.song);
    setKaraokeSeccionIdx(0);
    if (item.pistaUrl) {
      setKaraokePistaUrl(item.pistaUrl);
      setKaraokePistaNombre(item.pistaNombre || item.songTitle);
      pitchPlayerRef.current?.load(item.pistaUrl, pitchSemitonos).then((dur) => {
        if (dur) setKaraokeDuration(dur);
        setKaraokeCurrentTime(0);
        setKaraokePlaying(false);
      }).catch(() => {});
    } else {
      setKaraokePistaNombre(`Pista de ${item.songTitle}`);
    }
    mostrarToast(`Cargada alabanza "${item.songTitle}" para pista`);
  };

  // Reproducir pista DIRECTAMENTE desde la fila del Setlist con un solo clic
  const reproducirItemDirecto = (item: KaraokeItem, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Si ya es la pista actual y está sonando, alternar pausa
    if (karaokePistaUrl === item.pistaUrl && karaokePlaying) {
      pitchPlayerRef.current?.pause();
      setKaraokePlaying(false);
      return;
    }

    // Cargar canción y pista
    setKaraokeCancion(item.song);
    setKaraokeSeccionIdx(0);

    if (item.pistaUrl) {
      setKaraokePistaUrl(item.pistaUrl);
      setKaraokePistaNombre(item.pistaNombre || item.songTitle);
      setKaraokeCurrentTime(0);

      // Iniciar reproducción instantánea con motor SoundTouch (tempo constante, pitch activo)
      pitchPlayerRef.current?.load(item.pistaUrl, pitchSemitonos).then((dur) => {
        if (dur) setKaraokeDuration(dur);
        pitchPlayerRef.current?.play();
        setKaraokePlaying(true);
      }).catch((err) => {
        console.warn('Error reproduciendo pista:', err);
      });

      mostrarToast(`▶ Reproduciendo pista: "${item.pistaNombre || item.songTitle}"`, 'success');
    } else {
      mostrarToast(`"${item.songTitle}" no tiene archivo de audio MP3 adjunto. Súbelo con "+ Pistas MP3".`, 'info');
    }
  };


  // Subir múltiples canciones y pistas de audio a la vez (4, 8, 10, 20 pistas) al Setlist del día seleccionado
  const handleSubirPistasAlSetlist = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const nuevosItems: KaraokeItem[] = [];

    Array.from(files).forEach((file, idx) => {
      const nombreSinExt = file.name.replace(/\.[^/.]+$/, '').trim();
      const nombreLimpio = nombreSinExt.replace(/^[0-9]+[\s.\-_]+/, '').replace(/^pista[\s.\-_]+/i, '').trim();

      // Buscar si coincide con alguna alabanza en el repertorio para vincular sus letras
      const coincidencia = repertorio.find(s => {
        const t1 = normalizarTexto(s.title);
        const t2 = normalizarTexto(nombreLimpio);
        return t1.includes(t2) || t2.includes(t1);
      });

      const audioUrl = URL.createObjectURL(file);

      const songObj: Song = coincidencia || {
        id: `song-pista-${Date.now()}-${idx}`,
        title: nombreLimpio || nombreSinExt,
        author: 'Pista de Alabanza',
        sections: [
          {
            type: 'verse',
            label: 'Pista de Audio',
            lines: [
              nombreLimpio || nombreSinExt,
              `(${file.name})`,
              'Pista instrumental para culto congregacional'
            ]
          }
        ]
      };

      nuevosItems.push({
        id: `k-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        songId: songObj.id,
        songTitle: songObj.title,
        song: songObj,
        pistaUrl: audioUrl,
        pistaNombre: file.name
      });
    });

    const listaActual = karaokeSetlists[karaokeSetlistActual] || [];
    const nuevaLista = [...listaActual, ...nuevosItems];
    const nuevoState = { ...karaokeSetlists, [karaokeSetlistActual]: nuevaLista };
    setKaraokeSetlists(nuevoState);
    try {
      localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(nuevoState));
    } catch (err) {}

    // Cargar de inmediato la primera si no había ninguna cargada
    if (!karaokePistaUrl && nuevosItems.length > 0) {
      seleccionarKaraokeItem(nuevosItems[0]);
    }

    const diaNombre = karaokeSetlistActual === 'general' ? 'Especial' : karaokeSetlistActual.toUpperCase();
    mostrarToast(`🎵 ¡${files.length} pista(s) agregada(s) al Setlist de ${diaNombre}!`, 'success');
    if (karaokeSetlistFileInputRef.current) {
      karaokeSetlistFileInputRef.current.value = '';
    }
  };

  // Vaciar la lista del día actual si el usuario desea rehacerla
  const vaciarKaraokeSetlistActual = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const diaNombre = karaokeSetlistActual === 'general' ? 'Especial' : karaokeSetlistActual;
    const nuevoState = { ...karaokeSetlists, [karaokeSetlistActual]: [] };
    setKaraokeSetlists(nuevoState);
    try {
      localStorage.setItem('lbc_karaoke_setlists', JSON.stringify(nuevoState));
    } catch (err) {}
    mostrarToast(`Lista de pistas de ${diaNombre} vaciada`, 'info');
  };

  // ==================== QUITADO Y LIMPIEZA TOTAL DE VIDEOS ====================
  const quitarVideoYoutube = () => {
    setYoutubeVideoId('');
    setYoutubeInputUrl('');
    if (youtubeEnProyector) {
      detenerYoutubeEnProyector();
    }
    mostrarToast('Video de YouTube quitado y descargado por completo', 'info');
  };

  const quitarVideoCulto = () => {
    setVideoUrl('');
    setVideoPlaying(false);
    if (videoEnProyector) {
      detenerVideoEnProyector();
    }
    mostrarToast('Video de culto quitado de memoria y de la pantalla', 'info');
  };

  // ==================== PROYECCIÓN DE PRÉDICA Y BOSQUEJOS ====================
  const proyectarPredica = (texto: string, pie?: string, titulo?: string) => {
    if (videoEnProyector) detenerVideoEnProyector();
    if (youtubeEnProyector) detenerYoutubeEnProyector();
    setIsBlackout(false);
    setProyeccionActual({
      id: `predica-${Date.now()}`,
      tipo: 'predica',
      texto,
      pie: pie || '',
      titulo: titulo || 'Prédica'
    });
    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto,
        tipo: 'predica',
        pie: pie || ''
      }));
    } catch (e) {}
    enviarAlProyector({
      accion: 'mostrar',
      texto,
      pie: pie || '',
      tipo: 'predica'
    });
  };

  return (
    <div className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
      temaOperador === 'claro' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Toast Notification */}
      {notificacion && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          notificacion.tipo === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            : notificacion.tipo === 'info'
            ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
        }`}>
          {notificacion.tipo === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Hidden inputs */}
      <input type="file" ref={songFileInputRef} onChange={handleArchivosCanciones} multiple accept=".json,.js,.txt" className="hidden" />
      <input type="file" ref={bibleFileInputRef} onChange={handleCargaArchivosBiblia} multiple accept=".json" className="hidden" />
      <input type="file" ref={folderInputRef} onChange={handleCargaArchivosBiblia} multiple {...({ webkitdirectory: '', directory: '' } as any)} className="hidden" />
      <input type="file" ref={imageFileInputRef} onChange={handleSubirImagenes} multiple accept="image/*" className="hidden" />
      <input type="file" ref={galeriaFileInputRef} onChange={handleSubirImagenGaleria} multiple accept="image/*" className="hidden" />
      <input type="file" ref={fondoFileInputRef} onChange={handleSubirFondo} accept="image/*,video/mp4,video/webm" className="hidden" />
      <input
  type="file"
  ref={videoInputRef}
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formulario = new FormData();
    formulario.append('video', file);

    try {
      mostrarToast('Enviando video al servidor...');

      const respuesta = await fetch('http://127.0.0.1:3001/api/upload-video', {
        method: 'POST',
        body: formulario
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.url) {
        throw new Error(resultado.error || 'No se pudo cargar el video');
      }

      setVideoUrl(resultado.url);
      mostrarToast('Video cargado correctamente');
    } catch (error) {
      console.error('Error al cargar video:', error);
      mostrarToast('No se pudo enviar el video al servidor');
    }
  }}
  accept="video/*"
  className="hidden"
/>
      <input type="file" ref={audioInputRef} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          setAudioFileCargado(file);
          setKaraokePistaNombre(file.name);
          const objUrl = URL.createObjectURL(file);
          setKaraokePistaUrl(objUrl);
          setKaraokeCurrentTime(0);
          setKaraokePlaying(false);
          setCargandoAudio(true);
          try {
            const dur = await pitchPlayerRef.current?.load(file, pitchSemitonos);
            if (dur) setKaraokeDuration(dur);
            mostrarToast(`Pista "${file.name}" cargada para Karaoke • Tono ajustable`);
          } catch (err) {
            console.warn('Error cargando audio:', err);
            mostrarToast(`Pista cargada: ${file.name}`);
          } finally {
            setCargandoAudio(false);
          }
        }
      }} accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" className="hidden" />

      {/* Input oculto para subir MÚLTIPLES archivos de audio MP3/WAV a la vez al Setlist de Pistas */}
      <input
        type="file"
        ref={karaokeSetlistFileInputRef}
        multiple
        onChange={handleSubirPistasAlSetlist}
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
        className="hidden"
      />

      {/* Audio element for Karaoke (muted to prevent un-pitch-shifted bleed) */}
      {karaokePistaUrl && (
        <audio
          ref={audioRef}
          src={karaokePistaUrl}
          muted
          crossOrigin="anonymous"
          className="hidden"
          onLoadedMetadata={(e) => setKaraokeDuration((e.target as HTMLAudioElement).duration)}
          onEnded={() => {
            setKaraokePlaying(false);
            // Si hay una siguiente pista en el setlist del día, prepararla
            const currentIdx = karaokeSetlistItems.findIndex(it => it.pistaUrl === karaokePistaUrl);
            if (currentIdx !== -1 && currentIdx < karaokeSetlistItems.length - 1) {
              const siguiente = karaokeSetlistItems[currentIdx + 1];
              if (siguiente && siguiente.pistaUrl) {
                seleccionarKaraokeItem(siguiente);
                mostrarToast(`Pista finalizada. Siguiente lista: "${siguiente.songTitle}"`, 'info');
              }
            }
          }}
        />
      )}

      

{/* ==================== BARRA SUPERIOR (HEADER) ==================== */}
<header className="border-b border-[#303946] flex-shrink-0 z-40 px-3 py-2 flex flex-col gap-2 shadow-lg bg-[#171A20] text-[#F1F3F5]">

  {/* PRIMERA FILA: IDENTIDAD Y CONTROLES */}
  <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-2">

    {/* Identidad de ICC */}
    <div className="flex items-center gap-3 shrink-0">
      <div
        className="flex items-center gap-2.5 cursor-pointer select-none"
        onClick={() => setModuloActivo('portada')}
      >
        <div className="w-10 h-10 rounded-xl bg-[#D6AD62] flex items-center justify-center font-bold text-[#171A20] text-xl shadow-md">
          ✝
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-[#F1F3F5]">
              {nombreCongregacion}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D6AD62]/15 text-[#D6AD62] border border-[#D6AD62]/30">
              ICC
            </span>
          </div>
          <p className="text-[11px] text-[#AAB4C0]">
            Proyector ICC • {horaActual}
          </p>
        </div>
      </div>
    </div>

    {/* Controles de proyección */}
    <div className="flex flex-wrap items-center justify-end gap-2">

      {/* Tamaño de letra */}
      <div className="hidden xl:flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#303946] bg-[#222831] text-[#AAB4C0]">
        <span className="text-xs">A</span>
        <input
          type="range"
          min="32"
          max="76"
          value={tamanoFuente}
          onChange={(e) => cambiarTamanoFuente(Number(e.target.value))}
          className="w-16 h-1 bg-[#46515F] rounded-lg appearance-none cursor-pointer accent-[#D6AD62]"
          title={`Tamaño de letra en proyector: ${tamanoFuente}px`}
        />
        <span className="text-sm font-bold text-[#F1F3F5]">A</span>
      </div>

      {/* Blackout */}
      <button
        onClick={toggleBlackout}
        title="Presiona 'B' o F5 para pantalla negra de inmediato"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
          isBlackout
            ? 'bg-[#D6AD62] text-[#171A20] border-[#D6AD62] shadow-md'
            : 'bg-[#222831] text-[#F1F3F5] border-[#303946] hover:bg-[#303946]'
        }`}
      >
        {isBlackout ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#D6AD62]" />}
        <span>{isBlackout ? 'BLACKOUT' : 'Blackout'}</span>
      </button>

      {/* Limpiar pantalla */}
      <button
        onClick={limpiarPantalla}
        title="Presiona 'C' o F4 para limpiar texto de la pantalla"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#38262B] text-[#F0A5AE] border border-[#70404A] hover:bg-[#4A2D34] transition cursor-pointer"
      >
        <span>Limpiar</span>
      </button>

      {/* Emergencia: quitar video */}
      {(youtubeEnProyector || videoEnProyector) && (
        <button
          onClick={() => {
            if (youtubeEnProyector) detenerYoutubeEnProyector();
            if (videoEnProyector) detenerVideoEnProyector();
            setYoutubeVideoId('');
            setYoutubeInputUrl('');
            setVideoUrl('');
            mostrarToast('⏹️ Video detenido y quitado de la pantalla', 'info');
          }}
          title="Detener y quitar inmediatamente el video que está transmitiendo en el proyector"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>Quitar Video</span>
        </button>
      )}

      {/* Proyector TV */}
      <button
        onClick={toggleVentanaProyector}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer ${
          proyectorConectado
            ? 'bg-rose-600 hover:bg-rose-500 text-white'
            : 'bg-[#D6AD62] hover:bg-[#E3BD7C] text-[#171A20]'
        }`}
        title={proyectorConectado ? 'Clic para desactivar la proyección en la Pantalla 2 (TV)' : 'Clic para proyectar automáticamente en la Pantalla 2 (TV)'}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>{proyectorConectado ? 'Apagar TV' : 'Proyectar'}</span>
      </button>

      {/* Ayuda */}
      <button
        onClick={() => setMostrarAyuda(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#303946] bg-[#222831] text-[#AAB4C0] hover:bg-[#303946] hover:text-[#F1F3F5] transition cursor-pointer"
        title="Abrir Manual de Ayuda y Atajos de Teclado"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Ayuda</span>
      </button>

    </div>
  </div>

  {/* SEGUNDA FILA: NAVEGACIÓN DE MÓDULOS */}
  <nav className="flex flex-nowrap items-center gap-1 p-1 rounded-xl border border-[#303946] bg-[#222831] text-xs shadow-lg">
    {[
      { id: 'portada', label: 'Portada', icon: Home },
      { id: 'biblia', label: 'Biblia', icon: BookOpen },
      { id: 'canciones', label: 'Canciones', icon: Music },
      { id: 'predica', label: 'Prédica & Bosquejo', icon: ScrollText },
      { id: 'fondos', label: 'Fondos', icon: Image },
      { id: 'video', label: 'Video', icon: Video },
      { id: 'karaoke', label: 'Karaoke', icon: Mic },
      { id: 'anuncios', label: 'Diapositivas & Canva', icon: Sparkles },
      { id: 'obs', label: 'OBS Studio', icon: Radio },
      { id: 'config', label: 'Ajustes', icon: Settings }
    ].map((item) => {
      const Icon = item.icon;
      const activo = moduloActivo === item.id;

      return (
        <button
          key={item.id}
          onClick={() => setModuloActivo(item.id as any)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activo
              ? 'bg-[#D6AD62] text-[#171A20] shadow-md'
              : 'text-[#AAB4C0] hover:text-[#F1F3F5] hover:bg-[#303946]'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>

</header>


      {/* ==================== CUERPO PRINCIPAL ==================== */}
      <main className="flex-1 min-h-0 overflow-hidden p-2.5 max-w-[1850px] w-full mx-auto flex flex-col">
        
        
        {/* ==================== MÓDULO 1: PORTADA ICC ==================== */}
        {moduloActivo === 'portada' && (
          <div className="h-full min-h-0 w-full overflow-y-auto px-3 py-3 md:px-6">
            <div className="max-w-5xl mx-auto min-h-full flex flex-col gap-4">

              {/* IDENTIDAD PRINCIPAL */}
              <section className="relative overflow-hidden rounded-2xl border border-[#303946] bg-gradient-to-br from-[#222831] to-[#171A20] p-5 md:p-6 shadow-xl">
                <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-[#D6AD62]/[0.06] blur-3xl pointer-events-none" />

                
<div className="relative flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">

  {/* LOGO */}
  <div className="w-20 h-20 shrink-0 rounded-2xl border border-[#D6AD62]/30 bg-[#171A20] flex items-center justify-center shadow-lg shadow-black/30">
    <img
      src="assets/logo_cuadrangular_icono.png"
      alt="Emblema Iglesia Cuadrangular"
      className="w-16 h-16 object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'assets/logo_cuadrangular_4simbolos.png';
      }}
    />
  </div>

  {/* NOMBRE Y DESCRIPCIÓN */}
  <div className="min-w-0 flex-1 space-y-1.5">
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6AD62]/30 bg-[#D6AD62]/10 text-[#D6AD62] text-[10px] font-bold tracking-[0.2em] uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-[#D6AD62]" />
      Proyector para Iglesias
    </span>

    <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-[#F1F3F5]">
      {nombreCongregacion}
    </h1>

    <p className="text-sm text-[#AAB4C0] font-medium">
      Sistema de presentación congregacional
    </p>

    <p className="text-sm text-[#D5D9DF] italic">
      Todo el servicio, en una sola plataforma.
    </p>
  </div>
</div>
</section>

{/* DISTRIBUCIÓN EN DOS COLUMNAS */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

  {/* COLUMNA DERECHA: LOS CUATRO PILARES */}
<section className="space-y-2.5 lg:col-start-2 lg:row-start-1">
  <div>
  <div className="flex items-center gap-2">
    <h2 className="text-sm font-bold text-[#F1F3F5]">
      Nuestra identidad
    </h2>

    <span className="px-2 py-0.5 rounded-md border border-[#D6AD62]/30 bg-[#D6AD62]/10 text-[9px] font-bold tracking-wider text-[#D6AD62] uppercase">
      Cuadrangular
    </span>
  </div>

  <p className="text-xs text-[#AAB4C0] mt-0.5">
    Los cuatro pilares del Evangelio
  </p>
</div>

  <div className="grid grid-cols-2 gap-2.5">
    {[
      { icono: '✝', titulo: 'La Cruz', descripcion: 'Jesucristo es el Salvador' },
      { icono: '🏆', titulo: 'La Copa', descripcion: 'Jesucristo es el Sanador' },
      { icono: '🕊', titulo: 'La Paloma', descripcion: 'Bautizador con el Espíritu Santo' },
      { icono: '👑', titulo: 'La Corona', descripcion: 'Jesucristo es el Rey que Viene' }
    ].map((pilar) => (
      <div
        key={pilar.titulo}
        className="rounded-xl border border-[#303946] bg-[#222831] px-2.5 py-3 flex flex-col items-center text-center gap-1.5 transition-all duration-200 hover:border-[#D6AD62]/50 hover:bg-[#303946]"
      >
        <span className="text-xl text-[#D6AD62]">
          {pilar.icono}
        </span>
        <h3 className="text-xs font-bold text-[#D6AD62]">
          {pilar.titulo}
        </h3>
        <p className="text-[10px] leading-snug text-[#AAB4C0]">
          {pilar.descripcion}
        </p>
      </div>
    ))}
  </div>
</section>

{/* ACCESOS RÁPIDOS */}
<section className="space-y-2.5 lg:col-start-1 lg:row-start-1">
  <div>
    <h2 className="text-sm font-bold text-[#F1F3F5]">
      Accesos rápidos
    </h2>
    <p className="text-xs text-[#AAB4C0] mt-0.5">
      Herramientas principales para el servicio
    </p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

    {/* 1. CONECTAR PROYECTOR */}
    <button
      onClick={toggleVentanaProyector}
      className={`group flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
        proyectorConectado
          ? 'bg-[#D6AD62]/15 border-[#D6AD62]/50 hover:bg-[#D6AD62]/20'
          : 'bg-[#222831] border-[#D6AD62]/40 hover:bg-[#303946] hover:border-[#D6AD62]'
      }`}
    >
      <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D6AD62]/15 border border-[#D6AD62]/30 flex items-center justify-center">
        <Monitor className="w-5 h-5 text-[#D6AD62]" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[#D6AD62]">
          {proyectorConectado ? 'Apagar proyector' : 'Conectar proyector'}
        </h3>
        <p className="text-xs text-[#AAB4C0] mt-0.5">
          {proyectorConectado
            ? 'La pantalla externa está conectada'
            : 'Enviar contenido a la pantalla externa'}
        </p>
      </div>

      <span className="text-[#D6AD62] text-lg group-hover:translate-x-1 transition-transform">
        ›
      </span>
    </button>

    {/* 2. BIBLIA */}
    <button
      onClick={() => setModuloActivo('biblia')}
      className="group flex items-center gap-3 p-3 rounded-xl border border-[#303946] bg-[#222831] hover:bg-[#303946] hover:border-[#D6AD62]/50 text-left transition-all duration-200 cursor-pointer"
    >
      <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D6AD62]/10 border border-[#D6AD62]/20 flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-[#D6AD62]" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[#F1F3F5]">
          Sagradas Escrituras
        </h3>
        <p className="text-xs text-[#AAB4C0] mt-0.5">
          Buscar y proyectar versículos bíblicos
        </p>
      </div>

      <span className="text-[#D6AD62] text-lg group-hover:translate-x-1 transition-transform">
        ›
      </span>
    </button>

    {/* 3. PRÉDICA Y BOSQUEJO */}
    <button
      onClick={() => setModuloActivo('predica')}
      className="group flex items-center gap-3 p-3 rounded-xl border border-[#303946] bg-[#222831] hover:bg-[#303946] hover:border-[#D6AD62]/50 text-left transition-all duration-200 cursor-pointer"
    >
      <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D6AD62]/10 border border-[#D6AD62]/20 flex items-center justify-center">
        <span className="text-xl">📝</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[#F1F3F5]">
          Prédica y Bosquejo
        </h3>
        <p className="text-xs text-[#AAB4C0] mt-0.5">
          Preparar y proyectar mensajes
        </p>
      </div>

      <span className="text-[#D6AD62] text-lg group-hover:translate-x-1 transition-transform">
        ›
      </span>
    </button>

    {/* 4. DIAPOSITIVAS Y CANVA */}
    <button
      onClick={() => setModuloActivo('anuncios')}
      className="group flex items-center gap-3 p-3 rounded-xl border border-[#303946] bg-[#222831] hover:bg-[#303946] hover:border-[#D6AD62]/50 text-left transition-all duration-200 cursor-pointer"
    >
      <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D6AD62]/10 border border-[#D6AD62]/20 flex items-center justify-center">
        <span className="text-xl">🖼️</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[#F1F3F5]">
          Diapositivas y Canva
        </h3>
        <p className="text-xs text-[#AAB4C0] mt-0.5">
          Anuncios, imágenes y diapositivas
        </p>
      </div>

      <span className="text-[#D6AD62] text-lg group-hover:translate-x-1 transition-transform">
        ›
      </span>
    
    </button>

    </div>
</section>

</div>


{/* CRÉDITO DE DESARROLLO */}
<div className="mt-auto pt-4 pb-2 text-center relative top-2">
  <div className="border-t border-[#303946] mb-3" />
  <p className="text-xs font-medium tracking-wide text-[#AAB4C0]">
    Desarrollado por{' '}
    <strong className="text-[#D6AD62] font-bold">
      LuftmandMauricio
    </strong>
  </p>
</div>


 </div>
</div>
)}


        {/* ==================== MÓDULO 2: SAGRADAS ESCRITURAS ==================== */}
        {moduloActivo === 'biblia' && (
          <div className="h-full min-h-0 flex-1 flex flex-col gap-2 overflow-hidden">
            
            {/* BARRA DE HERRAMIENTAS BÍBLICA */}
<div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-[#303946] bg-[#222831] shadow-md flex-shrink-0">

  <div className="flex items-center gap-2 text-[#F1F3F5]">
    <BookOpen className="w-4 h-4 text-[#D6AD62]" />
    <span className="text-sm font-bold">Biblia</span>
    <span className="text-xs text-[#AAB4C0]">
      {libroSeleccionado.nombre} {capituloActual}
    </span>
  </div>

  <div className="flex items-center gap-2">

    <button
      onClick={() => folderInputRef.current?.click()}
      title="Cargar una carpeta completa de la Biblia"
      className="px-3 py-1.5 rounded-lg bg-[#D6AD62] hover:bg-[#E3BD7C] text-[#171A20] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
    >
      <FolderOpen className="w-3.5 h-3.5" />
      <span>Cargar carpeta</span>
    </button>

    <button
      onClick={() => bibleFileInputRef.current?.click()}
      title="Importar archivos JSON individuales"
      className="px-3 py-1.5 rounded-lg bg-[#303946] hover:bg-[#46515F] text-[#F1F3F5] border border-[#46515F] font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
    >
      <Upload className="w-3.5 h-3.5" />
      <span>Cargar libro</span>
    </button>

  </div>
</div>

            {/* 4 Columns Area */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
              
              
{/* Columna 1: Libros (3 cols) */}
<div className="xl:col-span-3 border border-[#303946] rounded-2xl p-3 flex flex-col gap-2 overflow-hidden shadow-xl bg-[#222831]">

  {/* Buscador de libros */}
  <div className="relative">
    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#AAB4C0]" />
    <input
      type="text"
      value={busquedaLibro}
      onChange={(e) => setBusquedaLibro(e.target.value)}
      placeholder="Buscar libro bíblico..."
      className="w-full pl-8 pr-7 py-1.5 border border-[#303946] rounded-xl text-xs focus:outline-none focus:border-[#D6AD62] bg-[#171A20] text-[#F1F3F5] placeholder:text-[#AAB4C0]"
    />
    {busquedaLibro && (
      <button
        onClick={() => setBusquedaLibro('')}
        className="absolute right-2.5 top-2 text-[#AAB4C0] hover:text-white text-xs"
      >
        ✕
      </button>
    )}
  </div>

  {/* Filtros de testamento */}
  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-[#303946] bg-[#171A20] text-[11px] font-bold text-center">
    <button
      onClick={() => setFiltroTestamento(filtroTestamento === 'antiguo' ? 'todos' : 'antiguo')}
      className={`py-1 rounded-lg transition ${
        filtroTestamento === 'antiguo'
          ? 'bg-[#D6AD62] text-[#171A20] font-black shadow'
          : 'text-[#AAB4C0] hover:bg-[#303946] hover:text-[#F1F3F5]'
      }`}
    >
      ANTIGUO (39)
    </button>

    <button
      onClick={() => setFiltroTestamento(filtroTestamento === 'nuevo' ? 'todos' : 'nuevo')}
      className={`py-1 rounded-lg transition ${
        filtroTestamento === 'nuevo'
          ? 'bg-[#D6AD62] text-[#171A20] font-black shadow'
          : 'text-[#AAB4C0] hover:bg-[#303946] hover:text-[#F1F3F5]'
      }`}
    >
      NUEVO (27)
    </button>
  </div>

  {/* Lista de libros */}
  <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-10">
    {librosFiltrados.map((libro) => {
      const isSelected = libroSeleccionado.id === libro.id;

      return (
        <button
          key={libro.id}
          onClick={() => {
            setLibroSeleccionado(libro);
            setCapituloActual('1');
          }}
          className={`w-full px-3 py-2 rounded-xl text-xs text-left transition flex items-center justify-between border ${
            isSelected
              ? 'bg-[#D6AD62] text-[#171A20] border-[#D6AD62] font-black shadow-md'
              : 'bg-[#171A20] text-[#F1F3F5] hover:bg-[#303946] border-[#303946] font-semibold'
          }`}
        >
          <span>{libro.nombre}</span>
          <span className="text-[10px] opacity-70 font-mono">{libro.capitulos} cap</span>
        </button>
      );
    })}
  </div>
</div>

              
{/* Columna 2: Versiones y Capítulos (2 cols) */}
<div className="xl:col-span-2 border border-[#303946] rounded-2xl p-3 flex flex-col gap-3 shadow-xl overflow-hidden bg-[#222831]">

  {/* Versiones bíblicas */}
  <div>
    <label className="text-[10px] font-black text-[#AAB4C0] uppercase tracking-wider block mb-1.5">
      VERSIONES BÍBLICAS
    </label>

    <div className="grid grid-cols-2 gap-1.5">
      {VERSIONES_BIBLIA.map((v) => (
        <button
          key={v.codigo}
          onClick={() => setVersionBiblia(v.codigo)}
          className={`py-1.5 rounded-lg text-xs font-black uppercase transition border ${
            versionBiblia === v.codigo
              ? 'bg-[#D6AD62] text-[#171A20] border-[#D6AD62] shadow'
              : 'bg-[#171A20] border-[#303946] text-[#AAB4C0] hover:bg-[#303946] hover:text-[#F1F3F5]'
          }`}
        >
          {v.codigo}
        </button>
      ))}
    </div>
  </div>

  {/* Capítulos */}
  <div className="flex-1 flex flex-col overflow-hidden">
    <div className="flex items-center justify-between mb-1.5 gap-2">
      <label className="text-[10px] font-black text-[#AAB4C0] uppercase tracking-wider">
        CAPÍTULOS ({libroSeleccionado.capitulos})
      </label>

      <span className="text-xs font-bold text-[#D6AD62] truncate">
        {libroSeleccionado.nombre}
      </span>
    </div>

    <div className="grid grid-cols-4 gap-1.5 flex-1 overflow-y-auto pr-1 pb-24">
      {Array.from({ length: libroSeleccionado.capitulos }, (_, i) => String(i + 1)).map((cap) => {
        const isSelected = capituloActual === cap;

        return (
          <button
            key={cap}
            onClick={() => setCapituloActual(cap)}
            className={`h-9 rounded-lg text-xs font-black transition border flex items-center justify-center ${
              isSelected
                ? 'bg-[#D6AD62] text-[#171A20] border-[#D6AD62] shadow-md'
                : 'bg-[#171A20] border-[#303946] text-[#F1F3F5] hover:bg-[#303946]'
            }`}
          >
            {cap}
          </button>
        );
      })}
    </div>
  </div>
</div>

              
{/* Columna 3: Versículos con texto completo (4 cols) */}
<div className="xl:col-span-4 border border-[#303946] rounded-2xl p-3 flex flex-col gap-2 shadow-xl overflow-hidden bg-[#222831]">

  {/* Encabezado y filtro */}
  <div className="flex items-center justify-between border-b border-[#303946] pb-2 gap-2">
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-black text-xs text-[#D6AD62] uppercase truncate">
        VERSÍCULOS • {libroSeleccionado.nombre} {capituloActual}
      </span>

      <span className="text-[10px] font-mono px-1.5 rounded bg-[#303946] text-[#F1F3F5]">
        {versiculosFiltrados.length}
      </span>
    </div>

    <div className="relative w-44 flex-shrink-0">
      <Search className="w-3 h-3 absolute left-2.5 top-2 text-[#AAB4C0]" />

      <input
        type="text"
        value={busquedaVersiculoTexto}
        onChange={(e) => setBusquedaVersiculoTexto(e.target.value)}
        placeholder="Filtrar versículo..."
        className="w-full pl-7 pr-7 py-1 border border-[#303946] rounded-lg text-[11px] focus:outline-none focus:border-[#D6AD62] bg-[#171A20] text-[#F1F3F5] placeholder:text-[#AAB4C0]"
      />

      {busquedaVersiculoTexto && (
        <button
          onClick={() => setBusquedaVersiculoTexto('')}
          className="absolute right-2.5 top-1 text-[#AAB4C0] hover:text-white text-xs"
        >
          ✕
        </button>
      )}
    </div>
  </div>

  {/* Lista de versículos */}
  <div ref={listaVersiculosRef} className="flex-1 overflow-y-auto space-y-2 pr-1 pb-16">
    {versiculosFiltrados.map((ver) => {
    const isProjecting =
  proyectorConectado &&
  !isBlackout &&
  proyeccionActual?.id === `biblia-${libroSeleccionado.id}-${capituloActual}-${ver.numero}`;

   return (
       <div
          key={ver.numero}
          data-versiculo={ver.numero}
          onClick={() => proyectarVersiculo(ver)}
          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
            isProjecting
              ? 'bg-[#D6AD62]/15 border-[#D6AD62] text-[#F1F3F5] shadow-md ring-1 ring-[#D6AD62]/50'
              : 'bg-[#171A20] border-[#303946] text-[#F1F3F5] hover:bg-[#303946] hover:border-[#46515F]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className={`text-sm font-black font-mono w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
              isProjecting
                ? 'bg-[#D6AD62] text-[#171A20]'
                : 'bg-[#303946] text-[#F1F3F5] border border-[#46515F]'
            }`}>
              {ver.numero}
            </span>

            <p className="text-xs leading-relaxed flex-1 font-medium">
              {ver.texto}
            </p>
          </div>

          {isProjecting && (
            <div className="mt-2 text-right">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#D6AD62] text-[#171A20]">
                PROYECTANDO EN VIVO
              </span>
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>

              
{/* Columna 4: Previsualización & Historial (3 cols) */}
<div className="xl:col-span-3 flex flex-col gap-3 overflow-hidden">

  {/* Previsualización en pantalla */}
  <div className="border border-[#303946] rounded-2xl p-3 shadow-xl flex flex-col bg-[#222831]">

    <div className="flex items-center justify-between border-b border-[#303946] pb-1.5 mb-2">
      <span className="text-xs font-black flex items-center gap-1.5 text-[#F1F3F5]">
        <Monitor className="w-3.5 h-3.5 text-[#D6AD62]" />
        PREVISUALIZACIÓN EN PANTALLA
      </span>

      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        isBlackout
          ? 'bg-[#303946] text-[#AAB4C0] border border-[#46515F]'
          : proyeccionActual && proyectorConectado
            ? 'bg-[#D6AD62] text-[#171A20]'
            : proyeccionActual
              ? 'bg-[#303946] text-[#F1F3F5] border border-[#46515F]'
              : 'bg-[#171A20] text-[#AAB4C0] border border-[#303946]'
      }`}>
        {isBlackout
          ? 'BLACKOUT'
          : proyeccionActual && proyectorConectado
            ? 'EN VIVO'
            : proyeccionActual
              ? 'PREPARADO'
              : 'EN ESPERA'}
      </span>
    </div>

    <div className="h-36 rounded-xl border border-[#303946] bg-black flex flex-col justify-center items-center p-3 text-center">
      {isBlackout ? (
        <span className="text-xs font-mono text-[#AAB4C0] font-bold uppercase tracking-widest">
          PANTALLA NEGRA (BLACKOUT)
        </span>
      ) : proyeccionActual ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#F1F3F5] line-clamp-4 leading-relaxed whitespace-pre-line">
            {proyeccionActual.texto}
          </p>

          {proyeccionActual.pie && (
            <span className="text-[10px] font-bold text-[#D6AD62] block uppercase tracking-wide">
              {proyeccionActual.pie}
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-1 text-[#AAB4C0]">
          <span className="text-xs font-semibold block">
            Sin contenido preparado
          </span>
          <span className="text-[10px]">
            Selecciona un versículo para previsualizarlo
          </span>
        </div>
      )}
    </div>
  </div>

  {/* Historial de citas */}
  <div className="border border-[#303946] rounded-2xl p-3 shadow-xl flex-1 flex flex-col overflow-hidden bg-[#222831]">

    <div className="flex items-center justify-between border-b border-[#303946] pb-1.5 mb-2">
      <span className="text-xs font-black text-[#F1F3F5] uppercase">
        HISTORIAL DE CITAS
      </span>

      {historialVersiculos.length > 0 && (
        <button
          onClick={() => setHistorialVersiculos([])}
          className="text-[10px] font-semibold text-[#AAB4C0] hover:text-[#D6AD62] transition"
        >
          Limpiar
        </button>
      )}
    </div>

    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-10">
      {historialVersiculos.length === 0 ? (
        <div className="py-6 text-center text-[#AAB4C0] text-xs">
          No hay versículos en el historial aún
        </div>
      ) : (
        historialVersiculos.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setProyeccionActual({
                id: item.id,
                tipo: 'biblia',
                texto: `"${item.texto}"`,
                pie: `— ${item.cita} (${item.version})`,
                titulo: item.cita
              });

              enviarAlProyector({
                accion: 'mostrar',
                texto: `"${item.texto}"\n\n— ${item.cita} (${item.version})`,
                tipo: 'biblia'
              });
            }}
            className="p-2 rounded-xl border border-[#303946] bg-[#171A20] hover:bg-[#303946] hover:border-[#46515F] text-left cursor-pointer transition text-xs space-y-1"
          >
            <div className="flex items-center justify-between font-bold text-[#D6AD62] text-[11px]">
              <span>{item.cita}</span>
              <span className="text-[9px] font-mono text-[#AAB4C0] opacity-70">
                {item.hora}
              </span>
            </div>

            <p className="line-clamp-1 text-[11px] text-[#AAB4C0]">
              {item.texto}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
</div>

            </div>
          </div>
        )}

        {/* ==================== MÓDULO 3: CANCIONES & SETLISTS ==================== */}
        {moduloActivo === 'canciones' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 h-full min-h-0 flex-1 overflow-hidden">
            
            {/* Columna 1: Repertorio */}
            <div className="xl:col-span-4 border border-[#303946] rounded-2xl p-3 flex flex-col gap-3 overflow-hidden shadow-xl bg-[#222831]">

              {/* Encabezado */}
              <div className="flex items-center justify-between gap-2 border-b border-[#303946] pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Music className="w-4 h-4 text-[#D6AD62] shrink-0" />
                  <span className="font-black text-xs uppercase tracking-wide text-[#F1F3F5]">
                    REPERTORIO
                  </span>
                  <span className="text-[10px] font-bold text-[#D6AD62] bg-[#303946] px-2 py-1 rounded-lg shrink-0">
                    {repertorio.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => songFileInputRef.current?.click()}
                    title="Cargar archivos de canciones (.JS o .JSON)"
                    className="px-2.5 py-1.5 rounded-lg bg-[#303946] border border-[#46515F] hover:border-[#D6AD62] hover:bg-[#394554] text-[#F1F3F5] font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Cargar cancionero</span>
                  </button>

<button
  onClick={() => {
    setErrorNuevaCancion(false);
    setMostrarModalNuevaCancion(true);
  }}
  className="px-2.5 py-1.5 rounded-lg bg-[#D6AD62] hover:bg-[#E3BD7B] text-[#171A20] font-black text-[11px] flex items-center gap-1.5 transition cursor-pointer"
>
  <span>Nueva canción</span>
</button>

</div>
</div>

              {/* Buscador */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#AAB4C0]" />

                  <input
                    type="text"
                    value={busquedaCanciones}
                    onChange={(e) => setBusquedaCanciones(e.target.value)}
                    placeholder="Buscar por título, coro o autor..."
                    className="w-full pl-9 pr-8 py-2 border border-[#303946] rounded-xl text-xs bg-[#171A20] text-[#F1F3F5] placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] transition"
                  />

                  {busquedaCanciones && (
                    <button
                      onClick={() => setBusquedaCanciones('')}
                      title="Limpiar búsqueda"
                      className="absolute right-2.5 top-2 text-[#AAB4C0] hover:text-[#D6AD62] text-xs transition"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#AAB4C0]">
                    <input
                      type="checkbox"
                      checked={buscarEnLetra}
                      onChange={(e) => setBuscarEnLetra(e.target.checked)}
                      className="rounded border-[#46515F] accent-[#D6AD62]"
                    />
                    <span>Buscar dentro de las letras</span>
                  </label>

                  <span className="text-[10px] font-semibold text-[#D6AD62] shrink-0">
                    {cancionesFiltradas.length} resultados
                  </span>
                </div>
              </div>

              {/* Lista de canciones */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-10">
                {cancionesFiltradas.slice(0, 100).map((cancion) => {
                  const isSelected = cancionSeleccionada?.id === cancion.id;

                  return (
                    <div
                      key={cancion.id}
                      onClick={() => {
                        setCancionSeleccionada(cancion);
                        setSeccionActivaIdx(-1);
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#303946] border-[#D6AD62] text-[#F1F3F5] shadow-md'
                          : 'bg-[#171A20] border-[#303946] text-[#AAB4C0] hover:bg-[#303946] hover:border-[#46515F]'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0 pr-1">
                        <span className={`font-bold text-xs block truncate ${
                          isSelected ? 'text-[#F1F3F5]' : 'text-[#E1E5E9]'
                        }`}>
                          {cancion.title}
                        </span>

                        <div className="flex items-center gap-2 text-[10px] text-[#AAB4C0]">
                          {cancion.author && (
                            <span className="truncate">{cancion.author}</span>
                          )}
                          <span className="shrink-0">
                            {cancion.sections.length} partes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">

                        {/* Agregar al Setlist */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nuevoSetlist = [...setlistItems, cancion];
                            setSetlists(prev => ({ ...prev, [setlistActual]: nuevoSetlist }));
                            localStorage.setItem('lbc_setlists', JSON.stringify({ ...setlists, [setlistActual]: nuevoSetlist }));
                            mostrarToast(`Añadida "${cancion.title}" al setlist`);
                          }}
                          title="Agregar a Setlist de culto"
                          className="w-7 h-7 rounded-lg bg-[#303946] hover:bg-[#D6AD62] text-[#D6AD62] hover:text-[#171A20] flex items-center justify-center transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {/* Eliminar canción */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancionAEliminar(cancion);
                          }}
                          title="Eliminar esta canción del repertorio"
                          className="w-7 h-7 rounded-lg bg-[#303946] hover:bg-rose-700 text-[#AAB4C0] hover:text-white flex items-center justify-center transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </div>
                  );
                })}

                {cancionesFiltradas.length > 100 && (
                  <div className="text-center text-[10px] text-[#AAB4C0] py-3 border-t border-[#303946] mt-2">
                    Mostrando 100 de {cancionesFiltradas.length} canciones.
                    Escribe en el buscador para filtrar más.
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Bloques y Estrofas de la Canción (5 cols) */}
            <div className="xl:col-span-5 bg-[#222831] border border-[#303946] rounded-2xl p-3 flex flex-col gap-2.5 overflow-hidden shadow-xl">
              {cancionSeleccionada ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#303946] pb-2">
                    <div>
                      <h2 className="text-sm font-black text-[#D6AD62]">{cancionSeleccionada.title}</h2>
                      <p className="text-[11px] text-[#AAB4C0]">
                        {cancionSeleccionada.author || 'Dominio Público'} • {cancionSeleccionada.sections.length} secciones
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => abrirModalEditarCancion(cancionSeleccionada)}
                        title="Editar letra, estrofas o título de esta alabanza"
                        className="px-2.5 py-1.5 rounded-lg bg-[#303946] border border-[#D6AD62]/50 hover:bg-[#394554] hover:border-[#D6AD62] text-[#D6AD62] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Letra</span>
                      </button>

                      <button
                        onClick={retrocederEstrofa}
                        title="Estrofa anterior (Flecha Izq)"
                        className="px-2.5 py-1.5 rounded-lg bg-[#303946] border border-[#46515F] text-[#F1F3F5] text-xs font-bold hover:bg-[#394554] hover:border-[#AAB4C0] transition cursor-pointer"
                      >
                        <span className="text-sm leading-none">‹</span>
Anterior
                      </button>
                      <button
                        onClick={avanzarEstrofa}
                        title="Estrofa siguiente (Flecha Der)"
                        className="px-2.5 py-1.5 rounded-lg bg-[#D6AD62] hover:bg-[#E3BD7B] text-[#171A20] text-xs font-black transition cursor-pointer"
                      >
                        Siguiente
<span className="text-sm leading-none">›</span>
                      </button>
                    </div>
                  </div>

                  {/* Sections / Stanzas List */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-16">
                    {cancionSeleccionada.sections.map((seccion, idx) => {
                      const isActive = seccionActivaIdx === idx;
                      const esCoro = seccion.type === 'chorus';
                      const esPuente = seccion.type === 'bridge';
                      return (
                        <div
                          key={idx}
                          onClick={() => proyectarEstrofa(seccion, cancionSeleccionada, idx)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative ${
  isActive
    ? 'bg-[#D6AD62]/15 border-[#D6AD62] text-[#F1F3F5] shadow-lg ring-1 ring-[#D6AD62]/30'
    : 'bg-[#171A20] border-[#303946] text-[#F1F3F5] hover:bg-[#222831] hover:border-[#46515F]'
}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
  esCoro
    ? 'bg-[#D6AD62]/15 border-[#D6AD62]/50 text-[#D6AD62]'
    : esPuente
    ? 'bg-[#303946] border-[#46515F] text-[#AAB4C0]'
    : 'bg-[#303946] border-[#46515F] text-[#F1F3F5]'
}`}>
                              {seccion.label}
                            </span>
                            {isActive &&
  proyectorConectado &&
  !isBlackout &&
  proyeccionActual?.id === `${cancionSeleccionada.id}-sec-${idx}` && (
    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#D6AD62] text-[#171A20]">
      PROYECTANDO EN VIVO
    </span>
)}
                          </div>
                          <p className="text-xs font-medium leading-relaxed whitespace-pre-line">
                            {seccion.lines.join('\n')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Music className="w-10 h-10 stroke-1" />
                  <p className="text-xs">Selecciona una alabanza del repertorio</p>
                </div>
              )}
            </div>

            
{/* Columna 3: Previsualización y Setlist (3 cols) */}
<div className="xl:col-span-3 flex flex-col gap-3 overflow-hidden">

  {/* Previsualización en pantalla */}
  <div className="border border-[#303946] rounded-2xl p-3 shadow-xl flex flex-col bg-[#222831]">

    <div className="flex items-center justify-between border-b border-[#303946] pb-1.5 mb-2">
      <span className="text-xs font-black flex items-center gap-1.5 text-[#F1F3F5]">
        <Monitor className="w-3.5 h-3.5 text-[#D6AD62]" />
        PREVISUALIZACIÓN EN PANTALLA
      </span>

      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        isBlackout
          ? 'bg-[#303946] text-[#AAB4C0] border border-[#46515F]'
          : proyeccionActual && proyectorConectado
            ? 'bg-[#D6AD62] text-[#171A20]'
            : proyeccionActual
              ? 'bg-[#303946] text-[#F1F3F5] border border-[#46515F]'
              : 'bg-[#171A20] text-[#AAB4C0] border border-[#303946]'
      }`}>
        {isBlackout
          ? 'BLACKOUT'
          : proyeccionActual && proyectorConectado
            ? 'EN VIVO'
            : proyeccionActual
              ? 'PREPARADO'
              : 'EN ESPERA'}
      </span>
    </div>

    <div className="h-36 rounded-xl border border-[#303946] bg-black flex flex-col justify-center items-center p-3 text-center">
      {isBlackout ? (
        <span className="text-xs font-mono text-[#AAB4C0] font-bold uppercase tracking-widest">
          PANTALLA NEGRA (BLACKOUT)
        </span>
      ) : proyeccionActual ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#F1F3F5] line-clamp-4 leading-relaxed whitespace-pre-line">
            {proyeccionActual.texto}
          </p>

          {proyeccionActual.pie && (
            <span className="text-[10px] font-bold text-[#D6AD62] block uppercase tracking-wide">
              {proyeccionActual.pie}
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-1 text-[#AAB4C0]">
          <span className="text-xs font-semibold block">
            Sin contenido preparado
          </span>
          <span className="text-[10px]">
            Selecciona una estrofa para previsualizarla
          </span>
        </div>
      )}
    </div>
  </div>

  {/* Setlist de culto */}
  <div className="border border-[#303946] rounded-2xl p-3 shadow-xl flex-1 flex flex-col overflow-hidden bg-[#222831]">

    <div className="flex items-center justify-between border-b border-[#303946] pb-2 mb-2 gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-black text-xs uppercase text-[#F1F3F5]">
          SETLIST DE CULTO
        </span>

        <span className="text-[10px] font-mono px-1.5 rounded bg-[#303946] text-[#F1F3F5]">
          {setlistItems.length}
        </span>
      </div>

      <select
        value={setlistActual}
        onChange={(e) => setSetlistActual(e.target.value)}
        className="border border-[#303946] rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:border-[#D6AD62] bg-[#171A20] text-[#D6AD62]"
      >
        <option value="domingo">Domingo</option>
        <option value="miercoles">Miércoles</option>
        <option value="sabado">Sábado</option>
        <option value="general">Especial</option>
      </select>
    </div>

    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-10">
      {setlistItems.map((cancion, idx) => (
        <div
          key={`${cancion.id}-${idx}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', String(idx));
            setArrastrandoCancionIdx(idx);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const src = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(src)) reordenarCancionEnSetlist(src, idx);
            setArrastrandoCancionIdx(null);
          }}
          onDragEnd={() => setArrastrandoCancionIdx(null)}
          onClick={() => {
            setCancionSeleccionada(cancion);
            setSeccionActivaIdx(-1);
          }}
          className={`p-2 rounded-xl border text-left text-xs flex items-center justify-between cursor-pointer group transition select-none ${
            arrastrandoCancionIdx === idx
              ? 'opacity-40 border-dashed border-[#D6AD62] bg-[#D6AD62]/10'
              : 'bg-[#171A20] border-[#303946] hover:bg-[#303946] hover:border-[#46515F]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 pr-1">
            <GripVertical className="w-3.5 h-3.5 text-[#AAB4C0] group-hover:text-[#D6AD62] cursor-grab flex-shrink-0" />

            <div className="truncate">
              <span className="font-bold block truncate text-[#F1F3F5]">
                {idx + 1}. {cancion.title}
              </span>

              <span className="text-[10px] text-[#AAB4C0] font-mono">
                {cancion.sections.length} partes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">

            {/* Subir canción */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                moverCancionEnSetlist(idx, 'arriba');
              }}
              disabled={idx === 0}
              title="Subir canción en el orden"
              className="p-1 rounded text-[#AAB4C0] hover:text-[#D6AD62] disabled:opacity-20 cursor-pointer"
            >
              <ArrowUp className="w-3 h-3" />
            </button>

            {/* Bajar canción */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                moverCancionEnSetlist(idx, 'abajo');
              }}
              disabled={idx === setlistItems.length - 1}
              title="Bajar canción en el orden"
              className="p-1 rounded text-[#AAB4C0] hover:text-[#D6AD62] disabled:opacity-20 cursor-pointer"
            >
              <ArrowDown className="w-3 h-3" />
            </button>

            {/* Quitar canción de la lista */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nuevo = setlistItems.filter((_, i) => i !== idx);
                setSetlists(prev => ({ ...prev, [setlistActual]: nuevo }));
                localStorage.setItem('lbc_setlists', JSON.stringify({ ...setlists, [setlistActual]: nuevo }));
              }}
              title="Eliminar de la lista"
              className="text-[#AAB4C0] hover:text-rose-400 p-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      ))}
    </div>
  </div>
</div>
</div>
)}

        {/* ==================== MÓDULO: PRÉDICA & BOSQUEJOS ==================== */}
        {moduloActivo === 'predica' && (
          <PredicaPanel
            temaOperador={temaOperador}
            onProyectar={proyectarPredica}
            mostrarToast={mostrarToast}
          />
        )}

        {/* ==================== MÓDULO 4: FONDOS DINÁMICOS ==================== */}
        {moduloActivo === 'fondos' && (
          <div className="h-full min-h-0 flex-1 overflow-y-auto space-y-3 pr-1">
            <div className={`border rounded-2xl p-4 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Image className="w-5 h-5 text-amber-500" />
                    <span>Fondos Visuales & Animados para el Proyector</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fondos litúrgicos y dinámicos para cultos. Puedes subir imágenes propias o videos MP4 en bucle.
                  </p>
                </div>

                <button
                  onClick={() => fondoFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>+ Subir Fondo (Imagen o Video MP4)</span>
                </button>
              </div>

              {/* Grid combinada de Fondos Predeterminados y Subidos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...fondosPersonalizados, ...FONDOS_PREDETERMINADOS].map((fondo) => {
                  const bg = fondo.url || fondo.cssBackground || '';
                  const isActive = fondoActivo === bg;
                  const isAnim = fondo.tipo === 'anim' || fondo.categoria === 'animado';
                  const isVideo = fondo.tipo === 'video' || bg.startsWith('video:');

                  return (
                    <div
                      key={fondo.id}
                      onClick={() => seleccionarFondo(fondo)}
                      className={`rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                        isActive
                          ? 'ring-4 ring-amber-400 border-amber-400 scale-[1.03] shadow-2xl'
                          : 'border-slate-700 hover:border-amber-400 hover:scale-[1.01]'
                      }`}
                    >
                      <div
                        className={`h-28 w-full flex flex-col justify-between p-2.5 relative overflow-hidden ${
                          isAnim ? fondo.cssBackground : ''
                        }`}
                        style={{
                          backgroundColor: '#020617',
                          backgroundImage: (!isAnim && !isVideo && (fondo.url || fondo.cssBackground?.startsWith('radial') || fondo.cssBackground?.startsWith('linear')))
                            ? (fondo.cssBackground || `url('${fondo.url}')`)
                            : undefined,
                          backgroundSize: modoAjusteFondo,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center center'
                        }}
                      >
                        {/* Video Thumbnail preview if custom video */}
                        {isVideo && (
                          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center pointer-events-none opacity-80">
                            <Video className="w-8 h-8 text-purple-400 animate-pulse" />
                          </div>
                        )}

                        <div className="flex items-center justify-between z-10">
                          {isAnim && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white font-extrabold text-[8px] uppercase backdrop-blur animate-pulse">
                              ✨ ANIMADO
                            </span>
                          )}
                          {isVideo && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-600/90 text-white font-extrabold text-[8px] uppercase backdrop-blur">
                              🎬 VIDEO BUCLE
                            </span>
                          )}
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase shadow ml-auto">
                              ✓ ACTIVO
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1 z-10">
                          <span className="text-[11px] font-bold text-white bg-black/75 px-2 py-0.5 rounded backdrop-blur border border-white/20 truncate flex-1">
                            {fondo.nombre}
                          </span>
                          {fondo.esSubido && (
                            <button
                              onClick={(e) => eliminarFondoPersonalizado(fondo.id, e)}
                              className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition shrink-0"
                              title="Eliminar este fondo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Stage Monitor for Background */}
            <div className={`border rounded-2xl p-4 shadow-xl space-y-3 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-slate-400">Simulación del Proyector con Fondo Activo</span>
                <span className="text-[11px] text-amber-500 font-bold">Transmitido en tiempo real a display.html</span>
              </div>

              {/* Controles de Ajuste de Imagen y Contraste de Letras */}
              <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Ajuste de Imagen:</span>
                  <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
                    <button
                      onClick={() => cambiarModoAjusteFondo('contain')}
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                        modoAjusteFondo === 'contain' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Muestra la imagen completa centrada sin cortar nada (ideal para logos y banners)"
                    >
                      🎯 Completar, no cortar
                    </button>
                    <button
                      onClick={() => cambiarModoAjusteFondo('cover')}
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                        modoAjusteFondo === 'cover' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Rellena toda la pantalla panorámica 16:9"
                    >
                      📐 Rellenar pantalla
                    </button>
                    <button
                      onClick={() => cambiarModoAjusteFondo('fill')}
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                        modoAjusteFondo === 'fill' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Ajusta a pantalla completa 100% eliminando franjas negras en TV"
                    >
                      ↔️ Pantalla completa
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Filtro Oscuro para Letras:</span>
                  <div className="flex gap-1 text-xs">
                    {[
                      { val: 0, label: '0%' },
                      { val: 0.3, label: '30%' },
                      { val: 0.45, label: '45% (Óptimo)' },
                      { val: 0.65, label: '65%' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => cambiarOscurecedorFondo(opt.val)}
                        className={`px-2.5 py-1 rounded font-bold border transition cursor-pointer ${
                          oscurecedorFondo === opt.val
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monitor Visual */}
              <div
                className={`h-52 rounded-xl flex flex-col items-center justify-center text-center p-4 border border-slate-800 transition-all duration-300 relative overflow-hidden ${
                  tipoFondoActivo === 'anim' ? fondoActivo : ''
                }`}
                style={{
                  backgroundColor: '#020617',
                  backgroundImage: (tipoFondoActivo !== 'anim' && !fondoActivo.startsWith('video:') && (fondoActivo.startsWith('http') || fondoActivo.startsWith('data:') || fondoActivo.includes('assets/') || fondoActivo.includes('fondos/') || /\.(jpg|jpeg|png|webp)/i.test(fondoActivo)))
                    ? `url('${fondoActivo}')`
                    : (tipoFondoActivo === 'estatico' && !fondoActivo.startsWith('data:') && !fondoActivo.startsWith('http') ? fondoActivo : undefined),
                  backgroundSize: modoAjusteFondo === 'fill' ? '100% 100%' : modoAjusteFondo,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center center'
                }}
              >
                {/* Capa de contraste para lectura óptima */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${oscurecedorFondo})` }}
                />

                <div className="relative z-10 space-y-2 max-w-xl">
                  <p className="text-white text-lg font-bold drop-shadow-[0_4px_16px_rgba(0,0,0,1)] leading-relaxed whitespace-pre-line">
                    {proyeccionActual?.texto || '"Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito..."'}
                  </p>
                  {proyeccionActual?.pie && (
                    <span className="text-amber-400 text-xs font-bold uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,1)] inline-block px-3 py-1 rounded-full bg-slate-950/80 border border-amber-400/40">
                      {proyeccionActual.pie}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 5: VIDEO ==================== */}
        {moduloActivo === 'video' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0 flex-1 overflow-y-auto pr-1">
            <div className={`lg:col-span-8 border rounded-2xl p-4 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-500" />
                  <span>Reproductor de Videos de Culto</span>
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{videoUrl ? 'Cambiar Video MP4/WebM' : 'Cargar Video Local'}</span>
                  </button>
                </div>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative group">
                {videoUrl ? (
                  <>
                    <video src={videoUrl} controls loop={videoLoop} className="w-full h-full object-contain" />
                    {videoEnProyector && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span>EN VIVO EN EL PROYECTOR</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-3 p-8">
                    <Video className="w-14 h-14 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Selecciona un archivo de video desde tu computadora (.mp4, .webm)</p>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                    >
                      Buscar Video en la Computadora
                    </button>
                  </div>
                )}
              </div>

              {/* Botones de Control de Proyección de Video */}
              {videoUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={proyectarVideoEnProyector}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ${
                        videoEnProyector
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{videoEnProyector ? 'Actualizar Proyección de Video' : '▶ Proyectar Video en Pantalla'}</span>
                    </button>

                    {videoEnProyector && (
                      <button
                        onClick={detenerVideoEnProyector}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>⏹ Detener</span>
                      </button>
                    )}

                    <button
                      onClick={quitarVideoCulto}
                      title="Descargar y quitar video de la pantalla y de la memoria"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Quitar Video</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={videoLoop}
                        onChange={(e) => setVideoLoop(e.target.checked)}
                        className="rounded accent-purple-500"
                      />
                      <span>Repetir en Bucle</span>
                    </label>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800 text-slate-300">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <span>Volumen:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={videoVolume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setVideoVolume(v);
                          if (videoEnProyector) {
                            enviarAlProyector({ accion: 'controlVideo', volumen: v / 100 });
                          }
                        }}
                        className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <span className="font-mono text-[11px] w-6 text-right">{videoVolume}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reproductor de Enlaces de YouTube */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Reproducir desde Enlace de YouTube</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Pega el link de cualquier alabanza, predica o testimonio</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeInputUrl}
                    onChange={(e) => setYoutubeInputUrl(e.target.value)}
                    placeholder="Pega aquí el enlace de YouTube (ej: https://www.youtube.com/watch?v=... o https://youtu.be/...)"
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none font-mono ${
                      temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <button
                    onClick={cargarVideoYoutube}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Cargar
                  </button>
                </div>

                {youtubeVideoId && (
                  <div className="space-y-3 pt-1">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${encodeURIComponent('http://localhost:3000')}&autoplay=0&rel=0&modestbranding=1`}
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      ></iframe>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>Video ID: <strong className="font-mono text-amber-400">{youtubeVideoId}</strong></span>
                      <a
                        href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition underline font-medium cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir directamente en YouTube</span>
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={proyectarYoutubeEnProyector}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                          youtubeEnProyector
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{youtubeEnProyector ? '● Transmitiendo YouTube al Proyector' : '▶ Proyectar YouTube en Pantalla Completa'}</span>
                      </button>

                      {youtubeEnProyector && (
                        <button
                          onClick={detenerYoutubeEnProyector}
                          className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-bold text-xs transition cursor-pointer"
                        >
                          ⏹ Detener
                        </button>
                      )}

                      <button
                        onClick={quitarVideoYoutube}
                        title="Quitar video de YouTube, detener reproducción y vaciar reproductor"
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Quitar Video del Todo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`lg:col-span-4 border rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Instrucciones de Video</span>
                </h3>
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 leading-relaxed ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <p>
                    <strong className="text-amber-500 block mb-1">💡 Proyección en Segundo Monitor:</strong>
                    Al oprimir <strong>"▶ Proyectar Video en Pantalla"</strong>, el video se reproducirá en la ventana externa del proyector en pantalla completa sin barras de navegación ni menús.
                  </p>
                  <p>
                    Puedes usar <strong>Blackout (B)</strong> en cualquier instante para silenciar/ocultar el video o <strong>Limpiar (C)</strong> para volver a la pantalla de bienvenida.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={toggleBlackout} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer">
                  Blackout (B)
                </button>
                <button onClick={limpiarPantalla} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 transition cursor-pointer">
                  Limpiar (C)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 6: KARAOKE / PISTAS DE ALABANZA ==================== */}
        {moduloActivo === 'karaoke' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-full min-h-0 flex-1 overflow-y-auto pr-1">
            {/* Reproductor y Controles de Audio (5 cols) */}
            <div className={`xl:col-span-5 border rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="space-y-3">
                <div className={`flex items-center justify-between border-b pb-3 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Mic className="w-5 h-5 text-teal-500" />
                    <span>Control de Pista & Audio</span>
                  </h2>
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar MP3/WAV</span>
                  </button>
                </div>

                {/* Track Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                      karaokePlaying ? 'bg-teal-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-teal-400'
                    }`}>
                      <Disc className={`w-6 h-6 ${karaokePlaying ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-extrabold text-xs block truncate">
                        {karaokePistaNombre}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {karaokePistaUrl ? (
                          <>Alabanza: <strong className="text-amber-500">{karaokeCancion.title}</strong></>
                        ) : (
                          <span>Sin audio • Usa "Cargar MP3/WAV" o pulsa Play en el Setlist</span>
                        )}
                      </span>
                    </div>

                    {/* Botón para Eliminar la Canción / Pista subida y dejar el reproductor limpio */}
                    {karaokePistaUrl && (
                      <button
                        onClick={() => setMostrarModalEliminarPistaActual(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                        title="Eliminar esta canción subida para dejar el reproductor limpio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar pista</span>
                      </button>
                    )}
                  </div>

                  {/* Seek Bar */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max={karaokeDuration || 100}
                      value={karaokeCurrentTime}
                      onChange={(e) => handleSeekKaraoke(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{Math.floor(karaokeCurrentTime / 60)}:{('0' + Math.floor(karaokeCurrentTime % 60)).slice(-2)}</span>
                      <span>{Math.floor(karaokeDuration / 60)}:{('0' + Math.floor(karaokeDuration % 60)).slice(-2)}</span>
                    </div>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleKaraokePlay}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        {karaokePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                        <span>{karaokePlaying ? 'Pausa' : 'Reproducir'}</span>
                      </button>

                      <button
                        onClick={stopKaraoke}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Detener pista"
                      >
                        <Square className="w-4 h-4 fill-slate-300" />
                      </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const m = !karaokeMuted;
                          setKaraokeMuted(m);
                          if (audioRef.current) audioRef.current.muted = m;
                          pitchPlayerRef.current?.setVolume(karaokeVolume, m);
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {karaokeMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={karaokeMuted ? 0 : karaokeVolume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setKaraokeVolume(v);
                          if (audioRef.current) audioRef.current.volume = v / 100;
                          pitchPlayerRef.current?.setVolume(v, karaokeMuted);
                        }}
                        className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                    </div>
                  </div>

                  {/* Control de Tono / Pitch Shifter en Semitonos */}
                  <div className={`mt-3 pt-3 border-t space-y-2.5 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs font-bold text-slate-200">Ajuste de Tono (Pitch):</span>
                      </div>
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        pitchSemitonos === 0
                          ? 'bg-slate-800 text-teal-400 border border-teal-500/30'
                          : pitchSemitonos > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}>
                        {pitchSemitonos === 0
                          ? '0 st (Tono Original)'
                          : pitchSemitonos > 0
                          ? `+${pitchSemitonos} st (${pitchSemitonos === 2 ? '1 Tono Arriba' : pitchSemitonos === 1 ? '½ Tono Arriba' : `+${pitchSemitonos} semitonos`})`
                          : `${pitchSemitonos} st (${pitchSemitonos === -2 ? '1 Tono Abajo' : pitchSemitonos === -1 ? '½ Tono Abajo' : `${pitchSemitonos} semitonos`})`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Aumenta o disminuye semitonos para adaptar el audio MP3 o WAV a la voz que vaya a cantar:
                    </p>

                    {/* Botones de semitono y restablecer */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarPitchSemitonos(-1)}
                        disabled={pitchSemitonos <= -6}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-slate-700"
                        title="Disminuir medio tono (-1 semitono)"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                        <span>-1 Semitono</span>
                      </button>

                      <button
                        onClick={() => cambiarPitchSemitonos(0, true)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          pitchSemitonos === 0
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Restablecer al tono original"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => cambiarPitchSemitonos(1)}
                        disabled={pitchSemitonos >= 6}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-slate-700"
                        title="Aumentar medio tono (+1 semitono)"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+1 Semitono</span>
                      </button>
                    </div>

                    {/* Selector rápido directo de semitonos (-3 a +3) */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      {[-3, -2, -1, 0, 1, 2, 3].map((st) => (
                        <button
                          key={st}
                          onClick={() => cambiarPitchSemitonos(st, true)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded transition cursor-pointer ${
                            pitchSemitonos === st
                              ? 'bg-teal-400 text-slate-950 shadow scale-105'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                          title={st === 0 ? 'Original' : st > 0 ? `+${st} semitonos` : `${st} semitonos`}
                        >
                          {st > 0 ? `+${st}` : st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Setlist de Pistas (Culto sin Músicos) */}
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 overflow-hidden ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs uppercase text-teal-400">SETLIST DE PISTAS</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${temaOperador === 'claro' ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-teal-300'}`}>
                      {karaokeSetlistItems.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón para subir múltiples pistas de audio MP3/WAV a la vez (4, 8, 10, 20 pistas) */}
                    <button
                      onClick={() => karaokeSetlistFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
                      title="Subir pistas MP3/WAV para este culto (puedes seleccionar varias a la vez)"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>+ Pistas MP3</span>
                    </button>

                    <select
                      value={karaokeSetlistActual}
                      onChange={(e) => setKaraokeSetlistActual(e.target.value)}
                      className={`border rounded-lg text-xs font-bold px-2 py-1 focus:outline-none cursor-pointer ${
                        temaOperador === 'claro' ? 'bg-white border-slate-300 text-teal-700' : 'bg-slate-900 border-slate-800 text-teal-400'
                      }`}
                    >
                      <option value="domingo">Domingo</option>
                      <option value="miercoles">Miércoles</option>
                      <option value="sabado">Sábado</option>
                      <option value="general">Especial</option>
                    </select>

                    {karaokeSetlistItems.length > 0 && (
                      <button
                        onClick={vaciarKaraokeSetlistActual}
                        title={`Vaciar todas las pistas de ${karaokeSetlistActual === 'general' ? 'Especial' : karaokeSetlistActual}`}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1">
                  {karaokeSetlistItems.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl space-y-2">
                      <p className="text-xs text-slate-300 font-bold">
                        No hay pistas cargadas para {karaokeSetlistActual === 'general' ? 'Especial' : karaokeSetlistActual}.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Sube varias pistas a la vez (4, 8, 10, 20 canciones) para tener todo el culto listo sin subirlas una a una.
                      </p>
                      <button
                        onClick={() => karaokeSetlistFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Subir Pistas MP3 ({karaokeSetlistActual === 'general' ? 'Especial' : karaokeSetlistActual})</span>
                      </button>
                    </div>
                  ) : (
                    karaokeSetlistItems.map((item, idx) => {
                      const esPistaActual = (karaokePistaUrl && karaokePistaUrl === item.pistaUrl) || (karaokeCancion.id === item.songId && !item.pistaUrl);
                      const estaSonando = esPistaActual && karaokePlaying;

                      return (
                        <div
                          key={`${item.id}-${idx}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(idx));
                            setArrastrandoKaraokeIdx(idx);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const src = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (!isNaN(src)) reordenarKaraokeEnSetlist(src, idx);
                            setArrastrandoKaraokeIdx(null);
                          }}
                          onDragEnd={() => setArrastrandoKaraokeIdx(null)}
                          onClick={() => seleccionarKaraokeItem(item)}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer group transition select-none ${
                            esPistaActual
                              ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow'
                              : arrastrandoKaraokeIdx === idx
                              ? 'opacity-40 border-dashed border-teal-400'
                              : temaOperador === 'claro'
                              ? 'bg-white border-slate-200 hover:bg-slate-100'
                              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1 pr-1">
                            <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 cursor-grab flex-shrink-0" />

                            {/* Botón de Play / Pausa DIRECTO en cada pista del Setlist */}
                            <button
                              onClick={(e) => reproducirItemDirecto(item, e)}
                              title={
                                estaSonando
                                  ? 'Pausar esta pista'
                                  : 'Reproducir esta pista directamente'
                              }
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition cursor-pointer shadow-sm ${
                                estaSonando
                                  ? 'bg-teal-400 text-slate-950 animate-pulse font-black'
                                  : item.pistaUrl
                                  ? 'bg-teal-600/30 hover:bg-teal-500 text-teal-300 hover:text-slate-950'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {estaSonando ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </button>

                            <div className="truncate flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold block truncate">
                                  {idx + 1}. {item.songTitle}
                                </span>
                                {item.pistaUrl ? (
                                  <span className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1 py-0.2 rounded font-mono font-bold flex-shrink-0">
                                    MP3
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono flex-shrink-0">
                                    Letra
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block font-mono">
                                {item.pistaNombre || 'Pista de alabanza'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Ajuste rápido de tono (Pitch) directamente en la pista del Setlist */}
                            <div className="flex items-center gap-0.5 bg-slate-950/80 border border-slate-800 rounded-lg px-1.5 py-0.5" title="Ajustar tono (pitch) de la alabanza">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cambiarPitchSemitonos(-1);
                                }}
                                title="Bajar medio tono (-1 semitono)"
                                className="w-4 h-4 flex items-center justify-center text-indigo-400 hover:text-indigo-300 font-bold text-xs cursor-pointer rounded hover:bg-slate-800"
                              >
                                -
                              </button>
                              <span className="text-[9px] font-mono font-bold text-teal-300 min-w-[26px] text-center" title="Semitonos actuales">
                                {pitchSemitonos === 0 ? '0st' : pitchSemitonos > 0 ? `+${pitchSemitonos}st` : `${pitchSemitonos}st`}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cambiarPitchSemitonos(1);
                                }}
                                title="Subir medio tono (+1 semitono)"
                                className="w-4 h-4 flex items-center justify-center text-emerald-400 hover:text-emerald-300 font-bold text-xs cursor-pointer rounded hover:bg-slate-800"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moverKaraokeEnSetlist(idx, 'arriba');
                              }}
                              disabled={idx === 0}
                              title="Subir posición"
                              className="p-1 rounded text-slate-400 hover:text-teal-400 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moverKaraokeEnSetlist(idx, 'abajo');
                              }}
                              disabled={idx === karaokeSetlistItems.length - 1}
                              title="Bajar posición"
                              className="p-1 rounded text-slate-400 hover:text-teal-400 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => pedirEliminarKaraokeDeSetlist(idx, e)}
                              title="Quitar pista de la lista"
                              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sincronizador de Letras para Proyección (7 cols) */}
            <div className={`xl:col-span-7 border rounded-2xl p-4 shadow-xl flex flex-col gap-3 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b pb-2.5 ${
                temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
              }`}>
                {/* Selector de Canción Filtrada + Botón Editar */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-xs uppercase text-teal-400 shrink-0">ALABANZA:</span>
                  <select
                    value={karaokeCancion.id}
                    onChange={(e) => {
                      const song = repertorio.find(s => s.id === e.target.value);
                      if (song) seleccionarCancionKaraoke(song);
                    }}
                    className={`border rounded-lg text-xs font-bold px-2 py-1.5 w-44 sm:w-56 truncate outline-none ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-teal-700' : 'bg-slate-950 border-slate-800 text-teal-400'
                    }`}
                  >
                    {!cancionesFiltradasKaraoke.some(s => s.id === karaokeCancion.id) && (
                      <option value={karaokeCancion.id}>{karaokeCancion.title} (Actual)</option>
                    )}
                    {cancionesFiltradasKaraoke.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => abrirModalEditarCancion(karaokeCancion)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer shrink-0"
                    title="Editar letra o corregir estrofas de esta alabanza"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>

                {/* Caja de Búsqueda Sincronizada con Enter y Limpiar + Botones de Acción */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-lg w-40 sm:w-52 ${
                    temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                  }`}>
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={busquedaKaraoke}
                      onChange={(e) => handleBusquedaKaraokeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (cancionesFiltradasKaraoke.length > 0) {
                            seleccionarCancionKaraoke(cancionesFiltradasKaraoke[0]);
                            mostrarToast(`Alabanza seleccionada: ${cancionesFiltradasKaraoke[0].title}`);
                          }
                        }
                      }}
                      placeholder="Buscar alabanza..."
                      className="bg-transparent border-none outline-none w-full text-xs"
                    />
                    {busquedaKaraoke && (
                      <button
                        onClick={() => setBusquedaKaraoke('')}
                        title="Limpiar búsqueda"
                        className="text-slate-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Botón para añadir alabanza al setlist de pistas */}
                  <button
                    onClick={() => agregarCancionAKaraokeSetlist(karaokeCancion)}
                    className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer shrink-0"
                    title="Añadir esta canción a la lista de pistas del día"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Setlist</span>
                  </button>

                  <button
                    onClick={() => {
                      if (karaokeSeccionIdx < karaokeCancion.sections.length - 1) {
                        const sig = karaokeSeccionIdx + 1;
                        setKaraokeSeccionIdx(sig);
                        proyectarEstrofa(karaokeCancion.sections[sig], karaokeCancion, sig);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Siguiente Estrofa ➡</span>
                  </button>
                </div>
              </div>

              {/* Sections to click and project */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
                {karaokeCancion.sections.map((sec, idx) => {
                  const isCurrent = karaokeSeccionIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setKaraokeSeccionIdx(idx);
                        proyectarEstrofa(sec, karaokeCancion, idx);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                        isCurrent
                          ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg ring-2 ring-teal-400/50'
                          : temaOperador === 'claro'
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          {sec.label}
                        </span>
                        <p className="text-xs font-semibold whitespace-pre-line leading-relaxed">
                          {sec.lines.join('\n')}
                        </p>
                      </div>

                      <button
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isCurrent ? '● PROYECTANDO' : 'Proyectar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 7: DIAPOSITIVAS & IMÁGENES (CANVA) ==================== */}
        {moduloActivo === 'anuncios' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-full min-h-0 flex-1 overflow-hidden">
            {/* Galería Principal de Imágenes y Diapositivas (8 cols) */}
            <div className={`xl:col-span-8 border rounded-2xl p-3 shadow-xl flex flex-col gap-2 overflow-hidden ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              {/* Selector de Sub-Pestañas: Diapositivas de la Iglesia vs Galería de Paisajes */}
              <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b pb-2 flex-shrink-0 ${
                temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
              }`}>
                {/* Botones de cambio de Sub-Pestaña */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
                  <button
                    onClick={() => setSubPestanaDiapositivas('iglesia')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                      subPestanaDiapositivas === 'iglesia'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🏛️ Diapositivas de la Iglesia</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      subPestanaDiapositivas === 'iglesia' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {diapositivasIglesia.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setSubPestanaDiapositivas('galeria')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                      subPestanaDiapositivas === 'galeria'
                        ? 'bg-teal-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🌄 Galería de Paisajes & Fondos</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      subPestanaDiapositivas === 'galeria' ? 'bg-slate-950 text-teal-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {galeriaPaisajes.length}
                    </span>
                  </button>
                </div>

                {/* Botón de subida contextual según la sub-pestaña activa */}
                {subPestanaDiapositivas === 'iglesia' ? (
                  <button
                    onClick={() => imageFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                    title="Subir afiches de Canva, anuncios o imágenes de culto para la iglesia"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Subir Diapositiva / Flyer (Canva, PNG, JPG)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => galeriaFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                    title="Subir fotos de paisajes, cielo o biblias a la galería"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Subir Foto a Galería (PNG, JPG)</span>
                  </button>
                )}
              </div>

              {/* Subtítulo informativo */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 flex-shrink-0">
                <span>
                  {subPestanaDiapositivas === 'iglesia'
                    ? 'Banners oficiales de cultos (Bienvenida, Santa Cena, Diezmos, etc.) y afiches personalizados de Canva.'
                    : '13 fotografías litúrgicas de alta calidad (cielos y sagradas escrituras) y fotos de paisajes subidas.'}
                </span>
                <span className="font-mono text-slate-500">
                  {subPestanaDiapositivas === 'iglesia' ? `${diapositivasIglesia.length} diapositivas` : `${galeriaPaisajes.length} imágenes`}
                </span>
              </div>

              {/* Grid de Diapositivas Guardadas con Miniaturas Reales */}
              {/* Grid Fotográfico de Diapositivas y Paisajes (La Imagen es 100% la Protagonista, Sin Franjas Negras Gigantes) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 flex-1 min-h-0 overflow-y-auto pr-1 pb-2 content-start">
                {(subPestanaDiapositivas === 'iglesia' ? diapositivasIglesia : galeriaPaisajes).map((slide, idx) => {
                  const isCurrent = proyeccionActual?.id === slide.id && proyeccionActual?.tipo === 'imagen';
                  return (
                    <div
                      key={slide.id}
                      onClick={() => proyectarImagen(slide, idx)}
                      className={`group relative aspect-video w-full rounded-xl overflow-hidden border shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer bg-slate-950 select-none ${
                        isCurrent
                          ? 'border-amber-400 ring-4 ring-amber-400/50 scale-[1.02] shadow-amber-500/20'
                          : 'border-slate-800 hover:border-amber-400 hover:scale-[1.01]'
                      }`}
                      title={`Haz clic para proyectar inmediatamente: ${slide.titulo}`}
                    >
                      {/* Imagen 100% Completa que Llena Toda la Tarjeta sin Cortes */}
                      <img
                        src={slide.dataUrl}
                        alt={slide.titulo}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = obtenerFallbackArteSVG(slide.id, slide.titulo);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 pointer-events-none"
                      />

                      {/* Badge EN PANTALLA cuando está proyectada */}
                      {isCurrent && (
                        <div className="absolute top-2 left-2 bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20 pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                          <span>EN PANTALLA</span>
                        </div>
                      )}

                      {/* Botón de Papelera en la esquina superior derecha (No ocupa espacio) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagenAEliminar(slide);
                        }}
                        title="Eliminar diapositiva"
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-slate-300 hover:text-white transition z-20 backdrop-blur cursor-pointer shadow opacity-80 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Overlay translúcido al pasar el ratón para confirmar proyección */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none z-10">
                        <div className="px-3 py-1.5 rounded-xl bg-blue-600/90 text-white font-black text-xs shadow-2xl flex items-center gap-1.5 backdrop-blur">
                          <Monitor className="w-4 h-4 text-amber-400" />
                          <span>Proyectar en TV</span>
                        </div>
                      </div>

                      {/* Cinta Inferior Mínima y Translúcida con Título y Botón */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-4 pb-1.5 px-2.5 flex items-center justify-between gap-1.5 z-20">
                        <span
                          className="text-[11px] font-bold text-white truncate drop-shadow flex-1 leading-tight"
                          title={slide.titulo}
                        >
                          {slide.titulo}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            proyectarImagen(slide, idx);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 shadow cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          <Monitor className="w-3 h-3" />
                          <span>{isCurrent ? 'Activa' : 'Proyectar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sección de Avisos de Texto Rápido */}
              <div className={`mt-2 pt-2 border-t space-y-2 flex-shrink-0 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Plantillas de Avisos de Culto (Texto):</span>
                  <span className="text-[11px] text-slate-500">Haz clic para rellenar rápido</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Bienvenida', texto: '¡Bienvenidos a la Casa de Dios!\nIglesia Cristiana Cuadrangular Las Brisas' },
                    { label: 'Diezmos y Ofrendas', texto: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre."\n— 2 Corintios 9:7' },
                    { label: 'Santa Cena', texto: '"Haced esto en memoria de mí"\n— 1 Corintios 11:24' },
                    { label: 'Cultos', texto: 'Nuestros Cultos:\nMiércoles 7:00 PM | Sábado 6:00 PM | Domingo 9:30 AM' }
                  ].map((plantilla, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTextoLibre(plantilla.texto)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        temaOperador === 'claro'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {plantilla.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={textoLibre}
                    onChange={(e) => setTextoLibre(e.target.value)}
                    placeholder="Escribe aquí cualquier aviso de culto personalizado..."
                    className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none ${
                      temaOperador === 'claro'
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                    }`}
                  ></textarea>

                  <button
                    onClick={proyectarTextoManual}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer self-stretch flex items-center justify-center"
                  >
                    Proyectar Texto
                  </button>
                </div>
              </div>
            </div>

            {/* Monitor de Escena & Previsualización (4 cols) */}
            <div className={`xl:col-span-4 border rounded-2xl p-3 shadow-xl space-y-2.5 flex flex-col justify-between overflow-y-auto ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="space-y-3">
                <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-emerald-500" />
                    <span>Monitor de Salida (Proyector)</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBlackout ? 'bg-rose-500/20 text-rose-400' : proyeccionActual ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isBlackout ? 'BLACKOUT' : proyeccionActual ? 'EN PANTALLA' : 'EN ESPERA'}
                  </span>
                </div>

                {/* Controles de Ajuste de Imagen y Contraste de Letras para Diapositivas & Canva */}
                <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                }`}>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-300">Ajuste de Imagen:</span>
                    <div className="grid grid-cols-3 rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs text-center">
                      <button
                        onClick={() => cambiarModoAjusteDiapositiva('contain')}
                        className={`px-1.5 py-1 rounded font-bold transition cursor-pointer truncate ${
                          modoAjusteDiapositiva === 'contain' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Muestra la imagen completa centrada sin cortar nada (ideal para afiches)"
                      >
                        🎯 Completar, no cortar
                      </button>
                      <button
                        onClick={() => cambiarModoAjusteDiapositiva('cover')}
                        className={`px-1.5 py-1 rounded font-bold transition cursor-pointer truncate ${
                          modoAjusteDiapositiva === 'cover' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Rellena toda la pantalla panorámica 16:9 recortando bordes"
                      >
                        📐 Rellenar pantalla
                      </button>
                      <button
                        onClick={() => cambiarModoAjusteDiapositiva('fill')}
                        className={`px-1.5 py-1 rounded font-bold transition cursor-pointer truncate ${
                          modoAjusteDiapositiva === 'fill' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Ajusta a pantalla completa 100% eliminando franjas negras en TV"
                      >
                        ↔️ Pantalla completa
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-300">Filtro Oscuro para Letras:</span>
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      {[
                        { val: 0, label: '0%' },
                        { val: 0.3, label: '30%' },
                        { val: 0.45, label: '45% (Óptimo)' },
                        { val: 0.65, label: '65%' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => cambiarOscurecedorDiapositiva(opt.val)}
                          className={`py-1 rounded font-bold border transition cursor-pointer text-center ${
                            oscurecedorDiapositiva === opt.val
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-h-[220px] aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-0 relative">
                  {isBlackout ? (
                    <span className="text-xs font-mono text-slate-600 font-bold uppercase tracking-widest">
                      PANTALLA NEGRA (BLACKOUT)
                    </span>
                  ) : proyeccionActual?.tipo === 'imagen' && proyeccionActual.url ? (
                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                      <img
                        src={proyeccionActual.url}
                        alt="Proyección Activa"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = obtenerFallbackArteSVG(proyeccionActual.id || '', proyeccionActual.titulo || proyeccionActual.texto || 'Diapositiva');
                        }}
                        style={{
                          objectFit: modoAjusteDiapositiva,
                          width: '100%',
                          height: '100%'
                        }}
                        className="w-full h-full transition-all duration-200"
                      />
                      {oscurecedorDiapositiva > 0 && (
                        <div
                          className="absolute inset-0 pointer-events-none transition-all duration-200"
                          style={{ backgroundColor: `rgba(0, 0, 0, ${oscurecedorDiapositiva})` }}
                        />
                      )}
                    </div>
                  ) : proyeccionActual?.texto ? (
                    <div className="p-3 text-center text-white text-xs font-bold whitespace-pre-line leading-relaxed">
                      {proyeccionActual.texto}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Ningún contenido proyectado</span>
                  )}
                </div>

                <div className={`p-3 rounded-xl border text-xs space-y-1.5 text-slate-400 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="font-bold block text-slate-300">💡 Atajos de Teclado:</span>
                  <p>• Flechas <strong>Derecha ➡ / Izquierda ⬅</strong>: Avanza o retrocede entre tus flyers de Canva.</p>
                  <p>• Tecla <strong>B</strong>: Pantalla Negra inmediata (Blackout).</p>
                  <p>• Tecla <strong>C</strong>: Limpia la pantalla y vuelve a la portada.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={toggleBlackout}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer"
                >
                  Blackout (B)
                </button>
                <button
                  onClick={limpiarPantalla}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 transition cursor-pointer"
                >
                  Limpiar (C)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 8: CONFIGURACIÓN Y AJUSTES ==================== */}
        {moduloActivo === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0 flex-1 overflow-y-auto pr-1">
            
            {/* Opciones de Tipografía y Proyector (6 cols) */}
            <div className={`lg:col-span-6 border rounded-2xl p-5 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <h2 className={`font-bold text-base border-b pb-3 flex items-center gap-2 ${
                temaOperador === 'claro' ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
              }`}>
                <Type className="w-5 h-5 text-amber-500" />
                <span>Tipografía y Estilo de la Proyección</span>
              </h2>

              {/* Selector de Fuente con fuentes offline nativas de Windows */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Tipo de Letra en Pantalla (Fuente Offline Windows)</label>
                <select
                  value={fuenteProyector}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFuenteProyector(val);
                    localStorage.setItem('lbc_fuente', val);
                    emitirAjustesProyector({ fuente: val });
                    mostrarToast('Tipo de letra actualizado en el proyector');
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none ${
                    temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {FUENTES_SISTEMA.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Color del Texto */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Color del Texto Proyectado</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Blanco Puro', color: '#ffffff' },
                    { label: 'Dorado Cálido', color: '#fbbf24' },
                    { label: 'Amarillo Suave', color: '#fef08a' },
                    { label: 'Celeste Cielo', color: '#7dd3fc' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => {
                        setColorTextoProyector(c.color);
                        localStorage.setItem('lbc_color_texto', c.color);
                        emitirAjustesProyector({ colorTexto: c.color });
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        colorTextoProyector === c.color ? 'ring-2 ring-blue-500 border-white shadow-md' : 'border-slate-700 bg-slate-900'
                      }`}
                      style={{ color: c.color }}
                    >
                      <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: c.color }}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sombra de Texto y Alineación */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <label className="text-xs font-bold block">Sombra de Texto (Contraste)</label>
                  <button
                    onClick={() => {
                      const nuevo = !sombraTexto;
                      setSombraTexto(nuevo);
                      localStorage.setItem('lbc_sombra', String(nuevo));
                      emitirAjustesProyector({ sombraTexto: nuevo });
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      sombraTexto ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sombraTexto ? '✓ Sombra Activada' : 'Sin Sombra'}
                  </button>
                </div>

                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <label className="text-xs font-bold block">Alineación del Texto</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        setAlineacionProyector('center');
                        localStorage.setItem('lbc_alineacion', 'center');
                        emitirAjustesProyector({ alineacion: 'center' });
                      }}
                      className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        alineacionProyector === 'center' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Centrado
                    </button>
                    <button
                      onClick={() => {
                        setAlineacionProyector('left');
                        localStorage.setItem('lbc_alineacion', 'left');
                        emitirAjustesProyector({ alineacion: 'left' });
                      }}
                      className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        alineacionProyector === 'left' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Izquierda
                    </button>
                  </div>
                </div>
              </div>

              {/* Previsualización del Estilo en Tiempo Real */}
              <div className="p-4 rounded-xl bg-black border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                  Vista Previa del Estilo (Cambia según tu selección)
                </span>
                <p
                  style={{
                    fontFamily: fuenteProyector,
                    color: colorTextoProyector,
                    textAlign: alineacionProyector,
                    textShadow: sombraTexto ? '0 4px 18px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' : 'none'
                  }}
                  className="text-lg font-bold leading-relaxed transition-all"
                >
                  "Jehová es mi pastor; nada me faltará."
                </p>
                <span className="text-xs text-amber-400 font-bold block uppercase">— Salmos 23:1 (RV1960)</span>
              </div>
            </div>

            {/* Opciones de Interfaz & Congregación (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Personalización de la Iglesia */}
              <div className={`border rounded-2xl p-5 shadow-xl space-y-3 ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>Datos de la Congregación</span>
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Nombre de la Iglesia / Sede</label>
                  <input
                    type="text"
                    value={nombreCongregacion}
                    onChange={(e) => {
                      setNombreCongregacion(e.target.value);
                      localStorage.setItem('lbc_nombre_iglesia', e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                {/* Tema Operador */}
                <div className={`flex items-center justify-between pt-2 border-t ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className="text-xs font-semibold">Tema del Panel de Operador</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setTemaOperador('oscuro');
                        localStorage.setItem('lbc_tema', 'oscuro');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        temaOperador === 'oscuro' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Oscuro</span>
                    </button>
                    <button
                      onClick={() => {
                        setTemaOperador('claro');
                        localStorage.setItem('lbc_tema', 'claro');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        temaOperador === 'claro' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Claro</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas y Diagnóstico */}
              <div className={`border rounded-2xl p-5 shadow-xl space-y-3 ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span>Base de Datos y Almacenamiento Local</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="font-extrabold text-amber-500 text-sm block">{repertorio.length} Canciones</span>
                    <span className="text-slate-400 text-[11px]">Guardadas en memoria local</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="font-extrabold text-teal-500 text-sm block">66 Libros Bíblicos</span>
                    <span className="text-slate-400 text-[11px]">Indexados para proyección</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(repertorio, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "Cancionero_Respaldo_ICC.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      mostrarToast('Copia de respaldo descargada en JSON');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      temaOperador === 'claro'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Respaldo JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('¿Deseas restaurar el cancionero inicial predeterminado?')) {
                        localStorage.removeItem('proyector_lbc_canciones');
                        setRepertorio(INITIAL_FEATURED_SONGS);
                        mostrarToast('Cancionero restaurado a valores iniciales');
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                  >
                    Restablecer
                  </button>
                </div>

                {/* Descarga completa del código y archivos para Windows */}
                <div className="pt-1">
                  <a
                    href="/Proyector-LBC-Completo.zip"
                    download="Proyector-LBC-Completo.zip"
                    onClick={() => mostrarToast('Descargando Proyector-LBC-Completo.zip (9 MB)...', 'info')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Proyecto Completo con Scripts Windows (.ZIP - 9 MB)</span>
                  </a>
                </div>
              </div>

              {/* Atajos de Teclado */}
              <div className={`border rounded-2xl p-4 shadow-xl space-y-2 ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className="font-bold text-xs block">Atajos de Teclado del Operador de Culto:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">➡ Flecha Derecha</strong>: Siguiente Estrofa</div>
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">⬅ Flecha Izquierda</strong>: Estrofa Anterior</div>
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">B / F5</strong>: Pantalla Negra (Blackout)</div>
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">C / F4</strong>: Limpiar Texto de Pantalla</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 8: OBS STUDIO ==================== */}
        {moduloActivo === 'obs' && (
          <ObsPanel
            temaOperador={temaOperador}
            proyeccionActual={proyeccionActual}
            enviarAlProyector={enviarAlProyector}
            mostrarToast={mostrarToast}
          />
        )}

      </main>

      {/* ==================== MODAL DE AYUDA Y ATALOS ==================== */}
      <HelpModal
        abierto={mostrarAyuda}
        alCerrar={() => setMostrarAyuda(false)}
        temaOperador={temaOperador}
        alAbrirObs={() => setModuloActivo('obs')}
      />

      {/* Modal: Nueva Canción */}
      {mostrarModalNuevaCancion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#222831] border border-[#D6AD62]/35 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl shadow-black/40">
            <h3 className="text-base font-black tracking-wide text-[#D6AD62]"> Registrar Nueva Alabanza </h3>
            <div className="space-y-2">
              <input
                type="text"
                value={nuevaTitulo}
                onChange={(e) => setNuevaTitulo(e.target.value)}
                placeholder="Título de la alabanza (ej: Al que está sentado en el trono)..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#46515F] bg-[#171A20] text-[#F1F3F5] text-sm placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] focus:ring-1 focus:ring-[#D6AD62]/30 transition"
              />
                {errorNuevaCancion && (
                <p className="text-[11px] font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">
                  Ingresa un título para la canción.
                </p>
              )}
              <input
                type="text"
                value={nuevaAutor}
                onChange={(e) => setNuevaAutor(e.target.value)}
                placeholder="Autor o ministerio (opcional)..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#46515F] bg-[#171A20] text-[#F1F3F5] text-sm placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] focus:ring-1 focus:ring-[#D6AD62]/30 transition"
              />
              <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#171A20] p-2.5 rounded-xl border border-[#303946]">
  <span className="text-[11px] text-[#AAB4C0] font-medium">Marcadores rápidos:</span>
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={() => insertarMarcador('CORO', nuevaLetraRef.current, setNuevaLetra)}
      className="px-2.5 py-1 rounded-lg bg-[#303946] border border-[#46515F] text-[#D6AD62] hover:bg-[#394554] hover:border-[#D6AD62] text-[11px] font-bold transition cursor-pointer"
    >
      + [CORO]
    </button>
    <button
      type="button"
      onClick={() => insertarMarcador('ESTROFA', nuevaLetraRef.current, setNuevaLetra)}
      className="px-2.5 py-1 rounded-lg bg-[#303946] border border-[#46515F] text-[#D6AD62] hover:bg-[#394554] hover:border-[#D6AD62] text-[11px] font-bold transition cursor-pointer"
    >
      + [ESTROFA]
    </button>
    <button
      type="button"
      onClick={() => insertarMarcador('PUENTE', nuevaLetraRef.current, setNuevaLetra)}
      className="px-2.5 py-1 rounded-lg bg-[#303946] border border-[#46515F] text-[#D6AD62] hover:bg-[#394554] hover:border-[#D6AD62] text-[11px] font-bold transition cursor-pointer"
    >
      + [PUENTE]
    </button>
  </div>
</div>
              <textarea
              ref={nuevaLetraRef}
              rows={8}
              value={nuevaLetra}
                onChange={(e) => setNuevaLetra(e.target.value)}
                placeholder="Pega o escribe aquí la letra completa de la canción..."
                className="w-full min-h-[180px] px-3 py-3 rounded-xl border border-[#46515F] bg-[#171A20] text-[#F1F3F5] text-sm placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] focus:ring-1 focus:ring-[#D6AD62]/30 transition resize-y"
              ></textarea>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarModalNuevaCancion(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#303946] border border-[#46515F] hover:border-[#AAB4C0] hover:bg-[#394554] text-[#F1F3F5] font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
if (!nuevaTitulo.trim()) {
setErrorNuevaCancion(true);
return;
}

setErrorNuevaCancion(false);
// Parsear bloques separados por renglón vacío y reconocer marcadores
const rawSections = nuevaLetra.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
let contadorEstrofa = 1;

const sections: SongSection[] = rawSections.map(bloque => {
  const rawLines = bloque.split('\n').map(l => l.trim()).filter(Boolean);
  let label = '';
  let type: SongSection['type'] = 'verse';
  let lines = rawLines;

  if (rawLines.length > 0) {
    const firstLine = rawLines[0];
    const matchTag = firstLine.match(/^\[(coro|chorus|puente|bridge|estrofa|verso)\]:?$/i);

    if (matchTag) {
      const tag = matchTag[1].toLowerCase();

      if (tag === 'coro' || tag === 'chorus') {
        type = 'chorus';
        label = 'Coro';
      } else if (tag === 'puente' || tag === 'bridge') {
        type = 'bridge';
        label = 'Puente';
      } else {
        type = 'verse';
        label = `Estrofa ${contadorEstrofa++}`;
      }

      lines = rawLines.slice(1);
    } else if (firstLine.toLowerCase().includes('coro')) {
      type = 'chorus';
      label = 'Coro';
    }
  }

  if (!label) {
    label = `Estrofa ${contadorEstrofa++}`;
  }

  return {
    label,
    type,
    lines
  };
});
                  const nueva: Song = {
                    id: `cancion-local-${Date.now()}`,
                    title: nuevaTitulo.trim(),
                    author: nuevaAutor.trim() || 'Desconocido',
                    sections: sections.length > 0 ? sections : [{ label: 'Verso 1', type: 'verse', lines: [nuevaLetra] }]
                  };
                  const nuevaLista = [nueva, ...repertorio];
                  setRepertorio(nuevaLista);
                  setCancionSeleccionada(nueva);
                  localStorage.setItem('proyector_lbc_canciones', JSON.stringify(nuevaLista));
                  setMostrarModalNuevaCancion(false);
                  setNuevaTitulo('');
                  setNuevaAutor('');
                  setNuevaLetra('');
                  mostrarToast(`¡Canción "${nueva.title}" registrada exitosamente!`);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#D6AD62] hover:bg-[#E3BD7B] text-[#171A20] font-black text-xs transition shadow-lg shadow-black/20 cursor-pointer"
              >
                Guardar Canción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Canción y Letras */}
      {mostrarModalEditarCancion && cancionEditando && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#222831] border border-[#D6AD62]/35 rounded-2xl p-5 max-w-xl w-full space-y-4 shadow-2xl shadow-black/40 text-left max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#303946] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D6AD62]/15 text-[#D6AD62] border border-[#D6AD62]/30">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide text-[#D6AD62]">Editar Letra & Estrofas</h3>
                  <p className="text-[11px] text-[#AAB4C0]">
                    Modifica el título, autor o separa las estrofas para la proyección
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalEditarCancion(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Título de la Alabanza
                  </label>
                  <input
                    type="text"
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    placeholder="Título de la alabanza..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#46515F] bg-[#171A20] text-[#F1F3F5] text-sm placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] focus:ring-1 focus:ring-[#D6AD62]/30 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Autor / Ministerio (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editAutor}
                    onChange={(e) => setEditAutor(e.target.value)}
                    placeholder="Autor o ministerio..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#46515F] bg-[#171A20] text-[#F1F3F5] text-sm placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] focus:ring-1 focus:ring-[#D6AD62]/30 transition"
                  />
                </div>
              </div>

{/* Botones de ayuda rápida para insertar etiquetas de estrofas */}
<div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#171A20] p-2.5 rounded-xl border border-[#303946]">
<span className="text-[11px] text-[#AAB4C0] font-medium">Marcadores rápidos:</span>
<div className="flex items-center gap-1.5">
<button
type="button"
onClick={() => insertarMarcador('CORO', editLetraRef.current, setEditLetra)}
className="px-2.5 py-1 rounded-lg bg-[#303946] border border-[#46515F] text-[#D6AD62] hover:bg-[#394554] hover:border-[#D6AD62] text-[11px] font-bold transition cursor-pointer"
>
+ [CORO]
</button>
<button
type="button"
onClick={() => insertarMarcador('ESTROFA', editLetraRef.current, setEditLetra)}
className="px-2.5 py-1 rounded-lg bg-[#303946] border border-[#46515F] text-[#D6AD62] hover:bg-[#394554] hover:border-[#D6AD62] text-[11px] font-bold transition cursor-pointer"
>
+ [ESTROFA]
</button>
<button
  type="button"
  onClick={() => insertarMarcador('PUENTE', editLetraRef.current, setEditLetra)}
  className="px-2.5 py-1 rounded-lg bg-[#303946] border border-[#46515F] text-[#D6AD62] hover:bg-[#394554] hover:border-[#D6AD62] text-[11px] font-bold transition cursor-pointer"
>
  + [PUENTE]
</button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Letra Completa & Estrofas
                  </label>
                  <span className="text-[10px] text-slate-500">
                    💡 Deja un renglón en blanco (doble Enter) entre cada estrofa
                  </span>
                </div>
                <textarea
                ref={editLetraRef}
                rows={10}
                value={editLetra}
                  onChange={(e) => setEditLetra(e.target.value)}
                  placeholder="Escribe o pega la letra aquí. Separa cada estrofa con un espacio en blanco..."
                  className="w-full min-h-[180px] p-3 bg-[#171A20] border border-[#46515F] rounded-xl text-sm text-[#F1F3F5] placeholder:text-[#778391] focus:outline-none focus:border-[#D6AD62] focus:ring-1 focus:ring-[#D6AD62]/30 font-mono leading-relaxed transition resize-y"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#303946] pt-3">
              <button
                type="button"
                onClick={eliminarCancionActual}
                className="px-3 py-2 rounded-xl bg-[#3A2528] border border-[#8B454B] hover:bg-[#513035] text-[#F0A5A5] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Eliminar permanentemente esta canción del cancionero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Canción</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalEditarCancion(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#303946] border border-[#46515F] hover:border-[#AAB4C0] hover:bg-[#394554] text-[#F1F3F5] font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarEdicionCancion}
                  className="px-5 py-2.5 rounded-xl bg-[#D6AD62] hover:bg-[#E3BD7B] text-[#171A20] font-black text-xs shadow-lg shadow-black/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal: Confirmar eliminación de canción */}
      {mostrarConfirmarEliminarCancion && cancionEditando && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#222831] border border-[#8B454B]/60 rounded-2xl p-5 max-w-md w-full shadow-2xl shadow-black/50">

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#3A2528] border border-[#8B454B]/50 text-[#F0A5A5]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#F0A5A5]">
                  Eliminar canción
                </h3>
                <p className="text-[11px] text-[#AAB4C0]">
                  Confirmación de eliminación
                </p>
              </div>
            </div>

            <p className="text-sm text-[#F1F3F5] leading-relaxed mb-2">
              ¿Estás seguro de que deseas eliminar esta canción del cancionero?
            </p>

            <div className="bg-[#171A20] border border-[#303946] rounded-xl p-3 mb-5">
              <p className="text-sm font-bold text-[#D6AD62] break-words">
                {cancionEditando.title}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmarEliminarCancion(false)}
                className="px-4 py-2.5 rounded-xl bg-[#303946] border border-[#46515F] hover:border-[#AAB4C0] hover:bg-[#394554] text-[#F1F3F5] font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminarCancion}
                className="px-4 py-2.5 rounded-xl bg-[#8B454B] hover:bg-[#A6535A] text-white font-black text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                Eliminar canción
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Canción con Aceptar y Cancelar */}
      {cancionAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 ${
            temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
          }`}>
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">¿Deseas eliminar esta canción?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Esta acción quitará la canción de tu repertorio.</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              temaOperador === 'claro' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <p className="text-sm font-bold text-amber-400">{cancionAEliminar.title}</p>
              {cancionAEliminar.author && (
                <p className="text-xs text-slate-400">{cancionAEliminar.author}</p>
              )}
              <p className="text-[11px] text-slate-500 font-mono">{cancionAEliminar.sections.length} partes / estrofas</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancionAEliminar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarCancionDelRepertorio(cancionAEliminar.id);
                  setCancionAEliminar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Aceptar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación: Eliminar Diapositiva / Imagen */}
      {imagenAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">¿Deseas eliminar esta diapositiva?</h3>
                <p className="text-xs text-slate-400">Esta acción quitará la imagen de tu lista de proyección.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/50 border border-slate-800">
                <img src={imagenAEliminar.dataUrl} alt={imagenAEliminar.titulo} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-amber-400 truncate">{imagenAEliminar.titulo}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setImagenAEliminar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarImagen(imagenAEliminar.id);
                  setImagenAEliminar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Aceptar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación: Eliminar Pista de Audio Actual del Reproductor */}
      {mostrarModalEliminarPistaActual && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">¿Deseas eliminar la pista actual?</h3>
                <p className="text-xs text-slate-400">Se detendrá la reproducción y podrás subir una nueva canción.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <p className="text-xs font-bold text-amber-400 truncate">{karaokePistaNombre}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setMostrarModalEliminarPistaActual(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarPistaActual();
                  setMostrarModalEliminarPistaActual(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Aceptar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación: Quitar Pista del Setlist de Pistas */}
      {karaokeItemAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">¿Deseas quitar esta pista del setlist?</h3>
                <p className="text-xs text-slate-400">Se quitará de la lista de pistas del culto.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="text-xs font-bold text-teal-300 truncate">{karaokeItemAEliminar.item.songTitle}</p>
              <p className="text-[11px] text-slate-400 truncate font-mono">{karaokeItemAEliminar.item.pistaNombre || 'Pista de alabanza'}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setKaraokeItemAEliminar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmarEliminarKaraokeDeSetlist(karaokeItemAEliminar.index);
                  setKaraokeItemAEliminar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Aceptar y Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      
{/* Footer */}
<footer className={`border-t flex-shrink-0 py-1.5 px-4 text-center text-[10px] flex items-center justify-between gap-2 ${
  temaOperador === 'claro' ? 'border-slate-300 bg-white text-slate-600' : 'border-slate-800/60 bg-slate-950 text-slate-500'
}`}>
  <span>
    © {new Date().getFullYear()} · Todos los derechos reservados.
  </span>
  <span className="text-[#D6AD62] font-semibold">
    Proyector para Iglesias
  </span>
</footer>

    </div>
  );
}