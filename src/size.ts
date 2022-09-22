import { Vec2 } from "@david.harwardt/math";


type ResizeCallback = (newSize: Vec2, oldSize: Vec2) => void;
abstract class CanvasSize {
    public onResize: ResizeCallback;
    public element: HTMLCanvasElement;

    constructor(element: HTMLCanvasElement, onResize: ResizeCallback = _ => {}) {
        this.onResize = onResize;
        this.element = element;
    }
}

class CanvasCssSize extends CanvasSize {
    constructor(element: HTMLCanvasElement, onResize?: ResizeCallback) {
        super(element, onResize);
        const observer = new ResizeObserver(entries => {
            let oldDim = new Vec2(this.element.width, this.element.height);
            for(const entry of entries) {
                this.element.width = entry.contentRect.width;
                this.element.height = entry.contentRect.height;
            }
            this.onResize(new Vec2(this.element.width, this.element.height), oldDim);
        });
        observer.observe(this.element);
    }
}

class CanvasFixedSize extends CanvasSize {
    constructor(dim: Vec2, element: HTMLCanvasElement, onResize?: ResizeCallback) {
        super(element, onResize);
        element.width = dim.x;
        element.height = dim.y;
    }
}

class CanvasFullscreenSize extends CanvasCssSize {
    constructor(element: HTMLCanvasElement, onResize?: ResizeCallback) {
        super(element, onResize);
        element.style.width = "100%";
        element.style.height = "100%";
    }
}

export {
    CanvasSize,
    CanvasCssSize,
    CanvasFullscreenSize,
    CanvasFixedSize,
}
