import { Texture, sample } from './image';
import { Vec2, vec2 } from './maths/vec2';
import {
  Vec4,
  vec4,
  add,
  scale,
  subtract,
  dot,
  cross,
  normalized,
  negated,
} from './maths/vec4';

const affineToggle = false as boolean;

// TODO: Swap for maths/mat4.
export class Matrix4 {
  m00: number;
  m01: number;
  m02: number;
  m03: number;
  m10: number;
  m11: number;
  m12: number;
  m13: number;
  m20: number;
  m21: number;
  m22: number;
  m23: number;
  m30: number;
  m31: number;
  m32: number;
  m33: number;

  constructor(vec1?: Vec4, vec2?: Vec4, vec3?: Vec4) {
    this.m00 = 0;
    this.m01 = 0;
    this.m02 = 0;
    this.m03 = 0;

    this.m10 = 0;
    this.m11 = 0;
    this.m12 = 0;
    this.m13 = 0;

    this.m20 = 0;
    this.m21 = 0
    this.m22 = 0;
    this.m23 = 0;

    this.m30 = 0;
    this.m31 = 0
    this.m32 = 0;
    this.m33 = 0;

    if (vec1 && vec2 && vec3) {
      this.m00 = vec1[0];
      this.m10 = vec1[1];
      this.m20 = vec1[2];
      this.m30 = 0;

      this.m01 = vec2[0];
      this.m11 = vec2[1];
      this.m21 = vec2[2];
      this.m31 = 0;

      this.m02 = vec3[0];
      this.m12 = vec3[1];
      this.m22 = vec3[2];
      this.m32 = 0;

      this.m03 = 0;
      this.m13 = 0;
      this.m23 = 0;
      this.m33 = 1;
    }
  }

  multiply(vec: Vec4) {
    const output = vec4(
      this.m00 * vec[0] + this.m01 * vec[1] + this.m02 * vec[2] + this.m03 * vec[3],
      this.m10 * vec[0] + this.m11 * vec[1] + this.m12 * vec[2] + this.m13 * vec[3],
      this.m20 * vec[0] + this.m21 * vec[1] + this.m22 * vec[2] + this.m23 * vec[3],
      this.m30 * vec[0] + this.m31 * vec[1] + this.m32 * vec[2] + this.m33 * vec[3],
    );

    if (output[3] !== 1 && output[3] !== 0) {
      output[0] = output[0] / output[3];
      output[1] = output[1] / output[3];
      output[2] = output[2] / output[3];
      //output[3] = 1;
    }

    return output;
  }

  transpose() {
    const output = new Matrix4();
    output.m00 = this.m00;
    output.m01 = this.m10;
    output.m02 = this.m20;
    output.m03 = this.m30;

    output.m10 = this.m01;
    output.m11 = this.m11;
    output.m12 = this.m21;
    output.m13 = this.m31;

    output.m20 = this.m02;
    output.m21 = this.m12;
    output.m22 = this.m22;
    output.m23 = this.m32;

    output.m30 = this.m03;
    output.m31 = this.m13;
    output.m32 = this.m23;
    output.m33 = this.m33;

    return output;
  }
}

export class Canvas {
  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;

  imageData: ImageData;
  pixels: Uint8ClampedArray;
  zBuffer: number[];

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.canvasWidth = context.canvas.width;
    this.canvasHeight = context.canvas.height;
    this.imageData = context.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    this.pixels = this.imageData.data;

