import libui from 'libui-node';
import Color from 'color';

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

export function toLibuiColor(color, alpha = 1) {
  return new libui.Color(
    color.red() / 255,
    color.green() / 255,
    color.blue() / 255,
    color.alpha() * alpha
  );
}

export function createBrush(color, alpha) {
  const brush = new libui.DrawBrush();
  brush.color = toLibuiColor(color);
  brush.color.alpha = brush.color.alpha * alpha;
  brush.type = libui.brushType.solid;

  return brush;
}

export const logMatrix = (mat, label) => {
  console.log(label, mat.m11, mat.m21, mat.m31);
  console.log(label, mat.m12, mat.m22, mat.m32);
}

export const getTransformationMatrix = (transformProp, measureFn = false) => {
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
    const relativeOrigin = new libui.PointDouble(
      fallback(relativeOriginX, '50%', v => parseSelf(v, false)),
      fallback(relativeOriginY, '50%', v => parseSelf(v, true))
    );
    const {x, y} = mat.transformPoint(relativeOrigin);

    return {
      x: current.x + x,
      y: current.y + y
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
      mat.multiply(newMat);
    }
  }

  return mat;
};

export const strokePath = (strokeProps, path, p) => {
  if (strokeProps.stroke && strokeProps.stroke != 'none') {
    const sp = new libui.DrawStrokeParams();

    switch (strokeProps.strokeLinecap) {
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

    switch (strokeProps.strokeLinejoin) {
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

    sp.thickness = Number(strokeProps.strokeWidth);
    sp.miterLimit = Number(strokeProps.strokeMiterlimit);

    if (typeof strokeProps.stroke == 'object') {
      // gradient
      p.getContext().stroke(path, strokeProps.stroke, sp);
    } else {
      // solid
      const strokeBrush = createBrush(
        Color(strokeProps.stroke),
        Number(strokeProps.strokeOpacity)
      );
      p.getContext().stroke(path, strokeBrush, sp);
      strokeBrush.free();
    }

    sp.free();
  }
}

export const fillPath = (fillProps, path, p) => {
  if (fillProps.fill && fillProps.fill != 'none') {
    if (typeof fillProps.fill == 'object') {
      // gradient
      p.getContext().fill(path, fillProps.fill);
    } else {
      // solid
      const fillBrush = createBrush(
        Color(fillProps.fill),
        Number(fillProps.fillOpacity)
      );
      p.getContext().fill(path, fillBrush);
      fillBrush.free();
    }
  }
}
