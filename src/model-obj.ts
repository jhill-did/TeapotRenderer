import { Texture } from './core';
import { Vec2, vec2 } from './maths/vec2';
import { Vec4, vec4 } from './maths/vec4';

type VertexIndices = {
  v1: number;
  v2: number;
  v3: number;
};

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

  diffuseMap: Texture;
  normalMap: Texture;
};

export function loadObj(objFileData: string): Model {
  const output: Model = {
    vertices: [],
    uvs: [],
    normals: [],
    triangles: [],
    diffuseMap: null,
    normalMap: null,
  };

  const lines = objFileData.split('\n');
  for (const line of lines) {
    const tokens = line.split(' ');
    if (tokens[0] === 'v') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      output.vertices.push(vec4(x, y, z, 1));
    }

    if (tokens[0] === 'vn') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      output.normals.push(vec4(x, y, z, 1));
    }

    if (tokens[0] === 'vt') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      output.uvs.push(vec2(x, y));
    }

    if (tokens[0] === 'f') {
      // Take note: This converts index positions to be zero based.
      const v1Indices = tokens[1].split('/');
      const v2Indices = tokens[2].split('/');
      const v3Indices = tokens[3].split('/');

      const triangle: Triangle = {
        vertices: {
          v1: Number.parseInt(v1Indices[0]) - 1,
          v2: Number.parseInt(v2Indices[0]) - 1,
          v3: Number.parseInt(v3Indices[0]) - 1,
        },
        uvs: {
          v1: Number.parseInt(v1Indices[1]) - 1,
          v2: Number.parseInt(v2Indices[1]) - 1,
          v3: Number.parseInt(v3Indices[1]) - 1,
        },
        normals: {
          v1: Number.parseInt(v1Indices[2]) - 1,
          v2: Number.parseInt(v2Indices[2]) - 1,
          v3: Number.parseInt(v3Indices[2]) - 1,
        },
      };

      output.triangles.push(triangle);
    }
  }

  return output;
}
