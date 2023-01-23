import { Model } from './model';
import { Mat4 } from './maths/Mat4';
export { makeGraphics as makeSoftwareGraphics } from './graphics-software/software';
export { makeGraphics as makeWebGlGraphics } from './graphics-webgl/webgl';

export type Graphics = {
  makeDrawCall: (model: Model) => (
    perspectiveTransform: Mat4,
    modelTransform: Mat4,
  ) => void,
};
