import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
let exprBox = ce.parse('x^2 + a');
let subX = ce.box(['Add', 'x', 2]);
let res = exprBox.subs({ x: subX });
console.log(res.latex);
