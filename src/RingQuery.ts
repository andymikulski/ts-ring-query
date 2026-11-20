import SpatialHash from "./SpatialHash";
import { IEntity, Vector2Like } from "./main";

export default class RingQuery {
  entityHash = new SpatialHash<IEntity>(25, Math.PI / 2);

  constructor(entities: IEntity[], private center: Vector2Like = { x: 0, y: 0 }) {
    // convert entities to polar coordinates and
    entities.forEach((entity) => {
      const polar = this.cartesianToPolarFromOrigin(entity.position, center);
      this.entityHash.insert({
        position: {
          x: polar.r,
          y: polar.theta,
        }
      }, polar.r, polar.theta, 5, 5);
    });
  }

  private cartesianToPolarFromOrigin = (position: Vector2Like, fromOrigin: Vector2Like) => {
    // r is the distance from the origin
    const r = Math.sqrt(Math.pow(position.x - fromOrigin.x, 2) + Math.pow(position.y - fromOrigin.y, 2));
    // theta is the angle from the x axis
    let theta = Math.atan2(position.y - fromOrigin.y, position.x - fromOrigin.x);

    if (theta < 0) {
      theta += 2 * Math.PI;
    }

    return { r, theta };
  };

  private convertNegativeRadianToWithin2Pi = (radian: number) => {
    while (radian < 0) {
      radian += 2 * Math.PI;
    }
    return radian;
  }

  private convertRadianToWithin2Pi = (radian: number) => {
    while (radian > 2 * Math.PI) {
      radian -= 2 * Math.PI;
    }
    return radian;
  }

  private queryImpl = (x: number, y: number, w: number, h: number) => {
    const candidates = this.entityHash.query(x, y, w, h);
    const results = [];
    let pos;
    for (let i = 0; i < candidates.length; i++) {
      pos = candidates[i].position;
      if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
        results.push(candidates[i]);
      }
    }
    return results;
  }

  private lastQuery = [{
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }, {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }];
  public query(distanceStart: number, distanceEnd: number, angleStart: number, angleEnd: number): IEntity[] {

    angleStart = this.convertNegativeRadianToWithin2Pi(angleStart);
    angleEnd = this.convertNegativeRadianToWithin2Pi(angleEnd);


    // we may have to perform two queries here if the angle range wraps around 2pi
    if (angleStart >= angleEnd || angleEnd >= Math.PI * 2) {
      angleEnd = this.convertRadianToWithin2Pi(angleEnd);
      // first point is from angleStart to 2pi
      const firstAngle = Math.abs(2 * Math.PI - angleStart);
      const res1 = this.queryImpl(distanceStart, angleStart, Math.abs(distanceEnd - distanceStart), firstAngle);

      const remainingAngle = (Math.PI * 2) - Math.abs(angleStart - angleEnd) - firstAngle;
      const res2 = this.queryImpl(distanceStart, 0, Math.abs(distanceEnd - distanceStart), remainingAngle);

      this.lastQuery[0].x = distanceStart;
      this.lastQuery[0].y = angleStart;
      this.lastQuery[0].w = Math.abs(distanceEnd - distanceStart);
      this.lastQuery[0].h = firstAngle;

      this.lastQuery[1].x = distanceStart;
      this.lastQuery[1].y = 0;
      this.lastQuery[1].w = Math.abs(distanceEnd - distanceStart);
      this.lastQuery[1].h = remainingAngle;

      return [...res1, ...res2];
    } else {
      this.lastQuery[1].x = 0;
      this.lastQuery[1].y = 0;
      this.lastQuery[1].w = 0;
      this.lastQuery[1].h = 0;
    }

    this.lastQuery[0].x = distanceStart;
    this.lastQuery[0].y = angleStart;
    this.lastQuery[0].w = Math.abs(distanceEnd - distanceStart);
    this.lastQuery[0].h = Math.abs(angleEnd - angleStart);
    const res = this.queryImpl(distanceStart, angleStart, Math.abs(distanceEnd - distanceStart), Math.abs(angleEnd - angleStart));

    return res;
  }



  public render = (ctx: CanvasRenderingContext2D, debugCtx: CanvasRenderingContext2D) => {

    // draw a 'base line' to indicate where the "0" level is
    ctx.beginPath();
    ctx.moveTo(0, this.center.y);
    ctx.lineTo(ctx.canvas.width, this.center.y);
    ctx.moveTo(this.center.x, 0);
    ctx.lineTo(this.center.x, ctx.canvas.height);
    ctx.strokeStyle = 'rgba(255,122,0,0.25)';
    ctx.stroke();


    debugCtx.clearRect(0, 0, debugCtx.canvas.width, debugCtx.canvas.height);


    // print "distance" as an x-axis label in lower left on debugCtx
    debugCtx.font = '22px serif';
    debugCtx.fillStyle = 'black';
    debugCtx.fillText('Distance from origin →', 10, 360 + 24); //debugCtx.canvas.height - 5);
    // print "angle" as a y-axis label on the right side of debugCtx
    debugCtx.save();
    debugCtx.translate(25, 100);
    debugCtx.rotate(-Math.PI / 2);
    debugCtx.fillText('Angle from origin →', -250, 0);
    debugCtx.restore();


    this.entityHash.getAll().forEach((entity) => {
      debugCtx.beginPath();
      // convert Y from radians to degrees
      const y = entity.position.y * 180 / Math.PI;
      debugCtx.arc(25 + entity.position.x, y, 5, 0, 2 * Math.PI);
      debugCtx.strokeStyle = 'green';
      debugCtx.stroke();
    });

    // draw where the center point is
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,122,0,0.25)';
    ctx.fill();
    ctx.closePath();

    // draw the query rect using this.lastQuery onto debugCtx
    this.lastQuery.forEach(d => {
      debugCtx.beginPath();
      const y = d.y * 180 / Math.PI;
      const h = d.h * 180 / Math.PI;
      debugCtx.rect(25 + d.x, y, d.w, h);
      debugCtx.strokeStyle = 'red';
      debugCtx.stroke();
      debugCtx.closePath();
    })
  };
}
