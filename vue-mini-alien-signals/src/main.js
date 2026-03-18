import { runDemo1 } from './demos/demo1-basic.js';
import { runDemo2 } from './demos/demo2-computed.js';
import { runDemo3 } from './demos/demo3-diamond.js';
import { runDemo4 } from './demos/demo4-batch.js';
import { runDemo5 } from './demos/demo5-dynamic.js';
import { runDemo6 } from './demos/demo6-vs-old.js';

const main = document.querySelector('main');

runDemo1(main);
runDemo2(main);
runDemo3(main);
runDemo4(main);
runDemo5(main);
runDemo6(main);
