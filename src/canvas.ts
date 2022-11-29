import { Vec2 } from "@david.harwardt/math";
import { Color } from "@david.harwardt/color";

type Canvas2dLineStyle = Partial<{
    width: number,
    color: number,
    cap: CanvasLineCap,
}>

type Canvas2dShapeStyle = Partial<{
    color: Color,
    borderColor: Color,
    fill: boolean,
    borderWidth: number,
}>

type Canvas2dPolygonStyle = Canvas2dShapeStyle & Partial<{
    closed: boolean,
}>

type Canvas2dTextStyle = Partial<{
    size: number,
    color: Color,
    font: string,
    align: CanvasTextAlign,
    baseLine: CanvasTextBaseline,
    maxWidth: number,
    debug: boolean,
}>

interface ICanvasPlugin {
    init(canvas: Canvas2d): void;
    beforeDrawBegin(canvas: Canvas2d): void;
    afterDrawEnd(canvas: Canvas2d): void;
    get id(): string;
}

interface Canvas2dPluginMap {

}

class Canvas2d {
    public readonly element: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private plugins: ICanvasPlugin[];
    private pluginsInit: boolean;

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.ctx = this.element.getContext("2d");
        this.plugins = [];
        this.pluginsInit = false;
    }

    static fromParent(parent: HTMLElement): Canvas2d {
        const ele = document.createElement("canvas");
        parent.appendChild(ele);
        return new Canvas2d(ele)
    }

    public addPlugin(plugin: ICanvasPlugin) {
        this.plugins.push(plugin);
    }

    public getPlugin<T extends keyof Canvas2dPluginMap>(
        id: T
    ): Canvas2dPluginMap[T] | undefined {
        return (this.plugins.find(v => v.id == id) as T)
    }

    public clear() {
        if(!this.pluginsInit) {
            this.plugins.forEach(v => v.init(this));
            this.pluginsInit = true;
        }

        this.ctx.clearRect(0, 0, this.element.width, this.element.height)
    }

    public beginDraw() { this.plugins.forEach(v => v.beforeDrawBegin(this)) }

    public endDraw() { this.plugins.forEach(v => v.afterDrawEnd(this)) }

    public draw(fn: (ctx: CanvasRenderingContext2D) => void) { fn(this.ctx) }

    public drawLine(start: Vec2, end: Vec2, style: Canvas2dLineStyle = {}) {
        this.ctx.lineWidth = style.width ?? 10;
        this.ctx.strokeStyle = style.color?.toString() ?? Color.red.toString();
        this.ctx.lineCap = style.cap ?? "butt";

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }

    public drawRect(pos: Vec2, dim: Vec2, style: Canvas2dShapeStyle = {}) {
        this.ctx.beginPath();
        this.ctx.rect(pos.x, pos.y, dim.x, dim.y);

        if(style.fill !== false) { this.ctx.fillStyle = style.color?.toString() ?? Color.green.toString(); this.ctx.fill(); }
        if(style.borderWidth > 0) { this.ctx.strokeStyle = style.borderColor?.toString() ?? Color.red.toString(); this.ctx.lineWidth = style.borderWidth; this.ctx.stroke(); }
    }

    public drawCircle(center: Vec2, radius: number, style: Canvas2dShapeStyle = {}) {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

        if(style.fill !== false) { this.ctx.fillStyle = style.color?.toString() ?? Color.green.toString(); this.ctx.fill(); }
        if(style.borderWidth > 0) { this.ctx.strokeStyle = style.borderColor?.toString() ?? Color.red.toString(); this.ctx.lineWidth = style.borderWidth; this.ctx.stroke(); }
    }

    public drawPoly(vertecies: Vec2[], style: Canvas2dPolygonStyle = {}) {
        if(vertecies.length < 2) { console.error(`invalid vertex count for polygon: ${vertecies.length}`); return; }

        this.ctx.beginPath();
        this.ctx.moveTo(vertecies[0].x, vertecies[0].y);

        for(let i = 1 ; i < vertecies.length; i++) { this.ctx.lineTo(vertecies[i].x, vertecies[i].y); }

        if(style.closed === true) { this.ctx.closePath(); }
        if(style.fill !== false) { this.ctx.fillStyle = style.color?.toString() ?? Color.green.toString(); this.ctx.fill(); }
        if(style.borderWidth > 0) { this.ctx.strokeStyle = style.borderColor?.toString() ?? Color.red.toString(); this.ctx.lineWidth = style.borderWidth; this.ctx.stroke(); }
    }

    public drawBezier(def: [Vec2, Vec2, Vec2, Vec2], style: Canvas2dLineStyle = {}) {

    }

    public drawText(text: string, pos: Vec2, style: Canvas2dTextStyle = {}) {
        this.ctx.fillStyle = style.color?.toString() ?? Color.white.toString();
        this.ctx.textAlign = style.align ?? "left";
        this.ctx.font = `${style.size ?? 50}px ${style.font ?? "Arial"}`;
        this.ctx.textBaseline = style.baseLine ?? "top";

        if(style.debug)
        {
            const dim = this.ctx.measureText(text);
            // todo text metrics
        }
        
        this.ctx.fillText(text, pos.x, pos.y, style.maxWidth);
    }

    public drawImage(img: CanvasImageSource, pos: Vec2, dim: Vec2 = new Vec2(img.width as number, img.height as number), cutout?: { start: Vec2, dim: Vec2 }) {
        if(cutout)  { this.ctx.drawImage(img, cutout.start.x, cutout.start.y, cutout.dim.x, cutout.dim.y, pos.x, pos.y, dim.x, dim.y); }
        else        { this.ctx.drawImage(img, pos.x, pos.y, dim.x, dim.y); } 
    }

    public translate(offset: Vec2) { this.ctx.translate(offset.x, offset.y) }

    public scale(scale: Vec2, transformOrigin?: Vec2) {
        if(transformOrigin) { this.translate(transformOrigin); }
        this.ctx.scale(scale.x, scale.y);
        if(transformOrigin) { this.translate(transformOrigin.inverted()); }
    }

    public rotate(angle: number, transformOrigin?: Vec2) {
        if(transformOrigin) { this.translate(transformOrigin); }
        this.ctx.rotate(angle);
        if(transformOrigin) { this.translate(transformOrigin.inverted()); }
    }

    public resetTransform() { this.ctx.resetTransform() }
    public saveCtx() { this.ctx.save() }
    public restoreCtx() { this.ctx.restore() }

    public screenToWorld(pos: Vec2) {
        const mat = this.ctx.getTransform().inverse();        
        return new Vec2(mat.a * pos.x + mat.c * pos.y + mat.e, mat.b * pos.x + mat.d * pos.y + mat.f);
    }

    public worldToScreen(pos: Vec2) {
        const mat = this.ctx.getTransform();        
        return new Vec2(mat.a * pos.x + mat.c * pos.y + mat.e, mat.b * pos.x + mat.d * pos.y + mat.f);
    }

    public clipRect(pos: Vec2, dim: Vec2)           { this.clip(ctx => ctx.rect(pos.x, pos.y, dim.x, dim.y)) }
    public clipCircle(center: Vec2, radius: number) { this.clip(ctx => ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)) }
    public clip(fn: (ctx: CanvasRenderingContext2D) => void) {
        this.ctx.beginPath();
        fn(this.ctx);
        this.ctx.clip();
    }

    public getImageData(pos: Vec2, dim: Vec2 = new Vec2(1, 1)) { return this.ctx.getImageData(pos.x, pos.y, dim.x, dim.y) }
    public createImageData(dim: Vec2) { return this.ctx.createImageData(dim.x, dim.y) }
    public putImageData(data: ImageData, pos: Vec2) { this.ctx.putImageData(data, pos.x, pos.y) }

    public getPixel(pos: Vec2) { console.error("todo") }
}

export type {
    Canvas2dLineStyle,
    Canvas2dPolygonStyle,
    Canvas2dShapeStyle,
    Canvas2dTextStyle,

    ICanvasPlugin,
    Canvas2dPluginMap,
}

export {
    Canvas2d,
}
