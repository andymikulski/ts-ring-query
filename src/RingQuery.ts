import { IEntity, Vector2Like } from "./main";


class BoxQuery {
  constructor(private entities: IEntity[] = []) { }

  public insert(entity: IEntity) {
    this.entities.push(entity);
  }

  public query(x: number, y: number, w: number = 0.1, h: number = 0.1) {
    let result = [];
    for (let entity of this.entities) {
      if (entity.position.x >= x && entity.position.x <= x + w &&
        entity.position.y >= y && entity.position.y <= y + h) {
        result.push(entity);
      }
    }
    return result;
  }

  public getAll() {
    return this.entities;
  }
}


export default class RingQuery {
  private boxQuery: BoxQuery;
  constructor(entities: IEntity[], private center: Vector2Like = { x: 0, y: 0 }) {
    this.boxQuery = new BoxQuery([]);
    // convert entities to polar coordinates and
    entities.forEach((entity) => {
      const polar = this.cartesianToPolarFromOrigin(entity.position, center);
      this.boxQuery.insert({
        position: {
          x: polar.r,
          y: polar.theta,
        }
      });
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


  private polarToCartesian = (polar: Vector2Like) => {
    const x = polar.x * Math.cos(polar.y);
    const y = polar.x * Math.sin(polar.y);
    return { x, y };
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
      const res1 = this.boxQuery.query(distanceStart, angleStart, Math.abs(distanceEnd - distanceStart), firstAngle);

      const remainingAngle = (Math.PI * 2) - Math.abs(angleStart - angleEnd) - firstAngle;
      const res2 = this.boxQuery.query(distanceStart, 0, Math.abs(distanceEnd - distanceStart), remainingAngle);

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
    const res = this.boxQuery.query(distanceStart, angleStart, Math.abs(distanceEnd - distanceStart), Math.abs(angleEnd - angleStart));

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


    this.boxQuery.getAll().forEach((entity) => {
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


    // draw the "query ring" using the distance and angle variables
    // ctx.beginPath();
    // ctx.arc(this.center.x, this.center.y, distanceMin, angleMin, angleMax);
    // ctx.strokeStyle = 'blue';
    // ctx.stroke();
    // ctx.closePath();
    // ctx.beginPath();
    // ctx.arc(this.center.x, this.center.y, distanceMax, angleMin, angleMax);
    // ctx.strokeStyle = 'blue';
    // ctx.stroke();
    // ctx.closePath();

    // // connect the two arcs with straight lines
    // ctx.beginPath();
    // ctx.moveTo(this.center.x + distanceMin * Math.cos(angleMin), this.center.y + distanceMin * Math.sin(angleMin));
    // ctx.lineTo(this.center.x + distanceMax * Math.cos(angleMin), this.center.y + distanceMax * Math.sin(angleMin));
    // ctx.moveTo(this.center.x + distanceMin * Math.cos(angleMax), this.center.y + distanceMin * Math.sin(angleMax));
    // ctx.lineTo(this.center.x + distanceMax * Math.cos(angleMax), this.center.y + distanceMax * Math.sin(angleMax));
    // ctx.strokeStyle = 'blue';
    // ctx.stroke();
    // ctx.closePath();


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
