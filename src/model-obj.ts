import { Vec2, vec2 } from './maths/vec2';
import { Vec3, vec3 } from './maths/vec3';
import { Model } from './model';

export function loadObj(objFileData: string): Model {
  type Vertex = {
    position: Vec3;
    normal: Vec3;
    uv: Vec2;
  };

  const obj = {
    vertices: [] as Vertex[],
    positions: [] as Vec3[],
    normals: [] as Vec3[],
    uvs: [] as Vec2[],
  };

  const lines = objFileData.split('\n');
  for (const line of lines) {
    const tokens = line.split(' ');
    if (tokens[0] === 'v') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      obj.positions.push(vec3(x, y, z));
    }

    if (tokens[0] === 'vn') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      obj.normals.push(vec3(x, y, z));
    }

    if (tokens[0] === 'vt') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      obj.uvs.push(vec2(x, y));
    }

    if (tokens[0] === 'f') {
      // Take note: This converts index positions to be zero based.
      const v1Indices = tokens[1].split('/');
      const v2Indices = tokens[2].split('/');
      const v3Indices = tokens[3].split('/');

      // v1.
      obj.vertices.push({
        position: obj.positions[Number.parseInt(v1Indices[0]) - 1],
        uv: obj.uvs[Number.parseInt(v1Indices[1]) - 1],
        normal: obj.normals[Number.parseInt(v1Indices[2]) - 1],
      });

      // v2.
      obj.vertices.push({
        position: obj.positions[Number.parseInt(v2Indices[0]) - 1],
        uv: obj.uvs[Number.parseInt(v2Indices[1]) - 1],
        normal: obj.normals[Number.parseInt(v2Indices[2]) - 1],
      });

      // v3.
      obj.vertices.push({
        position: obj.positions[Number.parseInt(v3Indices[0]) - 1],
        uv: obj.uvs[Number.parseInt(v3Indices[1]) - 1],
        normal: obj.normals[Number.parseInt(v3Indices[2]) - 1],
      });
    }
  }

  const vertexSize = 3 + 3 + 2;
  const bufferSize = obj.vertices.length * vertexSize;

  const output: Model = {
    vertices: new Float32Array(bufferSize),
    vertexSize,
    textures: [],
  };

  // Write interleaved vertex data into our vertex buffer.
  for (let index = 0; index < obj.vertices.length; index += 1) {
    const { position, normal, uv } = obj.vertices[index];
    const vertexIndex = index * vertexSize;
    output.vertices[vertexIndex + 0] = position[0];
    output.vertices[vertexIndex + 1] = position[1];
    output.vertices[vertexIndex + 2] = position[2];

    output.vertices[vertexIndex + 3] = normal[0];
    output.vertices[vertexIndex + 4] = normal[1];
    output.vertices[vertexIndex + 5] = normal[2];

    output.vertices[vertexIndex + 6] = uv[0];
    output.vertices[vertexIndex + 7] = uv[1];
  }

  return output;
}