    const depthBufferSize = this.pixels.length / 4;
    this.zBuffer = new Array(depthBufferSize);
    let index = 0;
    while (index < depthBufferSize) {
      this.zBuffer[index++] = 1; // Set default values of depthBuffer to far plane.
    }
  }

  setPixel(vector: Vec2, color: Vec4, depth: number) {
    const index = (this.canvasWidth * 4)
      * Math.ceil(vector[1] + (this.canvasHeight / 2))
      + (Math.ceil(vector[0] + this.canvasWidth / 2) * 4);

    if (index < this.pixels.length && index > 0) {
      this.pixels[index + 0] = color[0];
      this.pixels[index + 1] = color[1];
      this.pixels[index + 2] = color[2];
      this.pixels[index + 3] = color[3];
    }

    const zIndex = this.canvasWidth
      * (vector[1] + (this.canvasHeight / 2))
      + vector[0]
      + (this.canvasWidth / 2);

    this.zBuffer[zIndex] = depth;
  }

  getDepth(screenPos: Vec4) {
    const index = this.canvasWidth
      * (screenPos[1] + (this.canvasHeight / 2))
      + screenPos[0]
      + (this.canvasWidth / 2);

    return this.zBuffer[index];
  }

  calculateFragment(
    tbnMatrix: Matrix4,
    uvs: { v1: Vec2, v2: Vec2, v3: Vec2 },
    worldSpace: { w1: Vec4, w2: Vec4, w3: Vec4 },
    face: { v1: Vec4, v2: Vec4, v3: Vec4 },
    normals: { n1: Vec4, n2: Vec4, n3: Vec4 },
    color: Vec4,
    lightLocation: Vec4,
    perspectiveMatrix: Matrix4,
    diffuseMap: Texture,
    normalMap: Texture,
  ) {
    let topLeft = [
      Math.min(face.v1[0], face.v2[0], face.v3[0]),
      Math.min(face.v1[1], face.v2[1], face.v3[1])
    ];

    let bottomRight = [
      Math.max(face.v1[0], face.v2[0], face.v3[0]),
      Math.max(face.v1[1], face.v2[1], face.v3[1])
    ];

    const edgeCheck = (a, b, c) => {
      return (c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0]);
    };

    const cameraLocation = perspectiveMatrix.multiply(vec4(0, 0, 0, 1));
    const area = edgeCheck(face.v1, face.v2, face.v3);

    for (let x = Math.round(topLeft[0]); x <= bottomRight[0]; x++) {
      for (let y = Math.round(topLeft[1]); y <= bottomRight[1]; y++) {
        const pixelCoord = vec4(x + 0.5, y + 0.5, 0, 1);

        // First clip any points off screen.
        const onScreen = this.isPixelInScreenSpace(x, y);
        if (onScreen === false) {
          continue;
        }

        const barycentric = vec4(
          edgeCheck(face.v2, face.v3, pixelCoord) / area,
          edgeCheck(face.v3, face.v1, pixelCoord) / area,
          edgeCheck(face.v1, face.v2, pixelCoord) / area,
          1,
        );

        // Check if this point is on our triangle then shade the pixel if it is.
        if (barycentric[0] >= 0 && barycentric[1] >= 0 && barycentric[2] >= 0) {

          // Set our pixel's Z value to our interpolated depth.
          pixelCoord[2] = 1 / (barycentric[0] * (1 / face.v1[2]) + barycentric[1] * (1 / face.v2[2]) + barycentric[2] * (1 / face.v3[2]));

          let currentDepth = this.getDepth(vec4(x, y, 0, 1));
          if (pixelCoord[2] >= -1 && pixelCoord[2] <= 1 && pixelCoord[2] < currentDepth) {
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

            let interpolatedVertexNormal = vec4(
              interpolatedNormal[0],
              interpolatedNormal[1],
              interpolatedNormal[2],
              0
            );

            tbnMatrix.m02 = interpolatedVertexNormal[0];
            tbnMatrix.m12 = interpolatedVertexNormal[1];
            tbnMatrix.m22 = interpolatedVertexNormal[2]

            let u = 0;
            let v = 0;

            if (affineToggle === true) {
              u = barycentric[0] * uvs.v1[0] + barycentric[1] * uvs.v2[0] + barycentric[2] * uvs.v3[0];
              v = barycentric[0] * uvs.v1[1] + barycentric[1] * uvs.v2[1] + barycentric[2] * uvs.v3[1];
            }
            else {
              const zDividedUvs = {
                v1: {
                  u: uvs.v1[0] / face.v1[3],
                  v: uvs.v1[1] / face.v1[3]
                },
                v2: {
                  u: uvs.v2[0] / face.v2[3],
                  v: uvs.v2[1] / face.v2[3]
                },
                v3: {
                  u: uvs.v3[0] / face.v3[3],
                  v: uvs.v3[1] / face.v3[3]
                }
              };

              const w = barycentric[0] * (1 / face.v1[3]) + barycentric[1] * (1 / face.v2[3]) + barycentric[2] * (1 / face.v3[3]);
              u = (barycentric[0] * zDividedUvs.v1.u + barycentric[1] * zDividedUvs.v2.u + barycentric[2] * zDividedUvs.v3.u) / w;
              v = (barycentric[0] * zDividedUvs.v1.v + barycentric[1] * zDividedUvs.v2.v + barycentric[2] * zDividedUvs.v3.v) / w;
            }

            let red = Math.floor(u * 255);
            let green = Math.floor(v * 255);
            let blue = Math.floor(0 * 255);
            let alpha = 255;

            if (diffuseMap) {
              const texelX = (u) * diffuseMap.width;
              const texelY = (1 - v) * diffuseMap.height;
              const texelColor = sample(diffuseMap, texelX, texelY);
              // debugger;
              ([red, green, blue, alpha] = texelColor);
            }

            if (normalMap) {
              const texelX = (u) * normalMap.width;
              const texelY = (1 - v) * normalMap.height;
              const texelColor = sample(normalMap, texelX, texelY);
              interpolatedNormal[0] = texelColor[0] / 255 * 2.0 - 1.0;
              interpolatedNormal[1] = texelColor[1] / 255 * 2.0 - 1.0;
              interpolatedNormal[2] = texelColor[2] / 255 * 2.0 - 1.0;
              // Convert from tangent space to object space using
              // Matrix(tangent, bitangent, face normal)
              interpolatedNormal = tbnMatrix.multiply(interpolatedNormal)
            }

            /*
            // Calculate shading.
            const diffuseTerm = 0.5;
            const specularTerm = 1.0;
            const shininessTerm = 5;
            const ambientTerm = 0.45;
            const ambientColor = vec4(255,255,255,255);
            let lightDirection = normalized(subtract(lightLocation, worldSpaceCoord));
            let flippedLightDirection = negated(lightDirection);

            // Bad hack for not writing an actual vector3 class.

            lightDirection[3] = 0;
            pixelCoord[3] = 0;

            const reflectedLightDirection = normalized(
              subtract(
                flippedLightDirection,
                scale(scale(interpolatedNormal, 2), dot(flippedLightDirection, interpolatedNormal)),
              )
            );
            let eyeDirection = negated(normalized(subtract(cameraLocation, worldSpaceCoord)));
            reflectedLightDirection[3] = 0;
            eyeDirection[3] = 0;

            const lightNormDot = Math.max(dot(lightDirection, interpolatedNormal), 0);
            const reflectionEyeDot = Math.max(dot(reflectedLightDirection, eyeDirection), 0);
            const calculatedAmbient = ambientTerm + lightNormDot * diffuseTerm;
            const calculatedSpecular = specularTerm * Math.pow(reflectionEyeDot, shininessTerm);
            const cameraAngle = Math.max(dot(eyeDirection, interpolatedNormal), 0);
            const illumination = Math.max(0, calculatedAmbient +  calculatedSpecular);
            */

            //const diffuseColor = new Vector4((interpolatedNormal[0] + 1.0) / 2.0 * 255, (interpolatedNormal[1] + 1.0) / 2.0  * 255, (interpolatedNormal[2] + 1.0) / 2.0  * 255, 255);
            const diffuseColor = vec4(red, green, blue, 255);
            const finalColor = diffuseColor; // scale(diffuseColor, illumination);
            this.setPixel(vec2(x, y), finalColor, pixelCoord[2]);
          }
        }
      }
    }
  }

  isPixelInScreenSpace(x, y) {
    const halfWidth = this.canvasWidth / 2;
    const halfHeight = this.canvasHeight / 2;
    return (x > -halfWidth && y > -halfHeight && x < halfWidth && y < halfHeight);
  }

  submitImageData() {
    this.context.putImageData(this.imageData, 0, 0);
  }
}

function clamp(input, min, max) {
  return Math.min(Math.max(input, min), max);
}

/*
Floppy disk by drumdorf is licensed under CC Attribution-ShareAlike
2017 Year of the Rooster by The Ice Wolves is licensed under CC Attribution
Small Box Truck by Renafox is licensed under CC Attribution-NonCommercial
*/
