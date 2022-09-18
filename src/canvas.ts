
class CanvasElement {
    public readonly element: HTMLCanvasElement;

    constructor(element: HTMLCanvasElement) {
        this.element = element;
    }

    static fromParent(parent: HTMLElement): CanvasElement {
        const ele = document.createElement("canvas");
        parent.appendChild(ele);
        return new CanvasElement(ele)
    }
}
