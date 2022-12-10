import { loadImageTexture } from './image';
import { Matrix4, Canvas } from './core';
import { loadObj, Model } from './model-obj';
import { subtract as subtract2 } from './maths/vec2';
import {
  Vec4,
  vec4,
  subtract,
  scale,
  cross,
  normalized,
  dot,
} from './maths/vec4';

const canvasHeight = 600;
const canvasWidth = 800;

const nearPlane = 1;
const farPlane = 100;

let lightLocation = vec4(0, 1, farPlane * 0.25, 1);

function makePerspective(fov: number, ratio: number, near: number, far: number) {
  const output = new Matrix4();

  const halfTan = 1 / Math.tan(fov / 2);
  output.m00 = halfTan / ratio;
  output.m11 = -1 * halfTan / ratio;
  output.m22 = (far + near) / (far - near);
  output.m23 = -(2 * far * near) / (far - near);
  output.m32 = 1;

  return output;
}

const perspectiveMatrix = makePerspective(
  0.25 * (Math.PI / 180),
  canvasWidth / canvasHeight,
  nearPlane,
  farPlane
);

function getCanvasContext() {
  const canvasElement = document.getElementById('canvasElement') as HTMLCanvasElement;
  const context = canvasElement.getContext('2d', { willReadFrequently: true });
  return context;
}

let context: CanvasRenderingContext2D;

function transformVertex(vertex: Vec4): Vec4 {
  let translationMatrix = new Matrix4();
  translationMatrix.m00 = 1;
  translationMatrix.m11 = 1;
  translationMatrix.m22 = 1;
  translationMatrix.m33 = 1;
  translationMatrix.m32 = 40;
  translationMatrix.m30 = 40;

  let scaleMatrix = new Matrix4();
  scaleMatrix.m00 = 15;
  scaleMatrix.m11 = 15;
  scaleMatrix.m22 = 15;
  scaleMatrix.m33 = 1;
  let scaled = scaleMatrix.multiply(vertex);

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

  return translated;
}

const text = (promise: Promise<Response>) => promise.then(resp => resp.text());

async function init(): Promise<Model> {
  context = getCanvasContext();
  context.translate(canvasWidth / 2, canvasHeight / 2);

  const cockData = await text(fetch('cube.obj'));
  const diffuseMap = await loadImageTexture('brick.image');

  return { ...loadObj(cockData), diffuseMap } as Model;

  // Calculate vertex normals.
  // for (let index = 0; index < teapotVerts.length; index++) {
  //   for (const triangle of teapotFaces) {
  //     if (triangle.v1 - 1 === index || triangle.v2 - 1 === index || triangle.v3 - 1 === index) {
  //       // This face is using our vertex so let's calculate normal.
  //       const v1 = teapotVerts[triangle.v1 - 1];
  //       const v2 = teapotVerts[triangle.v2 - 1];
  //       const v3 = teapotVerts[triangle.v3 - 1];
  //       const faceNormal = v2.subtract(v1).cross(v3.subtract(v1)).normalized();
  //       vertexNormals[index] = vertexNormals[index] || [];
  //       vertexNormals[index].push(faceNormal);
  //     }
  //   }
  // }

  // for (let index = 0; index < vertexNormals.length; index++) {
  //   const normalsList = vertexNormals[index];
  //   let output = vec4(0,0,0);
  //   for (const normal of normalsList) {
  //     output[0] += normal[0];
  //     output[1] += normal[1];
  //     output[2] += normal[2];
  //   }
  //   output = output.normalized();
  //   vertexNormals[index] = output;
  // }
}

const frameLimit = 30;
let deltaTime = 1000 / frameLimit;
let previousTime = Date.now();

