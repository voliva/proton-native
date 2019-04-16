import { getTransformationMatrix, createParsers, strokePath, fillPath } from "./areaHelpers";
import libui from 'libui-node';

const createAreaDrawable = (
  drawFn,
  captureMouseFn = () => false
) => class {
  constructor(props = {}) {
    this.props = props;

    this.changeHandler = () => {
      throw new Error('Change handler not set up')
    };
  }

  setChangeHandler(changeHandler) {
    this.changeHandler = changeHandler;
  }

  updateProps(changes) {
    this.props = {
      ...this.props,
      ...changes
    };

    this.changeHandler();
  }

  draw(parentProps, parentSize, area, p) {
    const mergedProps = {
      ...parentProps,
      ...this.props
    };
    
    const { parseX, parseY } = createParsers(parentSize);
    const ownSize = {
      width: parseX(mergedProps.width),
      height: parseY(mergedProps.height)
    }

    if(mergedProps.transform) {
      const mat = getTransformationMatrix(mergedProps.transform, ownSize);
      p.getContext().save();
      p.getContext().transform(mat);
    }

    drawFn(
      mergedProps,
      parentSize,
      area,
      p
    );

    if(mergedProps.transform) {
      p.getContext().restore();
    }
  }
  
  captureMouseEvent(parentProps, evt, parentSize, area, contextMat) {
    if(!this.props[evt.type]) {
      return false;
    }

    const mergedProps = {
      ...parentProps,
      ...this.props,
    };

    const { parseX, parseY } = createParsers(parentSize);
    const ownSize = {
      width: parseX(mergedProps.width),
      height: parseY(mergedProps.height)
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

    if(captureMouseFn(targetEvt, mergedProps, parentSize, area)) {
      return this.props[evt.type](targetEvt);
    }

    return false;
  }
}

export const AreaRectangle = createAreaDrawable(
  (props, parentSize, area, p) => {
    const path = new libui.UiDrawPath(libui.fillMode.winding);

    const { parseX, parseY } = createParsers(parentSize);
  
    path.addRectangle(
      parseX(props.x || '0'),
      parseY(props.y || '0'),
      parseX(props.width),
      parseY(props.height)
    );
    path.end();

    strokePath(props, path, p);
    fillPath(props, path, p);
  },
  (evt, props, parentSize, area) => {
    const { parseX, parseY } = createParsers(parentSize);
    const ownSize = {
      width: parseX(props.width),
      height: parseY(props.height)
    }
    const position = {
      x: parseX(props.x || '0'),
      y: parseY(props.y || '0')
    };

    return (
      evt.targetX >= position.x &&
      evt.targetX <= position.x + ownSize.width &&
      evt.targetY >= position.y &&
      evt.targetY <= position.y + ownSize.height
    );
  }
);

export const AreaBezier = createAreaDrawable(
  (props, parentSize, area, p) => {
    const path = new libui.UiDrawPath(libui.fillMode.winding);
  
    const { parseX, parseY } = createParsers(parentSize);

    path.newFigure(
      parseX(props.x1),
      parseY(props.y1),
    );
    path.bezierTo(
      parseX(props.cx1),
      parseY(props.cy1),
      parseX(props.cx2),
      parseY(props.cy2),
      parseX(props.x2),
      parseY(props.y2),
    );
    path.end();
  
    strokePath(props, path, p);
  }
)