// 手写笔迹模拟服务
// 使用Canvas实现真实的手写效果

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  lineWidth: number;
  startTime: number;
}

export interface HandwritingOptions {
  color: string;
  lineWidth: number;
  smoothing: boolean;
  pressureSensitivity: boolean;
  inkEffect: boolean;
}

export class HandwritingService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private options: HandwritingOptions;

  constructor(canvas: HTMLCanvasElement, options?: Partial<HandwritingOptions>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.options = {
      color: '#000000',
      lineWidth: 2,
      smoothing: true,
      pressureSensitivity: false,
      inkEffect: true,
      ...options
    };
    
    this.setupCanvas();
  }

  private setupCanvas() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
  }

  // 开始新笔画
  startStroke(x: number, y: number, pressure?: number) {
    this.currentStroke = {
      points: [{
        x,
        y,
        pressure: pressure ?? 1,
        timestamp: Date.now()
      }],
      color: this.options.color,
      lineWidth: this.options.lineWidth,
      startTime: Date.now()
    };
  }

  // 添加点到当前笔画
  addPoint(x: number, y: number, pressure?: number) {
    if (!this.currentStroke) return;

    const point: Point = {
      x,
      y,
      pressure: pressure ?? 1,
      timestamp: Date.now()
    };

    this.currentStroke.points.push(point);
    this.redraw();
  }

  // 结束当前笔画
  endStroke() {
    if (this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
    }
  }

  // 绘制所有笔画
  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制历史笔画
    this.strokes.forEach(stroke => {
      this.drawStroke(stroke);
    });
    
    // 绘制当前笔画
    if (this.currentStroke) {
      this.drawStroke(this.currentStroke);
    }
  }

  // 绘制单个笔画
  private drawStroke(stroke: Stroke) {
    if (stroke.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.lineWidth;

    if (this.options.smoothing) {
      this.drawSmoothedStroke(stroke);
    } else {
      this.drawSimpleStroke(stroke);
    }

    this.ctx.stroke();
  }

  // 绘制平滑笔画
  private drawSmoothedStroke(stroke: Stroke) {
    const points = stroke.points;
    
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    if (points.length > 2) {
      this.ctx.quadraticCurveTo(
        points[points.length - 2].x, 
        points[points.length - 2].y,
        points[points.length - 1].x, 
        points[points.length - 1].y
      );
    }
  }

  // 绘制简单笔画
  private drawSimpleStroke(stroke: Stroke) {
    const points = stroke.points;
    
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
  }

  // 清空画布
  clear() {
    this.strokes = [];
    this.currentStroke = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 撤销上一笔
  undo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redraw();
    }
  }

  // 设置选项
  setOptions(options: Partial<HandwritingOptions>) {
    this.options = { ...this.options, ...options };
  }

  // 获取当前画布图像
  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  // 保存为图片
  toDataURL(type: string = 'image/png', quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  // 加载笔画数据
  loadStrokes(strokes: Stroke[]) {
    this.strokes = strokes;
    this.redraw();
  }

  // 获取当前笔画数据
  getStrokes(): Stroke[] {
    return [...this.strokes];
  }
}

// 工具函数
export const HandwritingUtils = {
  // 计算两点间距离
  distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  },

  // 计算笔画长度
  calculateStrokeLength(stroke: Stroke): number {
    let length = 0;
    for (let i = 1; i < stroke.points.length; i++) {
      length += this.distance(stroke.points[i - 1], stroke.points[i]);
    }
    return length;
  },

  // 简化笔画（减少点的数量）
  simplifyStroke(stroke: Stroke, tolerance: number = 2): Stroke {
    if (stroke.points.length <= 2) return stroke;

    const simplifiedPoints = [stroke.points[0]];
    
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const next = stroke.points[i + 1];
      
      // 计算当前点到前一点和后一点连线的距离
      const distance = this.pointToLineDistance(curr, prev, next);
      
      if (distance > tolerance) {
        simplifiedPoints.push(curr);
      }
    }
    
    simplifiedPoints.push(stroke.points[stroke.points.length - 1]);
    
    return {
      ...stroke,
      points: simplifiedPoints
    };
  },

  // 计算点到直线距离
  pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return this.distance(point, lineStart);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    return this.distance(point, { x: xx, y: yy, timestamp: Date.now() });
  }
};