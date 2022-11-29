
type DrawLoopCallback = (dt: number, t: number) => void;

class DrawLoop {
    private _cb: DrawLoopCallback;
    private _fps?: number;

    private _start: number;
    private _lastTime: number;
    private _handle?: { type: "request" | "interval", id: number };

    constructor(cb: DrawLoopCallback, fps?: number) {
        this._cb = cb;
        this._fps = fps;
        this._start = Date.now();
    }

    public start() {
        this._lastTime = Date.now();
        if(this._fps) {
            let id = setInterval(() => {
                let dt = this._getDt();
                let ellapsed = this._getElapsedT();
                this._cb(dt, ellapsed);
            }, 1000 / this._fps);
            this._handle = { type: "request", id };
        } else {
            let drawFn = () => {
                let dt = this._getDt();
                let ellapsed = this._getElapsedT();
                this._cb(dt, ellapsed);

                requestAnimationFrame(drawFn);
            };
            let id = requestAnimationFrame(drawFn);
            this._handle = { type: "request", id };
        }

    }

    private _getDt(): number {
        let currentTime = Date.now();
        let delta = currentTime - this._lastTime;
        this._lastTime = currentTime;
        return delta
    }

    private _getElapsedT(): number {
        return Date.now() -  this._start;
    }

    public stop() {
        if(this._handle) {
            if(this._handle.type === "request") {
                cancelAnimationFrame(this._handle.id);
                this._handle = undefined;
            } else if(this._handle.type === "interval") {
                clearInterval(this._handle.id);
                this._handle = undefined;
            } else { console.warn(`invalid loop type in drawloop: ${this._handle.type}`) }
        } else { console.warn("tried to stop a drawloop that was not running") }
    }
}

export {
    DrawLoop,
}

