class Benchmark {
  private timers: Map<string, { startTime: number, totalTime: number, count: number, minTime: number, maxTime: number }>;

  constructor() {
    this.timers = new Map();
  }

  // Starts a timer with a given name.
  timer(name: string): void {
    if (!this.timers.has(name)) {
      this.timers.set(name, { startTime: Date.now(), totalTime: 0, count: 0, minTime: Infinity, maxTime: -Infinity });
    } else {
      this.timers.get(name)!.startTime = Date.now();
    }
  }

  // Stops the timer and updates the statistics.
  timerStop(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      let elapsed = (Date.now() - timer.startTime);
      // convert elapsed from MS to microseconds
      elapsed *= 1000;

      timer.totalTime += elapsed;
      timer.count++;
      timer.minTime = Math.min(timer.minTime, elapsed);
      timer.maxTime = Math.max(timer.maxTime, elapsed);
      console.log(`Timer "${name}" not found.`);
    }
  }

  // Returns statistics for a given timer.
  getStats(name: string): { average: number, min: number, max: number } | null {
    const timer = this.timers.get(name);
    if (timer && timer.count > 0) {
      return {
        average: timer.totalTime / timer.count,
        min: timer.minTime,
        max: timer.maxTime
      };
    } else {
      console.log(`Stats for "${name}" not available.`);
      return null;
    }
  }
}

export default new Benchmark();