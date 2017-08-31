function loadObj(objFileData) {
  const output = {
    vertices: [],
    uvs: [],
    normals: [],
    triangles: []
  };

  const lines = objFileData.split('\n');
  for (const line of lines) {
    const tokens = line.split(' ');
    if (tokens[0] === 'v') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      output.vertices.push(new Vector4(x, y, z, 1));
    }

    if (tokens[0] === 'vn') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      output.normals.push(new Vector4(x, y, z, 1));
    }

    if (tokens[0] === 'vt') {
      const x = Number.parseFloat(tokens[1]);
      const y = Number.parseFloat(tokens[2]);
      const z = Number.parseFloat(tokens[3]);
      output.uvs.push(new Vector4(x, y, z, 1));
    }

    if (tokens[0] === 'f') {
      const triangle = {
        vertices: {},
        uvs: {},
        normals: {}
      };

      // Take note: This converts index positions to be zero based.
      v1Indices = tokens[1].split('/');
      triangle.vertices.v1 = Number.parseInt(v1Indices[0]) - 1;
      triangle.uvs.v1 = Number.parseInt(v1Indices[1]) - 1;
      triangle.normals.v1 = Number.parseInt(v1Indices[2]) - 1;

      v2Indices = tokens[2].split('/');
      triangle.vertices.v2 = Number.parseInt(v2Indices[0]) - 1;
      triangle.uvs.v2 = Number.parseInt(v2Indices[1]) - 1;
      triangle.normals.v2 = Number.parseInt(v2Indices[2]) - 1;

      v3Indices = tokens[3].split('/');
      triangle.vertices.v3 = Number.parseInt(v3Indices[0]) - 1;
      triangle.uvs.v3 = Number.parseInt(v3Indices[1]) - 1;
      triangle.normals.v3 = Number.parseInt(v3Indices[2]) - 1;

      output.triangles.push(triangle);
    }
  }

  return output;
}
