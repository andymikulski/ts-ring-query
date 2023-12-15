import RingQuery from "./RingQuery";

export type Vector2Like = { x: number, y: number };
export interface IEntity { position: Vector2Like };

class Demo {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  entities: IEntity[];
  debugCtx: CanvasRenderingContext2D;
  ringQuery: RingQuery;
  center: { x: number; y: number; };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 800;
    this.canvas.height = 800;
    document.body.appendChild(this.canvas);


    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = this.canvas.width;
    debugCanvas.height = this.canvas.height;
    document.body.appendChild(debugCanvas);
    debugCanvas.style.position = 'relative';
    debugCanvas.style.top = '125px';
    this.debugCtx = debugCanvas.getContext('2d');


    this.entities = [];

    this.spawnEntities();
    this.runQuery();
    this.render();
    this.bindMouseEvents();
  }

  private spawnEntities = () => {

    // spawn entities in a circle
    let radius = 200;
    this.center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    // for (let i = 0; i < 100; i++) {
    //   // const angle = Math.random() * Math.PI * 2;
    //   const angle = i * Math.PI * 2 / 100;
    //   const position = {
    //     x: this.center.x + radius * Math.cos(angle),
    //     y: this.center.y + radius * Math.sin(angle),
    //   }
    //   this.entities.push({
    //     position,
    //   });
    // }

    // radius = 125;
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const position = {
        x: this.center.x + radius * Math.cos(angle),
        y: this.center.y + radius * Math.sin(angle),
      }
      this.entities.push({
        position,
      });
    }

    radius = 500;
    for (let i = 0; i < 2050; i++) {
      const angle = Math.random() * Math.PI * 2;
      const position = {
        x: this.center.x + (Math.random() * radius) * Math.cos(angle),
        y: this.center.y + (Math.random() * radius) * Math.sin(angle),
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

  private mousePos = { x: 0, y: 0 };
  private ringSize = { min: 0, max: 100 };
  private sliceSize = Math.PI / 4;

  private bindMouseEvents = () => {
    this.canvas.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
      this.render();
      this.runQuery();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.ringSize.min -= 10;
      }
      if (e.key === 'ArrowRight') {
        this.ringSize.min += 10;
      }
      if (e.key === 'ArrowUp') {
        this.ringSize.max += 10;
      }
      if (e.key === 'ArrowDown') {
        this.ringSize.max -= 10;
      }
      this.ringSize.max = Math.max(0, this.ringSize.max);
      this.ringSize.min = Math.max(0, Math.min(this.ringSize.max, this.ringSize.min));
      if (e.key.toLocaleLowerCase() == 'q') {
        this.sliceSize -= Math.PI / 16;
      } else if (e.key.toLocaleLowerCase() == 'e') {
        this.sliceSize += Math.PI / 16;
      }
      this.sliceSize = Math.max(0, Math.min(Math.PI * 2, this.sliceSize));
      this.render();
      this.runQuery();
    });
  }


  private runQuery = () => {
    const origin = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    const angleMouseToOrigin = Math.atan2(this.mousePos.y - origin.y, this.mousePos.x - origin.x);

    // use the box query, where X is the distance and Y is the angle from our center point
    const distanceMin = this.ringSize.min;
    const distanceMax = this.ringSize.max;

    const angleMin = angleMouseToOrigin;
    const angleMax = angleMouseToOrigin + this.sliceSize;


    const { ctx } = this;

    this.ringQuery ||= new RingQuery(this.entities, origin);

    // console.time('query');
    const results = this.ringQuery.query(distanceMin, distanceMax, angleMin, angleMax); //this.query(distanceMin, angleMin, Math.abs(distanceMax - distanceMin), Math.abs(angleMax - angleMin));
    // console.timeEnd('query');
    results.forEach((entity) => {
      // convert from polar to cartesian and draw
      const cartesian = this.polarToCartesian(entity.position);
      ctx.beginPath();
      ctx.arc(this.center.x + cartesian.x, this.center.y + cartesian.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.closePath();
    });

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

    this.ringQuery.render(this.ctx, this.debugCtx);
  }

  private render = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgb(200,200,200)';
    for (let entity of this.entities) {
      this.ctx.beginPath();
      this.ctx.arc(entity.position.x, entity.position.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    this.ringQuery.render(this.ctx, this.debugCtx);
  }

  private polarToCartesian = (polar: Vector2Like) => {
    const x = polar.x * Math.cos(polar.y);
    const y = polar.x * Math.sin(polar.y);
    return { x, y };
  }
}




new Demo();