let rotation = 140 * (Math.PI / 180);
function render(model: Model) {
  deltaTime = (Date.now() - previousTime) / 1000;
  previousTime = Date.now();
  rotation += 0.1 * deltaTime;
  //rotation = 140 * (Math.PI / 180);
  lightLocation[2] = 40;
  lightLocation[0] = Math.cos(Date.now() / 400) * 10;
  lightLocation[2] += Math.sin(Date.now() / 400) * 10;
  // lightLocation[0] = -300;

  context = getCanvasContext();
  context.clearRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);

  const canvas = new Canvas(context);

  const {
    triangles,
    vertices,
    normals,
    uvs
  } = model;

  for (const triangle of triangles) {
    let localspace1 = vertices[triangle.vertices.v1];
    let localspace2 = vertices[triangle.vertices.v2];
    let localspace3 = vertices[triangle.vertices.v3];
    let worldspace1 = transformVertex(localspace1)
    let worldspace2 = transformVertex(localspace2)
    let worldspace3 = transformVertex(localspace3)
    let v1 = perspectiveMatrix.multiply(worldspace1);
    let v2 = perspectiveMatrix.multiply(worldspace2);
    let v3 = perspectiveMatrix.multiply(worldspace3);

    let uv1 = uvs[triangle.uvs.v1];
    let uv2 = uvs[triangle.uvs.v2];
    let uv3 = uvs[triangle.uvs.v3];

    const generatedNormal = normalized(
      cross(
        subtract(worldspace2, worldspace1),
        subtract(worldspace3, worldspace1),
      ),
    );

    // Backface culling.
    if (dot(scale(worldspace1, -1), generatedNormal) >= 0) { // If this face is pointed to our camera, draw it.
      const rotateNormal  = (normal: Vec4) => {
        const rotationMatrix = new Matrix4();
        rotationMatrix.m00 = Math.cos(rotation);
        rotationMatrix.m11 = 1;
        rotationMatrix.m22 = Math.cos(rotation);
        rotationMatrix.m20 = -Math.sin(rotation);
        rotationMatrix.m02 = Math.sin(rotation);
        return rotationMatrix.multiply(normal);
      };

      let n1 = rotateNormal(normals[triangle.normals.v1]);
      let n2 = rotateNormal(normals[triangle.normals.v2]);
      let n3 = rotateNormal(normals[triangle.normals.v3]);

      // Generate Tangent, Bitangent, Normal (TBN) Matrix for converting normals to object space.
      const faceNormal = normalized(
        cross(
          subtract(worldspace2, worldspace1),
          subtract(worldspace3, worldspace1),
        )
      );

      const edge1 = subtract(worldspace2, worldspace1);
      const edge2 = subtract(worldspace3, worldspace1);

      const deltaUv1 = subtract2(uv2, uv1);
      const deltaUv2 = subtract2(uv3, uv1);

      const r = 1 / (deltaUv1[0] * deltaUv2[1] - deltaUv1[1] * deltaUv2[0]);
      let faceTangent = normalized(scale(subtract(scale(edge1, deltaUv2[1]), scale(edge2, deltaUv1[1])), r));
      let faceBitangent = normalized(scale(subtract(scale(edge2, deltaUv1[0]), scale(edge1, deltaUv2[0])), r));

      //faceTangent = faceBitangent.crossProduct(faceNormal);
      //faceBitangent = faceTangent.crossProduct(faceNormal);
//
      const tbn = new Matrix4(faceTangent, faceBitangent, faceNormal);

      let faceColor = normalized(
        cross(
          subtract(worldspace2, worldspace1),
          subtract(worldspace3, worldspace1),
        )
      );

      const red = Math.floor((faceColor[0] + 1) / 2 * 255);
      const green = Math.floor((faceColor[1] + 1) / 2 * 255);
      const blue = Math.floor((faceColor[2] + 1) / 2 * 255);
      const finalColor = vec4(red, green, blue, 255);
      canvas.calculateFragment(
        tbn,
        { v1: uv1, v2: uv2, v3: uv3 },
        { w1: worldspace1, w2: worldspace2, w3: worldspace3 },
        { v1, v2, v3 },
        { n1, n2, n3 },
        finalColor,
        lightLocation,
        perspectiveMatrix,
        model.diffuseMap,
        model.normalMap,
      );
    }
  }

  canvas.submitImageData();

  context.fillStyle = '#444444';
  context.fillText(`Frame Time: ${deltaTime} (FPS: ${Math.round(1 / deltaTime)})`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 20);
  context.fillText(`Triangles: ${triangles.length}`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 40);
  context.fillText(`Vertices: ${vertices.length}`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 60);
  context.fillText(`Light: (${lightLocation[0]},${lightLocation[1]},${lightLocation[2]})`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 80);
}

const main = async () => {
  const model = await init();

  const gameLoop = () => {
    render(model);
    window.requestAnimationFrame(gameLoop);
  };

  gameLoop();
};

main();
