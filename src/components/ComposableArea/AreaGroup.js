import { getTransformationMatrix, createParsers } from "./areaHelpers";
import libui from 'libui-node';

function pickPropagatedProps(props) {
  return ['stroke', 'strokeWidth', 'fill'].reduce((acc, key) => ({
    ...acc,
    [key]: props[key]
  }), {});
}

export class AreaGroup {
  constructor(props = {}) {
    this.props = props;

    this.changeHandler = () => {
      throw new Error('Change handler not set up')
    };
    this.children = [];
  }

  setChangeHandler(changeHandler) {
    this.changeHandler = changeHandler;
    this.children.forEach(child => child.setChangeHandler(changeHandler));
  }

  updateProps(changes) {
    this.props = {
      ...this.props,
      ...changes
    };

    this.changeHandler();
  }

  addChild(child) {
    if (this.children.includes(child)) {
      console.warn('Group won\'t add a child that was already added');
      return;
    }
    this.children.push(child);
    child.changeHandler = this.changeHandler;

    this.changeHandler();
  }

  removeChild(child) {
    if (!this.children.includes(child)) {
      throw new Error(`Can't remove a child that's not added`);
    }

    const i = children.indexOf(child);
    children.splice(i, 1);
    deleteAt(child, i);

    this.changeHandler();
  }

  draw(parentProps, parentSize, area, p) {
    const mergedProps = {
      ...parentProps,
      ...this.props
    };
    
    const { parseX, parseY } = createParsers(parentSize);
    const ownSize = {
      width: parseX(mergedProps.width || '100%'),
      height: parseY(mergedProps.height || '100%')
    }

    if(mergedProps.transform) {
      const mat = getTransformationMatrix(mergedProps.transform, ownSize);
      p.getContext().save();
      p.getContext().transform(mat);
    }

    this.children.forEach(child => child.draw(
      pickPropagatedProps(mergedProps),
      ownSize,
      area,
      p
    ));

    if(mergedProps.transform) {
      p.getContext().restore();
    }
  }

  captureMouseEvent(parentProps, evt, parentSize, area, contextMat) {
    const mergedProps = {
      ...parentProps,
      ...this.props,
    };

    const { parseX, parseY } = createParsers(parentSize);
    const ownSize = {
      width: parseX(mergedProps.width || '100%'),
      height: parseY(mergedProps.height || '100%')
    }

    if (mergedProps.transform) {
      // Copy Matrix
      const oldMat = contextMat;

      // Seems like transform is applied by pre-multiplying
      // https://github.com/andlabs/libui/blob/cda991b7e252874ce69ccdb7d1a40de49cee5839/windows/draw.cpp#L410
      contextMat = getTransformationMatrix(
        mergedProps.transform,
        ownSize
      );
      contextMat.multiply(oldMat);
    }

    const capturedByChild = this.children
      .filter(child => !!child.captureMouseEvent)
      .some(child => child.captureMouseEvent(
        pickPropagatedProps(mergedProps),
        evt,
        ownSize,
        area,
        contextMat
      ));

    if (capturedByChild) {
      return true;
    }

    if(!this.props[evt.type]) {
      return false;
    }

    if(!contextMat.invertible) {
      console.warn('Matrix is not invertible, we can\'t capture mouse event for this child');
      return false;
    }

    // Copy Matrix
    const inverted = new libui.UiDrawMatrix();
    inverted.setIdentity();
    inverted.multiply(contextMat);
    inverted.invert();

    const original = new libui.PointDouble(
      evt.x,
      evt.y
    );
    const target = inverted.transformPoint(original);

    const targetEvt = {
      ...evt,
      targetX: target.x,
      targetY: target.y
    };

    return this.props[evt.type](targetEvt);
  }
}