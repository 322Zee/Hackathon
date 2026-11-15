import { describe, it, expect } from 'vitest';
import { CameraTargetTracker, ICameraTarget } from '../../src/camera/CameraTarget';

describe('CameraTargetTracker (Follow Target, Deadzone, Lookahead)', () => {
  it('follows target position directly when deadzone is disabled', () => {
    const tracker = new CameraTargetTracker();
    const target: ICameraTarget = {
      getPosition: () => ({ x: 500, y: 300 }),
    };
    tracker.setTarget(target);

    const desired = tracker.computeDesiredPosition(0, 0, false, false, 0.016);
    expect(desired.x).toBe(500);
    expect(desired.y).toBe(300);
  });

  it('ignores camera movement when target is inside the deadzone box', () => {
    const tracker = new CameraTargetTracker();
    tracker.setDeadzone(100, 100);

    // Target is only 50px away from camera center (within 100px deadzone)
    const target: ICameraTarget = {
      getPosition: () => ({ x: 50, y: 30 }),
    };
    tracker.setTarget(target);

    const desired = tracker.computeDesiredPosition(0, 0, true, false, 0.016);
    // Camera center should remain at (0, 0)
    expect(desired.x).toBe(0);
    expect(desired.y).toBe(0);
  });

  it('moves camera by overflow amount when target leaves deadzone box', () => {
    const tracker = new CameraTargetTracker();
    tracker.setDeadzone(100, 100);

    // Target moves to x = 160 (60px past deadzone edge of 100)
    const target: ICameraTarget = {
      getPosition: () => ({ x: 160, y: 0 }),
    };
    tracker.setTarget(target);

    const desired = tracker.computeDesiredPosition(0, 0, true, false, 0.016);
    // Camera target becomes 160 - 100 = 60
    expect(desired.x).toBe(60);
    expect(desired.y).toBe(0);
  });

  it('projects lookahead along velocity vector', () => {
    const tracker = new CameraTargetTracker();
    tracker.setLookahead({ leadTimeSeconds: 0.5, maxDistance: 200, smoothing: 1.0 });

    const movingTarget: ICameraTarget = {
      getPosition: () => ({ x: 1000, y: 500 }),
      getVelocity: () => ({ x: 200, y: 0 }), // 200 px/s to the right
    };
    tracker.setTarget(movingTarget);

    // Expected lead: 200 * 0.5s = 100px lookahead
    const desired = tracker.computeDesiredPosition(1000, 500, false, true, 1.0);
    expect(desired.x).toBeCloseTo(1100, 0);
    expect(desired.y).toBeCloseTo(500, 0);
  });
});
