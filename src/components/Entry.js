import libui from 'libui-node';
import propsUpdater from './propsUpdater';

/*
interface Component {
  element?: LibUIWidget;
  layoutProps?: any;
  parent?: Component;
  appendChild?: (child) => void;
  insertChild?: (child, i) => void;
  removeChild?: (child, i) => void;
  updateProps?: changes => void;
  updateLayout?: (child) => void;
  finishUpdate?: () => void;
}
*/

export default (props) => {
  const element = new libui.UiEntry();

  const handlers = {
    onChange: props.onChange
  };

  element.onChanged(() => {
    if (props.value !== element.text) {
      if (handlers.onChange) {
        handlers.onChange(element.text);
      }
      if (props.value != undefined) {
        element.setText(props.value);
      }
    }
  });

  const updateProps = propsUpdater(
    {
      value: value => element.setText(value)
    },
    [handlers, 'onChange']
  );

  updateProps(props);

  return {
    element,
    updateProps
  };
};
