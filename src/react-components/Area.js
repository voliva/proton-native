import React, { Children, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AreaInternal } from '../';
import libui from 'libui-node';
import Color from 'color';
import {
  getTransformationMatrix,
  strokePath,
  fillPath,
  toLibuiColor,
  parseSize,
  createParsers
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

const drawChild = (parentProps, parentParsers, area, p) => child => {
  if (typeof child !== 'object' || !child.type) {
    return;
  }

  const mergedProps = {
    ...parentProps,
    ...child.props,
  };

  const ownSize = child.type.getSize(mergedProps, parentParsers, area, p);

  if (child.props.transform) {
    p.getContext().save();
    const mat = getTransformationMatrix(
      child.props.transform,
      ownSize
    );
    p.getContext().transform(mat);
  }

  if (child.type.draw) {
    child.type.draw(mergedProps, parentParsers, area, p);
  }

  Children.forEach(child.props.children, drawChild(mergedProps, createParsers(ownSize), area, p));

  if (child.props.transform) {
    p.getContext().restore();
  }
};

const captureChildMouseEvent = (parentProps, evt, parentParsers, area, contextMat) => child => {
  if (typeof child !== 'object' || !child.type) {
    return false;
  }

  const {
    onMouseUp,
    onMouseDown,
    onMouseMove,
    ...rest
  } = parentProps;

  const mergedProps = {
    ...rest,
    ...child.props,
  };

  const ownSize = child.type.getSize(mergedProps, parentParsers, area);

  if (child.props.transform) {
    // Copy Matrix
    const oldMat = contextMat;

    // Seems like transform is applied by pre-multiplying
    // https://github.com/andlabs/libui/blob/cda991b7e252874ce69ccdb7d1a40de49cee5839/windows/draw.cpp#L410
    contextMat = getTransformationMatrix(
      child.props.transform,
      ownSize
    );
    contextMat.multiply(oldMat);
  }

  let captured = false;
  const childFn = captureChildMouseEvent(mergedProps, evt, createParsers(ownSize), area, contextMat);
  Children.forEach(child.props.children, child => {
    if(captured) return;
    captured = childFn(child);
  });

  if (captured) {
    return true;
  }

  if (!child.type.captureMouseEvent) {
    return false;
  }

  if(!contextMat.invertible) {
    console.warn('Matrix is not invertible, we can\'t capture mouse event per child');
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

  return child.type.captureMouseEvent(mergedProps, targetEvt, area);
}

const identity = new libui.UiDrawMatrix();
identity.setIdentity();
const Area = props => {
  const { children, transform, stroke, fill, strokeWidth } = props;

  const pseudoChild = useMemo(() =>
    React.createElement(
      Area.Group,
      props,
      children
    ),
    [props]
  );

  const draw = useCallback(
    (area, p) => {
      try {
        drawChild({}, createParsers({
          width: p.getAreaWidth(),
          height: p.getAreaHeight()
        }), area, p)(pseudoChild);
      }catch (ex) {
        console.error(ex);
      }
    },
    [pseudoChild]
  );

  const { onMouseUp, onMouseDown, onMouseMove, } = props;
  const onMouseEvent = useCallback((area, evt, ...args) => {
    const event = {
      x: evt.getX(),
      y: evt.getY(),
      width: evt.getAreaWidth(),
      height: evt.getAreaHeight()
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

    captureChildMouseEvent({}, event, createParsers(event), area, identity)(pseudoChild);
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
Area.Rectangle.draw = (props, { parseX, parseY }, area, p) => {
  const path = new libui.UiDrawPath(libui.fillMode.winding);

  const {width, height} = Area.Rectangle.getSize(props, { parseX, parseY }, area, p);

  path.addRectangle(
    parseX(props.x),
    parseY(props.y),
    width,
    height
  );
  path.end();

  strokePath(props, path, p);
  fillPath(props, path, p);

  return path;
};
Area.Rectangle.getSize = (props, { parseX, parseY }, area, p) => ({
  width: parseX(props.width),
  height: parseY(props.height),
});
Area.Rectangle.captureMouseEvent = (props, evt, area) => {
  if(!props[evt.type]) return false;

  if(evt.targetX >= props.x && evt.targetX <= props.x + props.width &&
    evt.targetY >= props.y && evt.targetY <= props.y + props.height
  ) {
    return props[evt.type](evt);
  }
};

Area.Group = () => null;
Area.Group.getSize = (props, { parseX, parseY }, area, p) => ({
  width: parseX(props.width || '100%'),
  height: parseY(props.height || '100%')
});
Area.Group.captureMouseEvent = (props, evt, area) => {
  if(!props[evt.type]) return false;

  return props[evt.type](evt);
};

Area.Bezier = () => null;
Area.Bezier.draw = (props, { parseX, parseY }, area, p) => {
  const path = new libui.UiDrawPath(libui.fillMode.winding);

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
  fillPath(props, path, p);

  return path;
};
Area.Bezier.getSize = (props, { parseX, parseY }, area, p) => ({
  width: parseX(props.width || '100%'),
  height: parseY(props.height || '100%')
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
