import { makeSoftwareGraphics, makeWebGlGraphics } from './graphics';
import { Model, loadModel } from './model';
import { makeTransform } from './maths/mat4';
import { makePerspectiveMatrix } from './maths/view';
import { vec3 } from './maths/vec3';

/*
Floppy disk by drumdorf is licensed under CC Attribution-ShareAlike
2017 Year of the Rooster by The Ice Wolves is licensed under CC Attribution
Small Box Truck by Renafox is licensed under CC Attribution-NonCommercial
*/

const getCanvasContext = () => {
  const canvasElement = document.getElementById('canvasElement') as HTMLCanvasElement;
  return canvasElement;
}

const loadScene = async (): Promise<Model[]> => {
  const model = await loadModel('/chicken/chicken.json');
  // const model = await loadModel('/brick-cube/brick-cube.json');

  return [model];
};

const main = async () => {
  const context = getCanvasContext();
  // const graphics = makeSoftwareGraphics(context);
  const graphics = makeWebGlGraphics(context);
  const [model] = await loadScene();

  const drawModel = graphics.makeDrawCall(model);

  let previousTime = Date.now();
  let rotation = 140 * (Math.PI / 180);

  const viewProjectionTransform = makePerspectiveMatrix(30, 1.0, 0.1, 100);

  const gameLoop = () => {
    const currentTime = Date.now();
    const deltaTime = (previousTime - currentTime) / 1000;

    rotation += 0.25 * deltaTime;

    const modelTransform = makeTransform(vec3(0, 0, -2), vec3(0, rotation, 0));

    previousTime = currentTime;

    drawModel(viewProjectionTransform, modelTransform);

    /*
    // TODO: Display stats on webgl renderer.
    context.fillStyle = '#eee';
    context.fillText(`Frame Time: ${deltaTime} (FPS: ${Math.round(1 / deltaTime)})`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 20);
    context.fillText(`Triangles: ${vertices.length / vertexSize / 3}`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 40);
    context.fillText(`Vertices: ${vertices.length / vertexSize}`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 60);
    context.fillText(`Light: (${lightLocation[0]},${lightLocation[1]},${lightLocation[2]})`, (canvasWidth / -2) + 15, (canvasHeight / -2) + 80);
    */
    window.requestAnimationFrame(gameLoop);
  };

  gameLoop();
};

main();
