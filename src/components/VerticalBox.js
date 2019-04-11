import libui from 'libui-node';
import { StackContainer } from './Container';

export default props => {
  const element = new libui.UiVerticalBox();

  const containerProps = StackContainer(
    child => element.append(child.element, child.layoutProps.layoutStretchy),
    (child, i) => element.deleteAt(i)
  )

  return {
    ...containerProps,
    element
  };
};
