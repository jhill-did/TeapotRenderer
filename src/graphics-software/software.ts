import { Graphics } from '../graphics';
import { Canvas } from './canvas';
import { Model } from '../model';
import { Vec2 } from '../maths/vec2';
import { Vec3 } from '../maths/vec3';
import { rasterizeTriangle } from './rasterize';
import { Mat4, transformVec4 } from '../maths/mat4';
import {
  vec4,
  subtract,
  cross,
  normalized,
  dot,
} from '../maths/vec4';

export const makeRender = (context: CanvasRenderingContext2D) => {
  const { width: canvasWidth, height: canvasHeight } = context.canvas;

  return (model: Model, perspectiveTransform: Mat4, modelTransform: Mat4) => {
    context.clearRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);

    const canvas = new Canvas(context);

    const {
      vertices,
      vertexSize,
    } = model;

    const getVertex = (index: number) => {
      const vertexIndex = index * vertexSize;

      return {
        position: [
          vertices[vertexIndex + 0],
          vertices[vertexIndex + 1],
          vertices[vertexIndex + 2],
        ] as Vec3,
        normal: [
          vertices[vertexIndex + 3],
          vertices[vertexIndex + 4],
          vertices[vertexIndex + 5],
        ] as Vec3,
        uv: [
          vertices[vertexIndex + 6],
          vertices[vertexIndex + 7],
        ] as Vec2,
      };
    };

    const vertexCount = vertices.length / vertexSize;
    for (let index = 0; index < vertexCount; index += 3) {
      const v1 = getVertex(index + 0);
      const v2 = getVertex(index + 1);
      const v3 = getVertex(index + 2);
      const localspace1 = v1.position;
      const localspace2 = v2.position;
      const localspace3 = v3.position;
      const worldspace1 = transformVec4(modelTransform, vec4(...localspace1, 1));
      const worldspace2 = transformVec4(modelTransform, vec4(...localspace2, 1));
      const worldspace3 = transformVec4(modelTransform, vec4(...localspace3, 1));

      // Backface culling.
      const generatedNormal = normalized(
        cross(
          subtract(worldspace2, worldspace1),
          subtract(worldspace3, worldspace1),
        ),
      );

      // If this face is pointed away from our camera, discard it.
      if (dot(vec4(0, 0, 1, 0), generatedNormal) < 0) {
        continue;
      }

      const n1 = vec4(...v1.normal, 0);
      const n2 = vec4(...v2.normal, 0);
      const n3 = vec4(...v3.normal, 0);

      const uv1 = v1.uv;
      const uv2 = v2.uv;
      const uv3 = v3.uv;

      rasterizeTriangle(
        canvas,
        { v1: uv1, v2: uv2, v3: uv3 },
        { w1: worldspace1, w2: worldspace2, w3: worldspace3 },
        { n1, n2, n3 },
        perspectiveTransform,
        model.textures[0],
      );
    }

    canvas.submitImageData();
  };
};

export const makeGraphics = (canvas: HTMLCanvasElement): Graphics => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = context.canvas;
  context.translate(width / 2, height / 2);

  const render = makeRender(context);

  return {
    makeDrawCall: (model: Model) => (perspectiveTransform: Mat4, modelTransform: Mat4) => {
      render(model, perspectiveTransform, modelTransform);
    },
  };
};