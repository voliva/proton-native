import { UiWindow, Size } from 'libui-node';
import { UnaryContainer } from './Container';

export default props => {
  const {
    title,
    height = 400,
    width = 300,
    initialHasMenuBar = true,
  } = props;

  const element = UiWindow(
    title,
    width,
    height,
    initialHasMenuBar
  );

  const containerProps = UnaryContainer(
    child => element.setChild(child.element)
  );

  element.onClosing(() => {
    if(props.onClose) {
      props.onClose();
    }
  });

  element.onContentSizeChanged(() => {
    if(props.onContentSizeChanged) {
      props.onContentSizeChanged(
        element.contentSize.w,
        element.contentSize.h
      );
    }
  });

  const updateProps = changes => {
    props = {
      ...props,
      ...changes
    };

    if(changes.title) {
      element.title = props.title;
    }
    if(changes.width || changes.height) {
      element.setContentSize(new Size(
        props.width || element.contentSize.w,
        props.height || element.contentSize.h
      ));
    }
    if(changes.margined) {
      element.margined = props.margined;
    }
    if(changes.fullscreen) {
      element.fullscreen = props.fullscreen;
    }
    if(changes.borderless) {
      element.borderless = props.borderless;
    }
  }

  updateProps(props);

  return {
    ...containerProps,
    element,
    updateProps
  };
};
