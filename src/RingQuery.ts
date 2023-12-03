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


  private lastQuery = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
  public query(distanceStart: number, distanceEnd: number, angleStart: number, angleEnd: number): IEntity[] {
    console.time('query');
    this.lastQuery.x = distanceStart;
    this.lastQuery.y = angleStart;
    this.lastQuery.w = Math.abs(distanceEnd - distanceStart);
    this.lastQuery.h = Math.abs(angleEnd - angleStart);



    const res = this.boxQuery.query(distanceStart, angleStart, Math.abs(distanceEnd - distanceStart), Math.abs(angleEnd - angleStart));
    console.timeEnd('query');
    return res;
  }



  public render = (ctx: CanvasRenderingContext2D, debugCtx: CanvasRenderingContext2D) => {

    // draw a 'base line' to indicate where the "0" level is
    ctx.beginPath();
    ctx.moveTo(0, this.center.y);
    ctx.lineTo(ctx.canvas.width, this.center.y);
    ctx.moveTo(this.center.x, 0);
    ctx.lineTo(this.center.x, ctx.canvas.height);
    ctx.strokeStyle = 'orange';
    ctx.stroke();


    debugCtx.clearRect(0, 0, debugCtx.canvas.width, debugCtx.canvas.height);

    this.boxQuery.getAll().forEach((entity) => {
      debugCtx.beginPath();
      // convert Y from radians to degrees
      const y = entity.position.y * 180 / Math.PI;
      debugCtx.arc(entity.position.x, y, 5, 0, 2 * Math.PI);
      debugCtx.strokeStyle = 'green';
      debugCtx.stroke();
    });

    // draw where the center point is
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'orange';
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
    debugCtx.beginPath();
    const y = this.lastQuery.y * 180 / Math.PI;
    const h = this.lastQuery.h * 180 / Math.PI;
    debugCtx.rect(this.lastQuery.x, y, this.lastQuery.w, h);
    debugCtx.strokeStyle = 'red';
    debugCtx.stroke();
    debugCtx.closePath();


  };
}
