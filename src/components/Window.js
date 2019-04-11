import { UiWindow, Size } from 'libui-node';

export default (props, layoutProps) => {
  const {
    title,
    height = 400,
    width = 300,
    initialHasMenuBar = true,
  } = props;

  let attachedChild = null;

  const widget = UiWindow(
    title,
    width,
    height,
    initialHasMenuBar
  );

  widget.onClosing(() => {
    if(props.onClose) {
      props.onClose();
    }
  });

  widget.onContentSizeChanged(() => {
    if(props.onContentSizeChanged) {
      props.onContentSizeChanged(
        widget.contentSize.w,
        widget.contentSize.h
      );
    }
  });

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

  const updateProps = changes => {
    props = {
      ...props,
      ...changes
    };

    if(changes.title) {
      widget.title = props.title;
    }
    if(changes.width || changes.height) {
      widget.setContentSize(new Size(
        props.width || widget.contentSize.w,
        props.height || widget.contentSize.h
      ));
    }
    if(changes.margined) {
      widget.margined = props.margined;
    }
    if(changes.fullscreen) {
      widget.fullscreen = props.fullscreen;
    }
    if(changes.borderless) {
      widget.borderless = props.borderless;
    }
  }

  updateProps(props);

  return {
    widget,
    layoutProps,
    appendChild,
    insertChild: appendChild,
    removeChild,
    updateProps
  };
};
