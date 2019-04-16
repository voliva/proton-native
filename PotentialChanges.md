
# Changes

## Components

The fact that all of the components are classes extending a DesktopComponent, which tries its best to be as generic as possible, but then it's up to base classes to override/implement some methods, made it a bit confusing to me. I changed it so that now it favours composition over inheritance. I think this makes it more maintainble, as it gets easier to understand (again, IMO) because you can see what a specific component does without needing to dig around parent classes. Instead, if there's code shared between them, we just create a generic function that will hold that code.

So all we need to think is that our renderer needs elements with *some of* the following methods:
* `appendChild`
* `insertChild`
* `removeChild`
* `updateProps`
* `updateLayout` (More on this later)

Take `VerticalBox` for instance - when it gets called, it creates the element so it's available for the renderer to add/remove it as needed, and then, as it's a container (it can hold other elements) it just needs to implement `appendChild`, `insertChild` and `removeChild` for our renderer. These 3 methods would be the same ones to `HorizontalBox`, so I created a function `StackContainer` which creates these 3 methods, that can later be used by VerticalBox and HorizontalBox.

I could also see a similar pattern when writing `updateProps`, so I created a helper function which I named `propsUpdater` that factors out the common bit.

Another thing I changed are layoutProps: I just prefixed those props with `layout` (as in `layoutStretchy`) which **for our renderer** means that this prop doesn't belong to the own element, but to how the parent instantiates this element (so it will call `updateLayout` of the parent element instead), and **for the consumer** it means that changing this prop will cause elements to go away and reappear (as the only way to change it is by removing and re-adding the element).

## App

React components shouldn't be singletons. App component felt a bit special, as it didn't only initialize libui, but you were supposed to have only one - Plus window management was a bit weird: You could close windows, and those windows would still be in the children of App. The way I see react is as a pure description of what should be rendered: If a component returns a `Window` as its children, that window should be displayed.

So App is not a component anymore - It just represents the root container. The `render` function created by the reconciler takes two parameters: The react element you want to render and a container. In ReactDOM, that container is a DOM element. In here App is just the starting point of proteon, it initializes libui and returns a container we can use in `ProteonRenderer.render(element, container)`. When a `Window` is added as a child, it `show()`s it, and when it's removed as a child, it `close()`s it.

## TextInput.Entry

For `Entry` component I made a small change I'm not too sure it's right: Influenced by DOM, I made the prop for the text value of the field to be `value` instead of just `children`. Anyway, this change is not too relevant, it might go away.

A more substantial change is that I'm making this component controlled: Previously, if the consumer had something bound to Entry's text and `onChange` didn't change anything, the component would show the updated text and ignores the consumer's value, which can make for some unexpected behaviours.

This has a problem though - in libui-Windows there's a bug where updating the value of a text field, it resets the position of the cursor to the start of the field, making typing in stuff quite hard when it's controlled. It does work as expected in libui-Linux, so it's probably just something that would need a fix on libui level.

## Area

The way I understand root components is just the interface between React and libui-node. The idea I had initially was to make area sub-elements as pseudo-react elements: This is, elements that where React renders nothing, but it's used by `react-components/Area` to know what it needs to draw on - This made thinking over it much easier, as you didn't need to think about how the reconciler works when adding/removing items from the component, as it becomes a regular react component. The problem this idea had is that then you can't create a sub-component for your Area (for instance, to customize a Rectangle), which breaks the principle of composability.

So what I did is to make a libui.Area wrapper which works in the way I need: I can add/remove stuff to a group and it gets repainted, just like if it were DOM - I called this wrapper `ComposableArea`. This way, I can create renderer definitions (in `components/Area`) for each element and react will add/remove them.

Another thing I changed, which I think it makes sense, has to do with relative sizing and `transform`. I personally rather the CSS way: everything in `transform` is relative to the own element, and others are relative to the parent, as this makes centering an `Area.Rectangle` trivial: `<Area.Rectangle x="50%" y="50%" transform="translate(-50%)" />`. Also, a `matrix` transform multiplies the matrix values instead of replacing it.

I also used `context.save()` and `context.restore()` in a way where it's easier to apply transformation matrixes to an element and all of its descendants: For each child in the Area, call `context.save()`, apply transformations, draw child and its children (recursive call - which can potentially stack more contexts on top) and end with `context.restore()`.

This easily allowed me to do an inverse matrix transform on mouse events to get the position of the mouse relative to an element, and now `Area.Rectangle` also supports `move`, `down` and `up` mouse events.
