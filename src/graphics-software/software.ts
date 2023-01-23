import { Graphics } from '../graphics';
import { Texture } from '../texture';
import { Canvas, rasterizeTriangle } from './canvas';
import { Model } from '../model';
import { Vec2, subtract as subtract2 } from '../maths/vec2';
import { Vec3 } from '../maths/vec3';
import { Mat4, identityMat4, transformVec4 } from '../maths/mat4';
import {
  Vec4,
  vec4,
  subtract,
  scale,
  cross,
  normalized,
  dot,
} from '../maths/vec4';

const nearPlane = 1;
const farPlane = 100;
let lightLocation = vec4(0, 1, farPlane * 0.25, 1);

/*
function makePerspective(fov: number, ratio: number, near: number, far: number) {
  const output = new Matrix4();

  const halfTan = 1 / Math.tan(fov / 2);
  output.m00 = halfTan / ratio;
  output.m11 = -1 * halfTan / ratio;
  output.m22 = (far + near) / (far - near);
  output.m23 = -(2 * far * near) / (far - near);
  output.m32 = 1;

  return output;
};
*/

let context: CanvasRenderingContext2D;

function transformVertex(vertex: Vec4, modelTransform: Mat4): Vec4 {
  // let translationMatrix = new Matrix4();
  // translationMatrix.m00 = 1;
  // translationMatrix.m11 = 1;
  // translationMatrix.m22 = 1;
  // translationMatrix.m33 = 1;
  // translationMatrix.m32 = 40;
  // translationMatrix.m30 = 40;

  // let scaleMatrix = new Matrix4();
  // scaleMatrix.m00 = 15;
  // scaleMatrix.m11 = 15;
  // scaleMatrix.m22 = 15;
  // scaleMatrix.m33 = 1;
  // let scaled = scaleMatrix.multiply(vertex);

  // Rotate around X-axis
  //const xRot = 45 * (Math.PI / 180);
  //const xRotationMatrix = new Matrix4();
  //xRotationMatrix.m00 = 1;
  ////xRotationMatrix.m11 = 1;
  ////xRotationMatrix.m22 = 1;
  ////xRotationMatrix.m33 = 1
  //xRotationMatrix.m11 = Math.cos(xRot);
  //xRotationMatrix.m22 = Math.cos(xRot);
  //xRotationMatrix.m21 = Math.sin(xRot);
  //xRotationMatrix.m12 = -Math.sin(xRot);
  //xRotationMatrix.m33 = 1;
  //const xRotated = xRotationMatrix.multiply(scaled);

  /*
  // Rotate around Y-axis
  const rotated = vec4(0, 0, 0, 1);
  const angleCos = Math.cos(rotation);
  const angleSin = Math.sin(rotation);
  rotated[0] = scaled[0] * angleCos + scaled[2] * angleSin;
  rotated[2] = -scaled[0] * angleSin + scaled[2] * angleCos;
  rotated[1] = scaled[1];
  rotated[3] = scaled[3];

  // Translate forward.
  const translated = rotated;
  translated[2] += 40;
  translated[1] -= 0;
  */
  const transformed = transformVec4(modelTransform, vertex);

  return transformed;
}

const splatTexture = (texture: Texture) => {
  const { width, height, data } = texture;

  const root = document.getElementById('splat-root') as HTMLDivElement;
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const offset = (row * width + column) * 4;
      const red = data[offset + 0];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const alpha = data[offset + 3];
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
      context.fillRect(column, row, 1, 1);
    }
  }

  root.appendChild(canvas);
};

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
      const worldspace1 = transformVertex(vec4(...localspace1, 1), modelTransform);
      const worldspace2 = transformVertex(vec4(...localspace2, 1), modelTransform);
      const worldspace3 = transformVertex(vec4(...localspace3, 1), modelTransform);

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

      const rotateNormal = (normal: Vec4) => {
        /*
        const rotationMatrix = new Matrix4();
        rotationMatrix.m00 = Math.cos(rotation);
        rotationMatrix.m11 = 1;
        rotationMatrix.m22 = Math.cos(rotation);
        rotationMatrix.m20 = -Math.sin(rotation);
        rotationMatrix.m02 = Math.sin(rotation);
        return rotationMatrix.multiply(normal);
        */
        return transformVec4(modelTransform, normal);
      };

      const n1 = vec4(...v1.normal, 0); // rotateNormal(vec4(...v1.normal, 0));
      const n2 = vec4(...v2.normal, 0); // rotateNormal(vec4(...v2.normal, 0));
      const n3 = vec4(...v3.normal, 0); // rotateNormal(vec4(...v3.normal, 0));

      // Generate Tangent, Bitangent, Normal (TBN) Matrix for converting normals to object space.
      const faceNormal = normalized(
        cross(
          subtract(worldspace2, worldspace1),
          subtract(worldspace3, worldspace1),
        ),
      );

      const edge1 = subtract(worldspace2, worldspace1);
      const edge2 = subtract(worldspace3, worldspace1);

      const uv1 = v1.uv;
      const uv2 = v2.uv;
      const uv3 = v3.uv;

      // const deltaUv1 = subtract2(uv2, uv1);
      // const deltaUv2 = subtract2(uv3, uv1);

      // const r = 1 / (deltaUv1[0] * deltaUv2[1] - deltaUv1[1] * deltaUv2[0]);
      // let faceTangent = normalized(scale(subtract(scale(edge1, deltaUv2[1]), scale(edge2, deltaUv1[1])), r));
      // let faceBitangent = normalized(scale(subtract(scale(edge2, deltaUv1[0]), scale(edge1, deltaUv2[0])), r));

      //faceTangent = faceBitangent.crossProduct(faceNormal);
      //faceBitangent = faceTangent.crossProduct(faceNormal);
      const tbn = identityMat4(); // new Matrix4(faceTangent, faceBitangent, faceNormal);

      /*
      const faceColor = normalized(
        cross(
          subtract(worldspace2, worldspace1),
          subtract(worldspace3, worldspace1),
        ),
      );

      const red = Math.floor((faceColor[0] + 1) / 2 * 255);
      const green = Math.floor((faceColor[1] + 1) / 2 * 255);
      const blue = Math.floor((faceColor[2] + 1) / 2 * 255);
      const finalColor = vec4(red, green, blue, 255);
      */

      rasterizeTriangle(
        canvas,
        tbn,
        { v1: uv1, v2: uv2, v3: uv3 },
        { w1: worldspace1, w2: worldspace2, w3: worldspace3 },
        { n1, n2, n3 },
        vec4(0, 0, 0, 0),
        lightLocation,
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