import { Vec2, vec2 } from './maths/vec2';
import { Vec4, vec4 } from './maths/vec4';
import { Texture, loadImage } from './texture';
import { loadObj } from './model-obj';

type VertexIndices = {
  v1: number;
  v2: number;
  v3: number;
};

// TODO: This is really obj specific.
export type Triangle = {
  vertices: VertexIndices,
  uvs: VertexIndices,
  normals: VertexIndices,
};

// TODO(Jordan): This model format kinda sucks ass.
export type Model = {
  vertices: Vec4[];
  uvs: Vec2[];
  normals: Vec4[];
  triangles: Triangle[];
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
  const modelFormat = modelPath.slice(modelPath.lastIndexOf('.') + 1) as ModelType; // TODO: This is not robus
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
