
class Matrix4 {
  constructor() {
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
        output.w = 1;
      }

      return output;
    }
    else {
      console.error('Invalid multiplication target');
    }
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
  // const halfTan = Math.tan(fov / 2);
  // output.m00 = 1 / (ratio * halfTan);
  // output.m11 = 1 / (ratio * halfTan);
  // output.m22 = -far / (far - near);
  // output.m22 = (far + near) / (far - near) + 1
  // output.m32 = -1;
  // output.m23 = -(far * near) / (far - near);

  // const oneOverDepth = 1 / (far - near);
  // const halfTan = 1 / Math.tan(fov / 2);
  // output.m00 = halfTan / ratio;
  // output.m11 = halfTan / ratio;
  // output.m22 = -far * oneOverDepth;
  // output.m22 = -(far + near) / (far - near);
  // output.m23 = -(2 * far * near) / (far - near);
  // output.m32 = -1;

  const halfTan = 1 / Math.tan(fov / 2);
  output.m00 = halfTan / ratio;
  output.m11 = -1 * halfTan / ratio;
  output.m22 = (far + near) / (far - near);
  output.m23 = -(2 * far * near) / (far - near);
  output.m32 = 1;

  return output;
}

let lightLocation = new Vector4(0, 200, farPlane * 0.05);
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

  calculateFragment(face, normals, color) {
    let topLeft = {
      x: Math.min(face.v1.x, face.v2.x, face.v3.x),
      y: Math.min(face.v1.y, face.v2.y, face.v3.y)
    };

    let bottomRight = {
      x: Math.max(face.v1.x, face.v2.x, face.v3.x),
      y: Math.max(face.v1.y, face.v2.y, face.v3.y)
    };

    const v1PixelDepth = new Vector4(0,0,0).distance(face.v1) / farPlane;
    const v2PixelDepth = new Vector4(0,0,0).distance(face.v2) / farPlane;
    const v3PixelDepth = new Vector4(0,0,0).distance(face.v3) / farPlane;

    const edgeCheck = (a, b, c) => {
      return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
    }

    const area = edgeCheck(face.v1, face.v2, face.v3);

    for (let x = Math.round(topLeft.x); x <= bottomRight.x; x++) {
      for (let y = Math.round(topLeft.y); y <= bottomRight.y; y++) {
        const pixelCoord = new Vector4(x + 0.5, y + 0.5);

        // First clip any points off screen.
        const onScreen = this.isPixelInScreenSpace(x, y);

        // Check if this point is on our triangle then shade the pixel if it is.
        if (onScreen && pointInTriangle({x, y}, face)) {
          const barycentric = new Vector4(
            edgeCheck(face.v2, face.v3, pixelCoord) / area,
            edgeCheck(face.v3, face.v1, pixelCoord) / area,
            edgeCheck(face.v1, face.v2, pixelCoord) / area
          )

          // Set our pixel's Z value to our interpolated depth.
          pixelCoord.z = (1 / (barycentric.x * (1 / face.v1.z) + barycentric.y * (1 / face.v2.z) + barycentric.z * (1 / face.v3.z)));

          let currentDepth = this.getDepth({x, y});
          if (pixelCoord.z >= -1 && pixelCoord.z <= 1 && pixelCoord.z < currentDepth) {
            const interpolatedNormal =
              normals.n1.scale(barycentric.x).add(
              normals.n2.scale(barycentric.y)).add(
              normals.n3.scale(barycentric.z));
            interpolatedNormal.w = 0;

            // Convert normal to rgb.
            const red = Math.floor((interpolatedNormal.x + 1) / 2 * 255);
            const green = Math.floor((interpolatedNormal.y + 1) / 2 * 255);
            const blue = Math.floor((interpolatedNormal.z + 1) / 2 * 255);

            // Calculate shading.
            const diffuseTerm = 0.4;
            const specularTerm = 1;
            const shininessTerm = 10;
            const ambientTerm = 0.6;
            const ambientColor = new Vector4(255,255,255,255);
            let lightDirection = lightLocation.subtract(pixelCoord).normalized();

            // Bad hack for not writing an actual vector3 class.
            lightDirection.w = 0;
            pixelCoord.w = 0;

            let reflectedLightDirection = lightDirection.add(interpolatedNormal.scale(2 * lightDirection.dotProduct(interpolatedNormal)));
            let eyeDirection = new Vector4(0,0,0).subtract(pixelCoord).normalized();
            reflectedLightDirection.w = 0;
            eyeDirection.w = 0;

            const lightNormDot = lightDirection.dotProduct(interpolatedNormal);
            const reflectionEyeDot = reflectedLightDirection.dotProduct(eyeDirection);
            const calculatedAmbient = ambientTerm + lightNormDot * diffuseTerm;
            const calculatedSpecular = specularTerm * Math.pow(reflectionEyeDot, shininessTerm);
            const illumination = calculatedAmbient;
            debugger;

            const finalColor = new Vector4(255, 255, 255, 255);
            this.setPixel({x, y}, finalColor.scale(illumination), pixelCoord.z);
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

function pointInTriangle(point, triangle) {
  const edgeCheck = (a, b, c) => {
    return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
  }

  // offset to sample pixel center.
  point = {
    x: point.x + 0.5,
    y: point.y + 0.5
  };

  const w1 = edgeCheck(triangle.v2, triangle.v3, point);
  const w2 = edgeCheck(triangle.v3, triangle.v1, point);
  const w3 = edgeCheck(triangle.v1, triangle.v2, point);

  // const edge1 = triangle.v3.subtract(triangle.v2);
  // const edge2 = triangle.v1.subtract(triangle.v3);
  // const edge3 = triangle.v2.subtract(triangle.v1);

  // const edge1 = triangle.v3.add(triangle.v2);
  // const edge2 = triangle.v1.add(triangle.v3);
  // const edge3 = triangle.v2.add(triangle.v1);


  // let overlaps = true;
  // overlaps &= (w1 === 0 ? (edge1.y === 0 && edge1.x > 0) || edge1.y > 0 : w1 > 0);
  // overlaps &= (w2 === 0 ? (edge2.y === 0 && edge2.x > 0) || edge2.y > 0 : w2 > 0);
  // overlaps &= (w2 === 0 ? (edge3.y === 0 && edge3.x > 0) || edge3.y > 0 : w3 > 0);

  return w1 <= 0 && w2 <= 0 && w3 <= 0; // b2 && b2 === b3;
  return Boolean(overlaps);
}
