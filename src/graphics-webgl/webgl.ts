import { Graphics } from '../graphics';
import { Model } from '../model';
import { Mat4 } from '../maths/mat4';

const makeShader = (gl: WebGL2RenderingContext, source: string, type: number) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw `Failed to compile shader.\n\n${gl.getShaderInfoLog(shader)}`;
  }

  return shader;
};

const makeProgram = (
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
  attribNames: string[] = [],
): WebGLProgram => {
  const vertexShader = makeShader(gl, vertex, gl.VERTEX_SHADER);
  const fragmentShader = makeShader(gl, fragment, gl.FRAGMENT_SHADER);

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (let index = 0; index < attribNames.length; index += 1) {
    const name = attribNames[index];
    gl.bindAttribLocation(program, index, name);
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw `Failed to link program.\n\n${gl.getProgramInfoLog(program)}`;
  }

  return program;
};

const makeModelProgram = (gl: WebGL2RenderingContext) => {
  const vertex = `#version 300 es
    precision highp float;

    uniform mat4 model;
    uniform mat4 viewProjection;

    in vec3 position;
    in vec3 normal;
    in vec2 texCoord;

    out vec2 vTexCoord;
    out vec4 vPosition;

    void main() {
      vTexCoord = texCoord;
      vPosition = model * vec4(position.xyz, 1.0);
      gl_Position = viewProjection * vPosition;
    }
  `;

  const fragment = `#version 300 es
    precision highp float;

    uniform sampler2D color;

    in vec2 vTexCoord;
    in vec4 vPosition;
    out vec4 fragColor;

    void main() {
      fragColor = texture(color, vTexCoord);
    }
  `;

  const attribNames = ['position', 'normal', 'texCoord'];
  const program = makeProgram(gl, vertex, fragment, attribNames);

  return program;
};

export const makeGraphics = (canvas: HTMLCanvasElement): Graphics => {
  const gl = canvas.getContext('webgl2');

  if (gl === null) {
    throw 'WebGl2 not supported';
  }

  // Setup gl state.
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Create model shader.
  const program = makeModelProgram(gl);
  const modelLocation = gl.getUniformLocation(program, 'model');
  const viewProjectionLocation = gl.getUniformLocation(program, 'viewProjection');

  const makeDrawCall = (model: Model) => {
    // Upload model data.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

    const { vertexSize } = model;
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, vertexSize * 4, 0 * 4);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, vertexSize * 4, 3 * 4);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, vertexSize * 4, 6 * 4);
    
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    // Upload texture.
    const texture = model.textures[0];
    const colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      texture.width,
      texture.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texture.data,
    );

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // return draw call.
    return (perspectiveTransform: Mat4, modelTransform: Mat4) => {
      // Update GPU state.
      gl.useProgram(program);
      gl.uniformMatrix4fv(modelLocation, false, modelTransform);
      gl.uniformMatrix4fv(viewProjectionLocation, false, perspectiveTransform);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      const elementCount = model.vertices.length / vertexSize;
      gl.drawArrays(gl.TRIANGLES, 0, elementCount);
    };
  };

  return {
    makeDrawCall,
  };
};
