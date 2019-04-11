import React, { useState, useCallback } from 'react';

import { render, Window, App, TextInput, Dialog, VerticalBox } from './src/';

const Example = () => {
	const [stretchy, setStretchy] = useState(true);

	const toggleStretchy = useCallback(() => setStretchy(s => !s), [setStretchy]);

	return <Window>
		<VerticalBox>
			<TextInput stretchy={stretchy} />
			<TextInput onChanged={toggleStretchy} />
		</VerticalBox>
	</Window>
}

import {
	UiMenu,
} from 'libui-node';

const menu = new UiMenu('File');
menu.appendQuitItem();

const app = new App();

render(<Example />, app);

