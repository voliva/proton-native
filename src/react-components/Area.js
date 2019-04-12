import React, { Children, Component, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AreaInternal } from '../';
import libui from 'libui-node';
import Color from 'color';

let HasAreaParentContext = React.createContext(false);

const AreaComponentPropTypes = {
  transform: PropTypes.string,
  fill: PropTypes.string,
  fillOpacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  stroke: PropTypes.string,
  strokeOpacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  strokeWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  strokeLinecap: PropTypes.oneOf(['flat', 'round', 'square']),
  strokeLinejoin: PropTypes.oneOf(['miter', 'round', 'bevel']),
  strokeMiterlimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const AreaComponentDefaultProps = {
  fillOpacity: 1,
  strokeOpacity: 1,
  strokeWidth: 1,
  strokeMiterlimit: 10,
  strokeLinecap: 'flat',
  strokeLinejoin: 'miter',
};

function createBrush(color, alpha) {
  const brush = new libui.DrawBrush();
  brush.color = toLibuiColor(color);
  brush.color.alpha = brush.color.alpha * alpha;
  brush.type = libui.brushType.solid;

  return brush;
}

function fallback(...vals) {
  let func = a => Number(a);
  if (typeof vals[vals.length - 1] === 'function') {
    func = vals.pop();
  }

  for (let v of vals) {
    if (typeof v !== 'undefined') {
      return func(v);
    }
  }
}

const logMatrix = (mat, label) => {
  console.log(label, mat.m11, mat.m21, mat.m31);
  console.log(label, mat.m12, mat.m22, mat.m32);
}

const getTransformationMatrix = (transformProp, measureFn = false) => {
  const mat = new libui.UiDrawMatrix();
  const zero = new libui.PointDouble(0, 0);
  mat.setIdentity();

  let measured = null;

  const parseSelf = (val, y = false) => {
    if (typeof val === 'number') {
      return val;
    }

    if (typeof val === 'string') {
      if (val.slice(-1) === '%') {
        if (!measureFn) {
          throw new Error(`Can't measure component`);
        }
        if (!measured) {
          measured = measureFn();
        }
        let num = Number(val.slice(0, -1));
        return num / 100 * (y ? measured.height : measured.width);
      }

      return Number(val);
    }
  };

  const getOrigin = (relativeOriginX, relativeOriginY) => {
    const current = mat.transformPoint(zero);
    const relativeOrigin = new libui.SizeDouble(
      fallback(relativeOriginX, '50%', v => parseSelf(v, false)),
      fallback(relativeOriginY, '50%', v => parseSelf(v, true))
    );
    const {w, h} = mat.transformSize(relativeOrigin);

    return {
      x: current.x + w,
      y: current.y + h
    }
  }

  for (const transform of transformProp.match(/\w+\([^)]+\)/g)) {
    // rotate(deg [,x, y])
    // default x: 50%, y: 50%
    const rotate = transform.match(
      /rotate\s*\(\s*([-0-9.]+)(?:\s*,\s*([-0-9.%]+)\s*,\s*([-0-9.%]+))?\s*\)/
    );
    if (rotate) {
      const rad = Number(rotate[1]) * (Math.PI / 180);
      const { x, y } = getOrigin(rotate[2], rotate[3]);

      mat.rotate(x, y, rad);
    }

    // translate(x [y])
    // default y: x
    const translate = transform.match(
      /translate\s*\(\s*([-0-9.%]+)(?:\s*,\s*([-0-9.%]+))?\s*\)/
    );
    if (translate) {
      const x = parseSelf(translate[1], false);
      const y = fallback(translate[2], translate[1], v => parseSelf(v, true));
      mat.translate(x, y);
    }

    // 1: scale(x)
    // 2: scale(x, y)
    // 3: scale(x, xCenter, yCenter)
    // 4: scale(x, y, xCenter, yCenter)
    // default y: x, xCenter=yCenter: 50%
    const scale = transform.match(
      /scale\s*\(([-0-9.]+)(?:(?:\s*,\s*([-0-9.]+))?(?:\s*,\s*([-0-9.%]+)\s*,\s*([-0-9.%]+))?)?\)/
    );
    if (scale) {
      const scaleX = Number(scale[1]);
      const scaleY = fallback(scale[2], scale[1]);
      const { x, y } = getOrigin(scale[3], scale[4]);

      mat.scale(x, y, scaleX, scaleY);
    }

    // skew(a, b [,x, y])
    // a, b: x/y angle
    // default x=y: 50%
    const skew = transform.match(
      /skew\s*\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)(?:,\s*([-0-9.%]+),\s*([-0-9.%]+))?\)/
    );
    if (skew) {
      const rad1 = Number(skew[1]) * (Math.PI / 180);
      const rad2 = Number(skew[2]) * (Math.PI / 180);
      const { x, y } = getOrigin(skew[3], skew[4]);

      mat.skew(x, y, rad1, rad2);
    }

    // matrix(a, b, c, d, e, f, g)
    const matrix = transform.match(
      /matrix\s*\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)/
    );
    if (matrix) {
      const newMat = new libui.UiDrawMatrix();
      newMat.setM11(matrix[1]);
      newMat.setM12(matrix[2]);
      newMat.setM21(matrix[3]);
      newMat.setM22(matrix[4]);
      newMat.setM31(matrix[5]);
      newMat.setM32(matrix[6]);

      logMatrix(mat, 'mat');
      logMatrix(newMat, 'newMat');
      mat.multiply(newMat);
      logMatrix(mat, 'mat');
    }
  }

  return mat;
};

