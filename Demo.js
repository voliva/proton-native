import React, { useState, useCallback, useEffect } from 'react';

import {
  render,
  Window,
  App,
  Area,
  TextInput,
  Dialog,
  VerticalBox,
} from './src/';

import { UiMenu } from 'libui-node';

const menu = new UiMenu('File');
menu.appendQuitItem();

const app = new App();

const Example = () => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setValue(v => v + 1);
    }, 60);
  }, []);

  return (
    <Window
      title="Test"
      width={500}
      height={500}
      margined={true}
      onClose={app.quit}
    >
      <VerticalBox>
        <Area stroke="red" strokeWidth="10" layoutStretchy={true}>
          <Area.Rectangle
            width="100"
            height="200"
            fill="blue"
            transform={`translate(50%) rotate(${value})`}
          />
        </Area>
      </VerticalBox>
    </Window>
  );
};

render(<Example />, app);
