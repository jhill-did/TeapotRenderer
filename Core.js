
class Matrix4 {
  constructor(vec1, vec2, vec3) {
    this.m00 = 0;
    this.m01 = 0;
    this.m02 = 0;
    this.m03 = 0;

    this.m10 = 0;
    this.m11 = 0
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
      this.m00 = vec1.x;
      this.m10 = vec1.y;
      this.m20 = vec1.z;
      this.m30 = 0;

      this.m01 = vec2.x;
      this.m11 = vec2.y;
      this.m21 = vec2.z;
      this.m31 = 0;

      this.m02 = vec3.x;
      this.m12 = vec3.y;
      this.m22 = vec3.z;
      this.m32 = 0;

      this.m03 = 0;
      this.m13 = 0;
      this.m23 = 0;
      this.m33 = 1;
    }
  }

  multiply(vec) {
    if (vec.constructor === Vector4) {
      const output = new Vector4();
      output.x = this.m00 * vec.x + this.m01 * vec.y + this.m02 * vec.z + this.m03 * vec.w;
      output.y = this.m10 * vec.x + this.m11 * vec.y + this.m12 * vec.z + this.m13 * vec.w;
      output.z = this.m20 * vec.x + this.m21 * vec.y + this.m22 * vec.z + this.m23 * vec.w;
      output.w = this.m30 * vec.x + this.m31 * vec.y + this.m32 * vec.z + this.m33 * vec.w;

      if (output.w != 1 && output.w != 0) {
        output.x = output.x / output.w;
        output.y = output.y / output.w;
        output.z = output.z / output.w;
        //output.w = 1;
      }

      return output;
    }
    else {
      console.error('Invalid multiplication target');
    }
  }

  transpose() {
    let output = new Matrix4();
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

class Triangle {
  constructor (v1, v2, v3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
  }
}

class Vector4 {
  constructor (x, y, z, w) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = w || 1;
  }

  scale(val) {
    const output = new Vector4();
    output.x = this.x * val;
    output.y = this.y * val;
    output.z = this.z * val;
    output.w = this.w;
    return output;
  }

  add(vector) {
    if (vector.constructor === Vector4) {
      const output = new Vector4();
      output.x = this.x + vector.x;
      output.y = this.y + vector.y;
      output.z = this.z + vector.z;
      output.w = 1;
      return output;
    }
    else {
      console.error(`Cannot subtract Vector4 with [${vector.constructor}].`);
    }
  }

  subtract(vector) {
    if (vector.constructor === Vector4) {
      return this.add(vector.scale(-1));
    }
    else {
      console.error(`Cannot subtract Vector4 with [${vector.constructor}].`);
    }
  }

  dotProduct(vector) {
    if (vector.constructor === Vector4) {
      let output = 0;
      output += this.x * vector.x;
      output += this.y * vector.y;
      output += this.z * vector.z;
      output += this.w * vector.w;
      return output;
    }
    else {
      console.error(`Cannot dot product Vector4 with [${vector.constructor}].`);
    }
  }

  crossProduct(vector) {
    if (vector.constructor === Vector4) {
      let output = new Vector4();
      output.x = this.y * vector.z - this.z * vector.y;
      output.y = this.z * vector.x - this.x * vector.z;
      output.z = this.x * vector.y - this.y * vector.x;
      output.w = 1;
      return output;
    }
    else {
      console.error(`Cannot dot product Vector4 with [${vector.constructor}].`);
    }
  }

  magnitude() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
  }

  distance(vector) {
    if (vector.constructor === Vector4) {
      let difference = this.subtract(vector);
      return difference.magnitude();
    }
    else {
      console.error(`Cannot dot product Vector4 with [${vector.constructor}].`);
    }
  }

  normalized() {
    const length = this.magnitude();
    const output = new Vector4();
    output.x = this.x / length;
    output.y = this.y / length;
    output.z = this.z / length;
    output.w = 1;
    return output;
  }

  negated() {
    const output = new Vector4();
    output.x = -this.x;
    output.y = -this.y;
    output.z = -this.z;
    output.w = 1;
    return output;
  }

  perpendicular() {
    return new Vector4(-this.y, this.x);
  }
}

const nearPlane = 1;
const farPlane = 100;
function makePerspective(fov, ratio, near, far) {
  const output = new Matrix4();

  const halfTan = 1 / Math.tan(fov / 2);
  output.m00 = halfTan / ratio;
  output.m11 = -1 * halfTan / ratio;
  output.m22 = (far + near) / (far - near);
  output.m23 = -(2 * far * near) / (far - near);
  output.m32 = 1;

  return output;
}

