import { UiWindow, Size } from 'libui-node';
import { UnaryContainer } from './Container';
import propsUpdater from './propsUpdater';

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

  const handlers = {
    onClose: props.onClose,
    onContentSizeChanged: props.onContentSizeChanged
  }

  element.onClosing(() => {
    if(handlers.onClose) {
      handlers.onClose();
    }
  });

  element.onContentSizeChanged(() => {
    if(handlers.onContentSizeChanged) {
      handlers.onContentSizeChanged(
        element.contentSize.w,
        element.contentSize.h
      );
    }
  });

  const updateProps = propsUpdater(
    [element, 'title', 'margined', 'fullscreen', 'borderless'],
    [handlers, 'onClose', 'onContentSizeChanged'],
    {
      width: width => element.setContentSize(new Size(
        width,
        element.contentSize.h
      )),
      height: height => element.setContentSize(new Size(
        element.contentSize.w,
        height
      ))
    }
  )

  updateProps(props);

  return {
    ...containerProps,
    element,
    updateProps
  };
};
