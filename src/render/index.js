import { connectDevtools } from '../devtools';
import NewRenderer from '../reconciler';

function render(element, window) {
  connectDevtools(NewRenderer);

  const container = NewRenderer.createContainer(window);
  NewRenderer.updateContainer(element, container, null);
}

export default render;