const drawChild = (parentProps, area, p) => child => {
  if (typeof child !== 'object' || !child.type) {
    return;
  }

  const mergedProps = {
    ...parentProps,
    ...child.props,
  };

  if (child.props.transform) {
    p.getContext().save();
    const mat = getTransformationMatrix(
      child.props.transform,
      child.type.measureFn && (() => child.type.measureFn(mergedProps, area, p))
    );
    p.getContext().transform(mat);
  }

  if (child.type.draw) {
    child.type.draw(mergedProps, area, p);
  }

  Children.forEach(child.props.children, drawChild(mergedProps, area, p));

  if (child.props.transform) {
    p.getContext().restore();
  }
};

const Area = props => {
  const { children } = props;

  const draw = useCallback(
    (area, p) => {
      const pseudoChild = {
        type: {
          measureFn: (props, area, p) => ({
            width: p.getAreaWidth(),
            height: p.getAreaHeight(),
          }),
        },
        props,
      };

      drawChild({}, area, p)(pseudoChild);
    },
    [children] // TODO Other "relevant props" i.e. transform, stroke, fill, etc.
  );
  const onMouseEvent = useCallback(() => {}, []);
  const onMouseCrossed = useCallback(() => {}, []);
  const onDragBroken = useCallback(() => {}, []);
  const onKeyEvent = useCallback(() => {}, []);

  return React.createElement(
    HasAreaParentContext.Provider,
    { value: true },
    React.createElement(AreaInternal, {
      draw,
      onMouseEvent,
      onMouseCrossed,
      onDragBroken,
      onKeyEvent,
      layoutStretchy: props.layoutStretchy,
    })
  );
};

Area.Rectangle = () => null;
Area.Rectangle.defaultProps = {
  x: 0,
  y: 0,
};
Area.Rectangle.draw = (props, area, p) => {
  const path = new libui.UiDrawPath(libui.fillMode.winding);
  path.addRectangle(props.x, props.y, props.width, props.height);
  path.end();

  if (props.stroke && props.stroke != 'none') {
    const sp = new libui.DrawStrokeParams();

    switch (props.strokeLinecap) {
      case 'flat':
        sp.cap = libui.lineCap.flat;
        break;
      case 'round':
        sp.cap = libui.lineCap.round;
        break;
      case 'square':
        sp.cap = libui.lineCap.square;
        break;
    }

    switch (props.strokeLinejoin) {
      case 'miter':
        sp.join = libui.lineJoin.miter;
        break;
      case 'round':
        sp.join = libui.lineJoin.round;
        break;
      case 'bevel':
        sp.join = libui.lineJoin.bevel;
        break;
    }

    sp.thickness = Number(props.strokeWidth);
    sp.miterLimit = Number(props.strokeMiterlimit);

    if (typeof props.stroke == 'object') {
      // gradient
      p.getContext().stroke(path, props.stroke, sp);
    } else {
      // solid
      const strokeBrush = createBrush(
        Color(props.stroke),
        Number(props.strokeOpacity)
      );
      p.getContext().stroke(path, strokeBrush, sp);
      strokeBrush.free();
    }

    sp.free();
  }

  if (props.fill && props.fill != 'none') {
    if (typeof props.fill == 'object') {
      // gradient
      p.getContext().fill(path, props.fill);
    } else {
      // solid
      const fillBrush = createBrush(
        Color(props.fill),
        Number(props.fillOpacity)
      );
      p.getContext().fill(path, fillBrush);
      fillBrush.free();
    }
  }

  return path;
};
Area.Rectangle.measureFn = (props, area, p) => ({
  width: props.width,
  height: props.height,
});

class AreaOld extends Component {
  render() {
    const {
      children,
      stretchy,
      label,
      column,
      row,
      span,
      expand,
      align,
      onMouseMove,
      onMouseUp,
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      onKeyUp,
      onKeyDown,
      onSizeChange,
      scrolling,
      ...groupProps
    } = this.props;
    const areaProps = {
      children,
      stretchy,
      label,
      column,
      row,
      span,
      expand,
      align,
      onMouseMove,
      onMouseUp,
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      onKeyUp,
      onKeyDown,
      onSizeChange,
      scrolling,
    };
  }
}

function toLibuiColor(color, alpha = 1) {
  return new libui.Color(
    color.red() / 255,
    color.green() / 255,
    color.blue() / 255,
    color.alpha() * alpha
  );
}

Area.Gradient = class AreaGradient {
  static create(options) {
    const brush = new libui.DrawBrush();

    brush.type = options.type;
    brush.start = new libui.Point(options.x1, options.y1);
    brush.end = new libui.Point(options.x2, options.y2);
    brush.outerRadius = options.r || 0;

    brush.stops = Object.entries(options.stops).map(
      ([stop, color]) =>
        new libui.BrushGradientStop(stop, toLibuiColor(Color(color)))
    );

    return brush;
  }

  static createLinear(x1, y1, x2, y2, stops) {
    return AreaGradient.create({
      type: libui.brushType.linearGradient,
      x1,
      y1,
      x2,
      y2,
      stops,
    });
  }

  static createRadial(x, y, x_r, y_r, r, stops) {
    if (!r) {
      // createRadial(x, y, r, stops)
      r = x_r;
      stops = y_r || {};
      return AreaGradient.create({
        type: libui.brushType.radialGradient,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        r,
        stops,
      });
    } else {
      // createRadial(x, y, x_r, y_r, r, stops)
      return AreaGradient.create({
        type: libui.brushType.radialGradient,
        x1: x,
        y1: y,
        x2: x_r,
        y2: y_r,
        r,
        stops,
      });
    }
  }
};

Area.propTypes = {
  ...AreaComponentPropTypes,
};

Area.defaultProps = {
  ...AreaComponentDefaultProps,
};
export { HasAreaParentContext };
export default Area;
