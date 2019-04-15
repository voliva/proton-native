import libui from 'libui-node';
import { AreaGroup } from './AreaGroup';

const identity = new libui.UiDrawMatrix();
identity.setIdentity();

export class ComposableArea {
  constructor(props) {
    this._group = new AreaGroup(props);
    this._group.changeHandler = this.handleChange;
    this._area = new libui.UiArea(
      this.handleDraw,
      this.handleMouseEvent,
      (...args) => {}, // console.log('onMouseCrossed', ...args),
      (...args) => console.log('onDragBroken', ...args),
      (...args) => console.log('onKeyEvent', ...args),
    );
  }

  get element() {
    return this._area;
  }

  updateProps(changes) {
    return this._group.updateProps(changes);
  }

  addChild(child) {
    return this._group.addChild(child);
  }

  removeChild(child) {
    return this._group.removeChild(child);
  }

  handleChange = () => this._area.queueRedrawAll();

  handleDraw = (area, p) => {
    this._group.draw({}, {
      width: p.getAreaWidth(),
      height: p.getAreaHeight()
    }, area, p);
  }

  handleMouseEvent = (area, evt) => {
    const areaSize = {
      width: evt.getAreaWidth(),
      height: evt.getAreaHeight()
    };

    const event = {
      ...areaSize,
      x: evt.getX(),
      y: evt.getY(),
    };

    const down = evt.getDown();
    const up = evt.getUp();
    if (up) {
      event.type = 'onMouseUp';
      event.button = up;
    } else if (down) {
      event.type = 'onMouseDown';
      event.button = down;
    } else {
      const buttons = [];
      const held = evt.getHeld1To64();
      if (held > 0) {
        for (let i = 0; i <= 6; i++) {
          if (held & Math.pow(2, i)) buttons.push(i + 1);
          if (!(held >> (i + 1))) break;
        }
      }
      event.type = 'onMouseMove',
      event.buttons = buttons;
    }

    this._group.captureMouseEvent({}, event, areaSize, area, identity);
  }
}
