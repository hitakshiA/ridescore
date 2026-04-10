/** Fixed-size circular buffer for sliding window signal processing. */
export class RingBuffer {
  private buffer: Float64Array;
  private head = 0;
  private _count = 0;

  constructor(public readonly capacity: number) {
    this.buffer = new Float64Array(capacity);
  }

  push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this._count < this.capacity) this._count++;
  }

  get count(): number { return this._count; }
  get isFull(): boolean { return this._count === this.capacity; }

  /** Return contents in chronological order. */
  toArray(): Float64Array {
    if (this._count < this.capacity) {
      return this.buffer.slice(0, this._count);
    }
    const result = new Float64Array(this.capacity);
    const tail = this.head; // oldest element
    result.set(this.buffer.subarray(tail), 0);
    result.set(this.buffer.subarray(0, tail), this.capacity - tail);
    return result;
  }

  /** Return the last N values (most recent). */
  last(n: number): Float64Array {
    const count = Math.min(n, this._count);
    const result = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const idx = (this.head - count + i + this.capacity) % this.capacity;
      result[i] = this.buffer[idx];
    }
    return result;
  }

  /** Get value at logical index (0 = oldest). */
  get(index: number): number {
    if (this._count < this.capacity) return this.buffer[index];
    return this.buffer[(this.head + index) % this.capacity];
  }

  clear(): void {
    this.head = 0;
    this._count = 0;
  }
}