let lightLocation = new Vector4(0, 1, farPlane * 0.25);
let affineToggle = false;
class Canvas {
  constructor(context) {
    this.context = context;
    this.canvasWidth = context.canvas.width;
    this.canvasHeight = context.canvas.height;
    this.imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
    this.pixels = this.imageData.data;

    const depthBufferSize = this.pixels.length / 4;
    this.zBuffer = new Array(depthBufferSize);
    let index = 0;
    while (index < depthBufferSize) {
      this.zBuffer[index++] = 1; // Set default values of depthBuffer to far plane.
    }
  }

  setPixel(vector, color, depth) {
    const index = (this.canvasWidth * 4) * Math.ceil(vector.y + (this.canvasHeight / 2)) + (Math.ceil(vector.x + this.canvasWidth / 2) * 4);
    if (index < this.pixels.length && index > 0) {
      this.pixels[index + 0] = color.x;
      this.pixels[index + 1] = color.y;
      this.pixels[index + 2] = color.z;
      this.pixels[index + 3] = color.w;
    }

    const zIndex = this.canvasWidth * (vector.y + (this.canvasHeight / 2)) + vector.x + (this.canvasWidth / 2);
    this.zBuffer[zIndex] = depth;
  }

  getDepth(screenPos) {
    const index = this.canvasWidth * (screenPos.y + (this.canvasHeight / 2)) + screenPos.x + (this.canvasWidth / 2);
    return this.zBuffer[index];
  }

