import libui from 'libui-node';
import { AreaGroup } from './AreaGroup';

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
    try {
      this._group.draw({}, {
        width: p.getAreaWidth(),
        height: p.getAreaHeight()
      }, area, p);
    }catch(ex) {
      console.log(ex);
    }
  }

  handleMouseEvent = (area, evt) => {
    return true;
  }
}
