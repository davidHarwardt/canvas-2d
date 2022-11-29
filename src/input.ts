import { Vec2 } from "@david.harwardt/math";

class InputManager {
    protected _parent: Window;

    protected _pointerPos: Vec2;
    protected _oldPointerPos: Vec2;
    protected _buttons: [left: boolean, middle: boolean, right: boolean];
    protected _clicks: [left: boolean, middle: boolean, right: boolean];

    constructor(parent: Window | HTMLElement = window) {
        this._parent = parent as Window;
        this._buttons = [false, false, false];
        this._clicks = [false, false, false];
        this._pointerPos = new Vec2(0, 0);
        this._oldPointerPos = this._pointerPos.copy();

        this._parent.addEventListener("pointermove", ev =>
            this._pointerPos = new Vec2(ev.clientX, ev.clientY));
        this._parent.addEventListener("pointerdown", ev => this._buttons[ev.button] = true);
        this._parent.addEventListener("pointerup", ev => this._buttons[ev.button] = false);
        this._parent.addEventListener("pointerout", ev => this._buttons[ev.button] = false);
        this._parent.addEventListener("click", ev => this._clicks[ev.button] = true);
    }

    public get pointerPos() { return this._pointerPos }
    public get buttons() { return this._buttons }
    public get clicks() { return this._clicks }

    public delta() {
        let delta = this._pointerPos.sub(this._oldPointerPos);
        this._oldPointerPos = this._pointerPos;
        return delta
    }

    public frame() {
        this._clicks = [false, false, false];
    }
}

export {
    InputManager,
}

