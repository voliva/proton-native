import React, { Children, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AreaInternal } from '../';
import libui from 'libui-node';
import Color from 'color';
import {
  getTransformationMatrix,
  strokePath,
  fillPath,
  toLibuiColor
} from './areaHelpers';

const HasAreaParentContext = React.createContext(false);

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
  const { children, transform, stroke, fill, strokeWidth } = props;

  const draw = useCallback(
    (area, p) => {
      const pseudoChild = React.createElement(Area.Group, {
        transform, stroke, fill, strokeWidth
      }, children);
      drawChild({}, area, p)(pseudoChild);
    },
    [children, transform, stroke, strokeWidth, fill]
  );

  const { onMouseUp, onMouseDown, onMouseMove, } = props;
  const onMouseEvent = useCallback((area, evt) => {
    const baseEvent = {
      x: evt.getX(),
      y: evt.getY(),
      width: evt.getAreaWidth(),
      height: evt.getAreaHeight()
    };

    const down = evt.getDown();
    const up = evt.getUp();
    if (up) {
      if(!onMouseUp) return;
      return onMouseUp({
        ...baseEvent,
        button: up,
      });
    }

    if (down) {
      if(!onMouseDown) return;
      return onMouseDown({
        ...baseEvent,
        button: down,
        count: evt.getCount(),
      });
    }

    if(!onMouseMove) return;

    const buttons = [];
    const held = evt.getHeld1To64();
    if (held > 0) {
      for (let i = 0; i <= 6; i++) {
        if (held & Math.pow(2, i)) buttons.push(i + 1);
        if (!(held >> (i + 1))) break;
      }
    }
    onMouseMove({
      ...baseEvent,
      buttons,
    });
  }, [onMouseUp, onMouseDown, onMouseMove]);
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

  strokePath(props, path, p);
  fillPath(props, path, p);

  return path;
};
Area.Rectangle.measureFn = (props, area, p) => ({
  width: props.width,
  height: props.height,
});

Area.Group = () => null;
Area.Group.measureFn = (props, area, p) => ({
  width: p.getAreaWidth(),
  height: p.getAreaHeight(),
});

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
