import { UiWindow } from 'libui-node';

export default (initialProps, layoutProps) => {
  const {
    title,
    initialHeight = 400,
    initialWidth = 300,
    initialHasMenuBar = true,
  } = initialProps;

  let attachedChild = null;

  const widget = UiWindow(
    title,
    initialHeight,
    initialWidth,
    initialHasMenuBar
  );
  const appendChild = child => {
    if (!child.widget) {
      throw new Error(`Window child doesnt have any widget`);
    }
    if (attachedChild) {
      throw new Error(`Window can only have 1 child`);
    }

    attachedChild = child;
    widget.setChild(child.widget);
  };
  const removeChild = () => {
    throw new Error(`Can't remove children from window`);
  };

  return {
    type: 'Window',
    widget,
    layoutProps,
    appendChild,
    insertChild: appendChild,
    removeChild,
  };
};
