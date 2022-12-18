import { Vec2 } from "@david.harwardt/math";
import { Canvas2d, ICanvasPlugin } from "./canvas";
import { CanvasFullscreenSize } from "./size";

declare global {
    interface Canvas2dPluginMap {
        "input": CanvasInputManagerPlugin,
    }
}

class CanvasInputManagerPlugin implements ICanvasPlugin {
    protected _parent?: HTMLCanvasElement;

    protected _pointerPos: Vec2;
    protected _oldPointerPos: Vec2;
    protected _buttons: [left: boolean, middle: boolean, right: boolean];
    protected _clicks: [left: boolean, middle: boolean, right: boolean];
    protected _lastDelta: Vec2;
    protected _draggablePlugin?: CanvasDraggablePlugin;

    constructor() {
        this._parent = undefined;
        this._buttons = [false, false, false];
        this._clicks = [false, false, false];
        this._pointerPos = new Vec2(0, 0);
        this._lastDelta = new Vec2(0, 0);
        this._oldPointerPos = this._pointerPos.copy();
    }

    public get parent() { return this._parent }

    init(canvas: Canvas2d): void {
        this._parent = canvas.element;
        this._draggablePlugin = canvas.getPlugin("dragging");

        this._parent.addEventListener("pointermove", ev => {
            let pos = new Vec2(ev.clientX, ev.clientY);
            this._pointerPos = pos;
        });
        this._parent.addEventListener("pointerdown", ev => this._buttons[ev.button] = true);
        this._parent.addEventListener("pointerup", ev => this._buttons[ev.button] = false);
        this._parent.addEventListener("pointerout", ev => this._buttons[ev.button] = false);
        this._parent.addEventListener("click", ev => this._clicks[ev.button] = true);
    }

    beforeDrawBegin(_canvas: Canvas2d): void {
        this._calcDelta();
        this._frame();
    }

    afterDrawEnd(_canvas: Canvas2d): void {  }

    get id(): string { return "input" }

    public get pointerPos() {
        if(this._draggablePlugin) {
            return this._draggablePlugin.toScreen(this._pointerPos);
        } else {
            return this._pointerPos
        }
    }
    public get rawPointerPos() {
        return this._pointerPos;
    }

    public get buttons() { return this._buttons }
    public get clicks() { return this._clicks }

    private _calcDelta() {
        let delta = this.rawPointerPos.sub(this._oldPointerPos);
        this._oldPointerPos = this.rawPointerPos;
        this._lastDelta = delta;
    }

    public get pointerDelta() {
        if(this._draggablePlugin) {
            return this._lastDelta.divS(this._draggablePlugin["_scale"]);
        } else {
            return this._lastDelta;
        }
    }

    private _frame() {
        this._clicks = [false, false, false];
    }
}

declare global {
    interface Canvas2dPluginMap {
        "fullscreen": CanvasFullscreenPlugin,
    }
}

type ResizeCallback = (newSize: Vec2, oldSize: Vec2) => void;
class CanvasFullscreenPlugin implements ICanvasPlugin {
    onResize: ResizeCallback | undefined;

    constructor(onResize?: ResizeCallback) {
        this.onResize = onResize;
    }

    init(canvas: Canvas2d): void {
        new CanvasFullscreenSize(canvas.element, this.onResize);
    }

    beforeDrawBegin(_canvas: Canvas2d): void {}
    afterDrawEnd(_canvas: Canvas2d): void {}

    get id(): string { return "fullscreen" }
}

declare global {
    interface Canvas2dPluginMap {
        "dragging": CanvasDraggablePlugin,
    }
}

class CanvasDraggablePlugin implements ICanvasPlugin {
    private _input?: CanvasInputManagerPlugin;
    private _offset: Vec2;
    private _scale: number;
    private _sens: number;

    constructor(config: { sensitivity?: number } = {}) {
        this._input = undefined;
        this._offset = new Vec2(0, 0);
        this._scale = 1;
        this._sens = config.sensitivity ?? 1;
    }

    get id(): string { return "dragging" }

    init(canvas: Canvas2d): void {
        this._input = canvas.getPlugin("input")!;
        if(!this._input) {
            console.error(`could not find the CanvasInputManagerPlugin required by the CanvasDraggablePlugin`);
            return
        }

        this._input.parent!.addEventListener("wheel", ev => {
            let oldPos = this._input!.rawPointerPos.copy();
            let oldScreenPos = this.toScreen(oldPos);

            this._scale += ev.deltaY * -0.001 * this._sens * this._scale;
            this._scale = Math.min(100.0, Math.max(0.01, this._scale));

            let newPos = this.toWorld(oldScreenPos);

            let diff = oldPos.sub(newPos);
            this._offset = this._offset.add(diff);
        });
    }

    resetTransform() {
        this._scale = 1;
        this._offset = new Vec2(0, 0);
    }

    beforeDrawBegin(canvas: Canvas2d): void {
        let delta = this._input!.pointerDelta;
        if(this._input!.buttons[0]) {
            this._offset = this._offset.add(delta.multS(this._scale));
        }

        canvas.saveCtx();
        canvas.translate(this._offset);
        canvas.scale(new Vec2(this._scale, this._scale));
    }

    afterDrawEnd(canvas: Canvas2d): void {
        canvas.restoreCtx();
    }

    centerViewOn() {
        // todo
    }

    toWorld(pos: Vec2) { return pos.multS(this._scale).add(this._offset) }
    toScreen(pos: Vec2) { return pos.sub(this._offset).divS(this._scale) }
}

export {
    CanvasDraggablePlugin,
    CanvasInputManagerPlugin,
    CanvasFullscreenPlugin,
}

