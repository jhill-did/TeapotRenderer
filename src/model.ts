import { Vec2, vec2 } from './maths/vec2';
import { Vec3 } from './maths/vec3';
import { Vec4, vec4 } from './maths/vec4';
import { Texture, loadImage } from './texture';
import { loadObj } from './model-obj';

// TODO: Would be nice to have indexed model support.
export type Model = {
  vertices: Float32Array;
  vertexSize: number;
  textures: Texture[];
};

type ModelType = 'obj';

const loaders: Record<ModelType, (path: string) => Model> = {
  obj: loadObj,
};

type ModelFile = {
  version: 0,
  modelPath: string;
  texturePaths: string[];
};

const directoryName = (path: string) => (
  path.split('/').slice(0, -1).join('/')
);

const join = (a: string, b: string) => [a, b].join('/');

// Loads a json file describing a model.
export const loadModel = async (path: string): Promise<Model> => {
  const { modelPath, texturePaths } = await fetch(path)
    .then(response => response.json() as Promise<ModelFile>);

  const directory = directoryName(path);

  // Check the extension on our model.
  const modelFormat = modelPath.slice(modelPath.lastIndexOf('.') + 1) as ModelType; // TODO: This is not robust
  const load = loaders[modelFormat];

  const model = await fetch(join(directory, modelPath))
    .then(response => response.text())
    .then(load)

  const textures = await Promise.all(
    texturePaths
      .map(texturePath => join(directory, texturePath))
      .map(loadImage)
  );

  return { ...model, textures };
};
