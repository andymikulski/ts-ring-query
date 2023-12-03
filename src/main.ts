type Vector2Like = { x: number, y: number };
interface IEntity { position: Vector2Like };

class Demo {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  entities: IEntity[];
  debugCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 800;
    this.canvas.height = 600;
    document.body.appendChild(this.canvas);


    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = this.canvas.width;
    debugCanvas.height = this.canvas.height;
    document.body.appendChild(debugCanvas);
    this.debugCtx = debugCanvas.getContext('2d');


    this.entities = [];

    this.spawnEntities();
    this.render();

  }

  private spawnEntities = () => {
    // for (let i = 0; i < 100; i++) {
    //   this.entities.push({
    //     position: {
    //       x: Math.random() * this.canvas.width,
    //       y: Math.random() * this.canvas.height,
    //     }
    //   });
    // }

    // spawn entities in a circle
    let radius = 200;
    const center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const position = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      }
      this.entities.push({
        position,
      });
    }

    radius = 25;
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const position = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      }
      this.entities.push({
        position,
      });
    }

    radius = 500;
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const position = {
        x: center.x + (Math.random() * radius) * Math.cos(angle),
        y: center.y + (Math.random() * radius) * Math.sin(angle),
      }
      this.entities.push({
        position,
      });
    }

    // spawn entities in a straight horizontal line
    // for (let i = 0; i < 100; i++) {
    //   this.entities.push({
    //     position: {
    //       x: i * 10,
    //       y: this.canvas.height / 2,
    //     }
    //   });
    // }

    // spawn entities in a straight vertical line
    // for (let i = 0; i < 100; i++) {
    //   this.entities.push({
    //     position: {
    //       x: this.canvas.width / 2,
    //       y: i * 10,
    //     }
    //   });
    // }
  }

  private render = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


    const ringQuery = new RingQuery(this.entities, { x: this.canvas.width / 2, y: this.canvas.height / 2 });
    // select all entities that are between 100 and 200 units away from the origin
    // const result = ringQuery.query(100, 200, 0, 2 * Math.PI);
    // console.log('result', result);

    this.ctx.fillStyle = 'black';
    for (let entity of this.entities) {
      this.ctx.beginPath();
      this.ctx.arc(entity.position.x, entity.position.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    ringQuery.render(this.ctx, this.debugCtx);
    ringQuery.render(this.ctx, this.debugCtx);
  }

  private polarToCartesian = (polar: Vector2Like) => {
    const x = polar.x * Math.cos(polar.y);
    const y = polar.x * Math.sin(polar.y);
    return { x, y };
  }
}



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


class RingQuery {
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
  }


  private polarToCartesian = (polar: Vector2Like) => {
    const x = polar.x * Math.cos(polar.y);
    const y = polar.x * Math.sin(polar.y);
    return { x, y };
  }


  private lastQuery = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
  public query(distanceStart: number, distanceEnd: number, angleStart: number, angleEnd: number): IEntity[] {
    this.lastQuery.x = distanceStart;
    this.lastQuery.y = angleStart;
    this.lastQuery.w = Math.abs(distanceEnd - distanceStart);
    this.lastQuery.h = Math.abs(angleEnd - angleStart);

    return this.boxQuery.query(distanceStart, angleStart, Math.abs(distanceEnd - distanceStart), Math.abs(angleEnd - angleStart))
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


    // use the box query, where X is the distance and Y is the angle from our center point
    const distanceMin = 0;
    const distanceMax = 250;
    const angleMin = Math.PI / 4;
    const angleMax = Math.PI; //0.1; //Math.PI * 2;

    // draw the "query ring" using the distance and angle variables
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, distanceMin, angleMin, angleMax);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, distanceMax, angleMin, angleMax);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
    ctx.closePath();

    // connect the two arcs with straight lines
    ctx.beginPath();
    ctx.moveTo(this.center.x + distanceMin * Math.cos(angleMin), this.center.y + distanceMin * Math.sin(angleMin));
    ctx.lineTo(this.center.x + distanceMax * Math.cos(angleMin), this.center.y + distanceMax * Math.sin(angleMin));
    ctx.moveTo(this.center.x + distanceMin * Math.cos(angleMax), this.center.y + distanceMin * Math.sin(angleMax));
    ctx.lineTo(this.center.x + distanceMax * Math.cos(angleMax), this.center.y + distanceMax * Math.sin(angleMax));
    ctx.strokeStyle = 'blue';
    ctx.stroke();
    ctx.closePath();



    console.time('query');
    const results = this.query(distanceMin, distanceMax, angleMin, angleMax); //this.query(distanceMin, angleMin, Math.abs(distanceMax - distanceMin), Math.abs(angleMax - angleMin));
    console.timeEnd('query');
    console.log('asdf', results.length);
    results.forEach((entity) => {
      // convert from polar to cartesian and draw
      const cartesian = this.polarToCartesian(entity.position);
      ctx.beginPath();
      ctx.arc(this.center.x + cartesian.x, this.center.y + cartesian.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.closePath();
    });


    // draw the query rect using this.lastQuery onto debugCtx
    debugCtx.beginPath();
    const y = this.lastQuery.y * 180 / Math.PI;
    const h = this.lastQuery.h * 180 / Math.PI;
    debugCtx.rect(this.lastQuery.x, y, this.lastQuery.w, h);
    debugCtx.strokeStyle = 'red';
    debugCtx.stroke();
    debugCtx.closePath();


  }
}













new Demo();
