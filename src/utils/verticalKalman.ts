export class VerticalKalmanFilter {
  private altitude = 0;
  private velocity = 0;
  private lastTimestamp: number | null = null;
  private accelBias = 0;
  private baroBias = 0;

  private alpha = 0.05;
  private accelNoiseCovariance = 0.1;
  private baroNoiseCovariance = 0.5;

  update(params: {
    baroHeight: number;
    gpsHeight?: number;
    linearAccelZ: number;
    timestamp: number;
  }) {
    const { baroHeight, gpsHeight, linearAccelZ, timestamp } = params;

    if (this.lastTimestamp == null) {
      this.lastTimestamp = timestamp;
      this.altitude = gpsHeight ?? baroHeight;
      this.velocity = 0;
      this.baroBias = 0;
      return;
    }

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;

    if (dt <= 0 || dt > 1) {
      this.altitude = gpsHeight ?? baroHeight;
      this.velocity = 0;
      return;
    }

    const a = linearAccelZ - this.accelBias;
    this.velocity += a * dt;
    let predictedAlt = this.altitude + this.velocity * dt;

    let fusedAlt = predictedAlt;
    if (gpsHeight) {
      const gpsWeight = 0.3;
      fusedAlt =
        (1 - gpsWeight) *
          ((1 - this.alpha) * predictedAlt + this.alpha * baroHeight) +
        gpsWeight * gpsHeight;
    } else {
      fusedAlt = (1 - this.alpha) * predictedAlt + this.alpha * baroHeight;
    }

    this.altitude = fusedAlt;
    this.baroBias += (baroHeight - this.altitude) * 0.0001;
  }

  getAltitude(): number {
    return this.altitude;
  }

  getVerticalVelocity(): number {
    return this.velocity;
  }

  reset() {
    this.altitude = 0;
    this.velocity = 0;
    this.lastTimestamp = null;
    this.baroBias = 0;
  }
}
