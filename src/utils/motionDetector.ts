export class MotionDetector {
  private accelHistory: Array<{ x: number; y: number; z: number; time: number }> = [];
  private threshold = 2.0; // Increased from 0.5 to reduce sensitivity
  private windowSize = 10; // Increased from 5 for better smoothing

  addReading(x: number, y: number, z: number, timestamp: number) {
    this.accelHistory.push({ x, y, z, time: timestamp });
    if (this.accelHistory.length > this.windowSize * 2) {
      this.accelHistory.shift();
    }
  }

  isMoving(): boolean {
    if (this.accelHistory.length < this.windowSize) return false;

    const recent = this.accelHistory.slice(-this.windowSize);
    const variance = this.computeVariance(recent);
    return variance > this.threshold;
  }

  private computeVariance(readings: typeof this.accelHistory): number {
    const mags = readings.map((r) => Math.sqrt(r.x ** 2 + r.y ** 2 + r.z ** 2));
    const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
    const variance =
      mags.reduce((sum, m) => sum + (m - mean) ** 2, 0) / mags.length;
    return variance;
  }

  getVelocityEstimate(): number {
    if (this.accelHistory.length < 2) return 0;
    const last = this.accelHistory[this.accelHistory.length - 1];
    const first = this.accelHistory[0];
    const dt = (last.time - first.time) / 1000;
    if (dt === 0) return 0;

    const magLast = Math.sqrt(last.x ** 2 + last.y ** 2 + last.z ** 2);
    const magFirst = Math.sqrt(first.x ** 2 + first.y ** 2 + first.z ** 2);
    return (magLast - magFirst) / dt;
  }
}
