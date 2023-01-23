import { Vec4, vec4 } from './maths/vec4';

// Expected to be RGBA
export type Texture = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export const sample = (texture: Texture, x: number, y: number): Vec4 => {
  const pixelX = Math.floor(x);
  const pixelY = Math.floor(y);
  const baseIndex = texture.height * 4 * pixelY + pixelX * 4;
  return vec4(
    texture.data[baseIndex],
    texture.data[baseIndex + 1],
    texture.data[baseIndex + 2],
    texture.data[baseIndex + 3],
  );
};

/*
// TODO: This entire premise is no good, it's a very old thought of mine based
// on the idea that loading images offline was tricky without a sever. These
// days I just use parcel to serve up images no problem, but this 'format' I
// came up with is just an rgbA image buffer stored as a json string in a
// `.image` file. Which is bad for many reasons, I should use a
// proper binary format.

export const makeImageTexture = (array: number[]): Texture => {
  const size = Math.sqrt(array.length / 4);
  console.assert(size === Math.round(size));

  return {
    width: size,
    height: size,
    data: new Uint8ClampedArray(array),
  };
};

export const loadImageTexture = async (url: string): Promise<Texture> => {
  return await fetch(url)
    .then(response => response.json())
    .then(makeImageTexture);
};
*/

export const loadImage = (path: string) => (
  fetch(path)
    .then(response => response.blob())
    .then(createImageBitmap)
    .then((bitmap): Texture => {
      const { width, height } = bitmap;
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, width, height);
      return { width, height, data: imageData.data };
    })
);
