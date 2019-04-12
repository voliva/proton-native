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

const getTransformationMatrix = (transformProp, measureFn) => {
  const mat = new libui.UiDrawMatrix();
  mat.setIdentity();

  for (const transform of transformProp.match(/\w+\([^)]+\)/g)) {
    // translate(x [y])
    // default y: x
    const translate = transform.match(
      /translate\s*\(\s*([-0-9.%]+)(?:\s*,\s*([-0-9.%]+))?\s*\)/
    );
    if (translate) {
      mat.translate(translate[1], fallback(translate[2], translate[1]));
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
    p.getContext().transform(getTransformationMatrix(child.props.transform));
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
        type: {},
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