  calculateFragment(tbnMatrix, uvs, worldSpace, face, normals, color) {
    let topLeft = {
      x: Math.min(face.v1.x, face.v2.x, face.v3.x),
      y: Math.min(face.v1.y, face.v2.y, face.v3.y)
    };

    let bottomRight = {
      x: Math.max(face.v1.x, face.v2.x, face.v3.x),
      y: Math.max(face.v1.y, face.v2.y, face.v3.y)
    };

    const edgeCheck = (a, b, c) => {
      return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
    }

    const dot = (a, b) => {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    const cameraLocation = projectVertex(new Vector4(0,0,0));
    const area = edgeCheck(face.v1, face.v2, face.v3);

    for (let x = Math.round(topLeft.x); x <= bottomRight.x; x++) {
      for (let y = Math.round(topLeft.y); y <= bottomRight.y; y++) {
        const pixelCoord = new Vector4(x + 0.5, y + 0.5);

        // First clip any points off screen.
        const onScreen = this.isPixelInScreenSpace(x, y);
        if (onScreen === false) {
          continue;
        }

        const barycentric = new Vector4(
          edgeCheck(face.v2, face.v3, pixelCoord) / area,
          edgeCheck(face.v3, face.v1, pixelCoord) / area,
          edgeCheck(face.v1, face.v2, pixelCoord) / area
        )

        // Check if this point is on our triangle then shade the pixel if it is.
        if (barycentric.x >= 0 && barycentric.y >= 0 && barycentric.z >= 0) {

          // Set our pixel's Z value to our interpolated depth.
          pixelCoord.z = 1 / (barycentric.x * (1 / face.v1.z) + barycentric.y * (1 / face.v2.z) + barycentric.z * (1 / face.v3.z));

          let currentDepth = this.getDepth({x, y});
          if (pixelCoord.z >= -1 && pixelCoord.z <= 1 && pixelCoord.z < currentDepth) {
            const worldSpaceCoord =
              worldSpace.w1.scale(barycentric.x).add(
              worldSpace.w2.scale(barycentric.y).add(
              worldSpace.w3.scale(barycentric.z)));
            worldSpaceCoord.w = 0;

            // Always scale interpolated values by z coordinate to fix perspective issues.
            let interpolatedNormal =
              normals.n1.scale(barycentric.x).add(
              normals.n2.scale(barycentric.y)).add(
              normals.n3.scale(barycentric.z)).scale(pixelCoord.z);
            interpolatedNormal.w = 0;

            const interpolatedVertexNormal = new Vector4(interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z, 0);
            tbnMatrix.m02 = interpolatedVertexNormal.x;
            tbnMatrix.m12 = interpolatedVertexNormal.y;
            tbnMatrix.m22 = interpolatedVertexNormal.z

            let u = 0;
            let v = 0;

            if (affineToggle === true) {
              u = barycentric.x * uvs.v1.x + barycentric.y * uvs.v2.x + barycentric.z * uvs.v3.x;
              v = barycentric.x * uvs.v1.y + barycentric.y * uvs.v2.y + barycentric.z * uvs.v3.y;
            }
            else {
              const zDividedUvs = {
                v1: {
                  u: uvs.v1.x / face.v1.w,
                  v: uvs.v1.y / face.v1.w
                },
                v2: {
                  u: uvs.v2.x / face.v2.w,
                  v: uvs.v2.y / face.v2.w
                },
                v3: {
                  u: uvs.v3.x / face.v3.w,
                  v: uvs.v3.y / face.v3.w
                }
              };

              const w = barycentric.x * (1 / face.v1.w) + barycentric.y * (1 / face.v2.w) + barycentric.z * (1 / face.v3.w);
              u = (barycentric.x * zDividedUvs.v1.u + barycentric.y * zDividedUvs.v2.u + barycentric.z * zDividedUvs.v3.u) / w;
              v = (barycentric.x * zDividedUvs.v1.v + barycentric.y * zDividedUvs.v2.v + barycentric.z * zDividedUvs.v3.v) / w;
            }

            // Convert normal to rgb.
            // const red = Math.floor((interpolatedNormal.x + 1) / 2 * 255);
            // const green = Math.floor((interpolatedNormal.y + 1) / 2 * 255);
            // const blue = Math.floor((interpolatedNormal.z + 1) / 2 * 255);

            let red = Math.floor(u * 255);
            let green = Math.floor(v * 255);
            let blue = Math.floor(0 * 255);
            let alpha = 255;

            if (diffuseMap) {
              const texelX = (u) * diffuseMap.width;
              const texelY = (1 - v) * diffuseMap.height;
              const texelColor = diffuseMap.getPixel(texelX, texelY);
              // debugger;
              red = texelColor.r;
              green = texelColor.g;
              blue = texelColor.b;
              alpha = texelColor.a
            }

            if (normalMap) {
              const texelX = (u) * normalMap.width;
              const texelY = (1 - v) * normalMap.height;
              const texelColor = normalMap.getPixel(texelX, texelY);
              interpolatedNormal.x = texelColor.r / 255 * 2.0 - 1.0;
              interpolatedNormal.y = texelColor.g / 255 * 2.0 - 1.0;
              interpolatedNormal.z = texelColor.b / 255 * 2.0 - 1.0;
              // Convert from tangent space to object space using
              // Matrix(tangent, bitangent, face normal)
              interpolatedNormal = tbnMatrix.multiply(interpolatedNormal)
            }

            // Calculate shading.
            const diffuseTerm = 0.5;
            const specularTerm = 1.0;
            const shininessTerm = 5;
            const ambientTerm = 0.45;
            const ambientColor = new Vector4(255,255,255,255);
            let lightDirection = lightLocation.subtract(worldSpaceCoord).normalized();
            let flippedLightDirection = lightDirection.negated();

            // Bad hack for not writing an actual vector3 class.
            lightDirection.w = 0;
            pixelCoord.w = 0;

            const reflectedLightDirection = flippedLightDirection.subtract(interpolatedNormal.scale(2).scale(dot(flippedLightDirection, interpolatedNormal))).normalized();
            let eyeDirection = cameraLocation.subtract(worldSpaceCoord).normalized().negated();
            reflectedLightDirection.w = 0;
            eyeDirection.w = 0;

            const lightNormDot = Math.max(dot(lightDirection, interpolatedNormal), 0);
            const reflectionEyeDot = Math.max(dot(reflectedLightDirection, eyeDirection), 0);
            const calculatedAmbient = ambientTerm + lightNormDot * diffuseTerm;
            const calculatedSpecular = specularTerm * Math.pow(reflectionEyeDot, shininessTerm);
            const cameraAngle = Math.max(dot(eyeDirection, interpolatedNormal), 0);
            const illumination = Math.max(0, calculatedAmbient +  calculatedSpecular);

            //const diffuseColor = new Vector4((interpolatedNormal.x + 1.0) / 2.0 * 255, (interpolatedNormal.y + 1.0) / 2.0  * 255, (interpolatedNormal.z + 1.0) / 2.0  * 255, 255);
            const diffuseColor = new Vector4(red, green, blue, 255);
            const finalColor = diffuseColor.scale(illumination);
            this.setPixel({x, y}, finalColor, pixelCoord.z);
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

class Texture {
  constructor(w, h, data) {
    this.width = w;
    this.height = h;
    this.data = data;
  }

  getPixel(x, y) {
    const pixelX = Math.floor(x);
    const pixelY = Math.floor(y);
    const baseIndex = this.height * 4 * pixelY + pixelX * 4;
    return {r: this.data[baseIndex], g: this.data[baseIndex + 1], b: this.data[baseIndex + 2], a: this.data[baseIndex + 3]};
  }

  setPixel(x, y, color) {
    this.setPixel(x, y, color.r, color.g, color.b, color.a);
  }

  setPixel(x, y, red, green, blue, alpha) {
    const baseIndex = this.height * 4 * x + y * 4;
    return {r: baseIndex, g: baseIndex + 1, b: baseIndex + 2, a: baseIndex + 3};
  }
}



/*
Floppy disk by drumdorf is licensed under CC Attribution-ShareAlike
2017 Year of the Rooster by The Ice Wolves is licensed under CC Attribution
Small Box Truck by Renafox is licensed under CC Attribution-NonCommercial
*/
