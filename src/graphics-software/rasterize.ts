import { Graphics } from '../graphics';
import { Texture, sample } from '../texture';
import { Canvas } from './canvas';
import { Model } from '../model';
import { Vec2, vec2 } from '../maths/vec2';
import { Vec3 } from '../maths/vec3';
import { Mat4, transformVec4 } from '../maths/mat4';
import {
  Vec4,
  vec4,
  add,
  scale,
  subtract,
  cross,
  normalized,
  dot,
} from '../maths/vec4';

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

export const rasterizeTriangle = (
  canvas: Canvas,
  uvs: { v1: Vec2, v2: Vec2, v3: Vec2 },
  worldSpace: { w1: Vec4, w2: Vec4, w3: Vec4 },
  normals: { n1: Vec4, n2: Vec4, n3: Vec4 },
  perspectiveMatrix: Mat4,
  diffuseMap: Texture,
) => {
  // TODO(Jordan): lol this stinks!
  const ndcToScreen = (v: Vec4) => {
    return vec4(
      v[0] * (canvas.context.canvas.width / 4),
      -v[1] * (canvas.context.canvas.height / 4),
      v[2],
      v[3],
    );
  };

  // Project vertices onto canvas.
  const face = {
    v1: ndcToScreen(transformVec4(perspectiveMatrix, worldSpace.w1)),
    v2: ndcToScreen(transformVec4(perspectiveMatrix, worldSpace.w2)),
    v3: ndcToScreen(transformVec4(perspectiveMatrix, worldSpace.w3)),
  };

  const topLeft = [
    Math.min(face.v1[0], face.v2[0], face.v3[0]),
    Math.min(face.v1[1], face.v2[1], face.v3[1]),
  ];

  const bottomRight = [
    Math.max(face.v1[0], face.v2[0], face.v3[0]),
    Math.max(face.v1[1], face.v2[1], face.v3[1]),
  ];

  const edgeCheck = (a, b, c) => {
    return (c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0]);
  };

  const area = edgeCheck(face.v1, face.v2, face.v3);

  // Rasterize triangle within bounding box.
  for (let x = Math.round(topLeft[0]); x <= bottomRight[0]; x += 1) {
    for (let y = Math.round(topLeft[1]); y <= bottomRight[1]; y += 1) {
      const pixelCoord = vec4(x + 0.5, y + 0.5, 0, 1);

      // First clip any points off screen.
      const onScreen = canvas.isPixelInScreenSpace(x, y);
      if (!onScreen) {
        continue;
      }

      const barycentric = vec4(
        edgeCheck(face.v2, face.v3, pixelCoord) / area,
        edgeCheck(face.v3, face.v1, pixelCoord) / area,
        edgeCheck(face.v1, face.v2, pixelCoord) / area,
        1,
      );

      // If this point is not in our triangle, skip it.
      if (barycentric[0] < 0 || barycentric[1] < 0 || barycentric[2] < 0) {
        continue;
      }

      // Set our pixel's Z value to our interpolated depth.
      pixelCoord[2] = 1 / (
        barycentric[0] * (1 / face.v1[2])
        + barycentric[1] * (1 / face.v2[2])
        + barycentric[2] * (1 / face.v3[2])
      );

      let currentDepth = canvas.getDepth(vec4(x, y, 0, 1));
      if (pixelCoord[2] >= -1 && pixelCoord[2] <= 100 && pixelCoord[2] < currentDepth) {
        const worldSpaceCoord = add(
          scale(worldSpace.w1, barycentric[0]),
          add(
            scale(worldSpace.w2, barycentric[1]),
            scale(worldSpace.w3, barycentric[2]),
          )
        );

        worldSpaceCoord[3] = 0;

        // Always scale interpolated values by z coordinate to fix perspective issues.
        let interpolatedNormal = scale(
          add(
            scale(normals.n1, barycentric[0]),
            add(
              scale(normals.n2, barycentric[1]),
              scale(normals.n3, barycentric[2]),
            )
          ),
          pixelCoord[2],
        );

        interpolatedNormal[3] = 0;

        let u = 0;
        let v = 0;

        const affineToggle = false;
        if (!affineToggle) {
          u = barycentric[0] * uvs.v1[0] + barycentric[1] * uvs.v2[0] + barycentric[2] * uvs.v3[0];
          v = barycentric[0] * uvs.v1[1] + barycentric[1] * uvs.v2[1] + barycentric[2] * uvs.v3[1];
        } else {
          const zDividedUvs = {
            v1: {
              u: uvs.v1[0] / face.v1[3],
              v: uvs.v1[1] / face.v1[3],
            },
            v2: {
              u: uvs.v2[0] / face.v2[3],
              v: uvs.v2[1] / face.v2[3],
            },
            v3: {
              u: uvs.v3[0] / face.v3[3],
              v: uvs.v3[1] / face.v3[3],
            }
          };

          const w = barycentric[0] * (1 / face.v1[3]) + barycentric[1] * (1 / face.v2[3]) + barycentric[2] * (1 / face.v3[3]);
          u = (barycentric[0] * zDividedUvs.v1.u + barycentric[1] * zDividedUvs.v2.u + barycentric[2] * zDividedUvs.v3.u) / w;
          v = (barycentric[0] * zDividedUvs.v1.v + barycentric[1] * zDividedUvs.v2.v + barycentric[2] * zDividedUvs.v3.v) / w;
        }

        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 255;

        if (diffuseMap) {
          const texelX = (u) * diffuseMap.width;
          const texelY = (1 - v) * diffuseMap.height;
          const texelColor = sample(diffuseMap, texelX, texelY);
          ([red, green, blue, alpha] = texelColor);
        }

        const diffuseColor = vec4(red, green, blue, 255);
        const finalColor = diffuseColor;
        canvas.setPixel(vec2(x, y), finalColor, pixelCoord[2]);
      }
    }
  }
};