import { getTransformationMatrix, createParsers, strokePath, fillPath } from "./areaHelpers";
import libui from 'libui-node';

const createAreaDrawable = (
  drawFn
) => class AreaRectangle {
  constructor(props = {}) {
    console.log('drawable created');

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