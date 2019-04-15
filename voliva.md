
# Changes

## Components

The implementation of components now favours composition over inheritance. I think this makes it more maintainble and we don't need to override methods of the generic `DesktopComponent` to get our components working - Instead, if there's code shared between them, we just create a generic function that will hold that code.

Take `VerticalBox` for instance - when it gets called, it creates the element so it's available for the renderer to add/remove it as needed, and then, as it's a container (it can hold other elements) it needs to implement `appendChild`, `insertChild` and `removeChild` for our renderer. These 3 methods would be the same ones to `HorizontalBox`, so I created a function `StackContainer` which implmenets these 3 methods.

Another thing I changed are layoutProps: I just prefixed those props with `layout` (as in `layoutStretchy`) which **for our renderer** means that this prop doesn't belong to the own element, but to how the parent instantiates this element, and **for the consumer** it means that changing this prop will cause elements to go away and reappear (as the only way to change it is by removing and re-adding the element).

## TextInput.Entry

For `Entry` component I made a small change I'm not too sure it's right: Influenced by DOM, I made the prop for the text value of the field to be `value` instead of just `children`. Anyway, this change is not too relevant, it might go away.

A more substantial change is that I'm making this component controlled: Previously, if the consumer had something bound to Entry's text and `onChange` didn't change anything, the component would show the updated text and ignores the consumer's value, which can make for some unexpected behaviours.

Another example of how I applied composition here is when handling prop updates: I made a function enhancer called `propsUpdater` where it will listen to prop changes and mutate values based on the parameters you give it. This way, if it covers your case then great! just use it - Otherwise you can just implement your own `updateProps` function.

This has a problem though - in libui-Windows there's a bug where updating the value of a text field, it resets the position of the cursor to the start of the field, making typing in stuff quite hard. It does work as expected in libui-Linux, so it's probably just something that would need a fix on libui level.

## App

App is not a component anymore - It just represents the root container. In here I tried to make a distinction between those elements that are containers (they can hold more elements, like App, Box, etc.) and those which don't (like TextEntry)

The `render` function created by the reconciler takes two parameters: The react element you want to render and a container. In ReactDOM, that's a DOM element - here we need to define what is our container. In this case, a container is an element that implements the funcitons `appendChild`, `insertChild` and `removeChild`, functions needed by our custom renderer when adding/removing elements.

So all what `App` does is implement all these methods, by accepting only `Window` elements. When a `Window` is added as a child, it `show()`s it, and when it's removed, it `close()`s it.

## Area

The way I understand root components is just the interface between React and libui-node. The idea I had initially was to make area sub-elements as pseudo-react elements: This is, elements that where React renders nothing, but it's used by `react-components/Area` to know what it needs to draw on. The problem this had is that then you can't create a sub-component for your Area (for instance, to customize a Rectangle), which breaks the principle of composability.

So what I did is to make a libui.Area wrapper which works in the way I expect: I can add/remove stuff to a group and it gets repainted, just like if it were DOM - I called this wrapper `ComposableArea`. This way, I can create renderer definitions for each element and react will add/remove them.

Another thing I changed, which I think it makes sense, has to do with relative sizing and `transform`. I personally rather the CSS way: everything in `transform` is relative to the own element, and others are relative to the parent.

This makes centering an `Area.Rectangle` trivial: `<Area.Rectangle x="50%" y="50%" transform="translate(-50%)" />`

Also, I used `context.save()` and `context.restore()` in a way where it's easier to apply transformation matrixes to an element and all of its descendants: For each child in the Area, call `context.save()`, apply transformations, draw child and its children (recursive call) and end with `context.restore()`.

This easily allowed me to do an inverse matrix transform on mouse events to get the position of the mouse relative to an element, and now `Area.Rectangle` also supports `move`, `down` and `up` mouse events.

