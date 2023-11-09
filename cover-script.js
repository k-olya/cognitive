// kolay.js
const shuffle = function (a) {
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
  return a;
};
const lerp = (a, b, t) => a * (1 - t) + b * t;
const irand = x => Math.floor(Math.random() * x);
const range = x => Array.from(Array(x).keys());

// user-defined constants
const minStops = 1;
const maxStops = 1;
/*
const palette = [
  [239, 71, 111],
  [255, 209, 102],
  [6, 214, 160],
  [17, 138, 178],
  [7, 59, 76],
].map(a => a.map(x => x / 255.0));
*/
const hextogl = hex =>
  [hex.substring(0, 2), hex.substring(2, 4), hex.substring(4, 6)].map(
    h => parseInt(h, 16) / 255.0
  );

/*
// blue palette
const palette = [
  "012a4a",
  "013a63",
  "01497c",
  "014f86",
  "2a6f97",
  "2c7da0",
  "468faf",
  "61a5c2",
  "89c2d9",
  "a9d6e5",
].map(hextogl);

const colors = shuffle(
  range(minStops + irand(maxStops - minStops)).reduce(
    (a, b) => a.concat(palette),
    palette
  )
);
*/

// a low-contrast colorscheme
//const colors = ["baa7b0", "b2abbf", "b1b5c8", "bfd5e2", "c7ebf0"].map(hextogl);

// some brown colors
// ["797d62","9b9b7a","baa587","d9ae94","f1dca7","ffcb69","e8ac65","d08c60","b58463","997b66"]

/*
// earth map-like color palette
const colors = [
  "0a43c9", // ocean
  "28b2fc", // shallow waters
  "f1dca7", // shore
  "4ad66d", // grasslands
  "2a9134", // forests
  "ffcb69", // hills
  "d08c60", // mountains
].map(hextogl);
*/
let colors = [
  // "03045e",
  "023e8a",
  "0077b6",
  "0096c7",
  "00b4d8",
  "48cae4",
  "90e0ef",
  //"ade8f4",
  //  "caf0f8",
].map(hextogl);
colors = colors.concat(colors.concat().reverse());

//console.log(colors);
const N = colors.length;
const flattenedColors = colors.flat();
const colorStops = range(N - 1).map(x => (x + 1) / N);
const scale = 2.4;
const scaleAmplitude = 0.005;
const scaleFreq = 0.1;
const fluctuationAmplitude = 0.05;
const fluctuationFreq = 0.05;
const fbmAmplitudeDecay = 0.35; //lerp(0.15, 0.35, Math.random());
const aaf = 0.6; // anti-aliasing factor (textures will be of canvas size * aaf)
const ssRadius = 0.5; // how far are the pixels to supersample
const ssStrength = 0.6; // weight of the neighbouring pixels in supersampling
const colorBlendMode = "smooth"; // sharp or smooth
const edgeSmoothness = 1; // only used in sharp color blend mode, use values 1-10000
const timeSpeed = 14;

// perlin noise texture shader
var texture1ShaderSource = `
    precision mediump float;
    
    uniform vec2 u_resolution;
    
float random (vec2 st) {
  return fract(sin(${Math.random().toFixed(
    2
  )} * dot(st.xy, vec2(12.9898,78.233))) * 1.0);
}

float noise (vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm (vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= ${fbmAmplitudeDecay.toFixed(2)};
  }

  return value;
}

vec4 floatToColor(float v) {
  float value = v * 255.0;
  float high = floor(value) / 255.0;
  float low = fract(value);
  return vec4(high, low, 0.0, 1.0);
}

void main() {
  vec2 texelSize = ${ssRadius.toFixed(2)} / u_resolution.xy;
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st *= ${scale.toFixed(2)};

  float v = fbm(st);
  /*
  float v2 = fbm(vec2(st.x + texelSize.x, st.x + texelSize.y));
  float v3 = fbm(vec2(st.x + texelSize.x, st.x - texelSize.y));
  float v4 = fbm(vec2(st.x - texelSize.x, st.x - texelSize.y));
  float v5 = fbm(vec2(st.x - texelSize.x, st.x + texelSize.y));

  float res = v * ${(1.0 - ssStrength).toFixed(2)} + v2 * ${(
  ssStrength / 4.0
).toFixed(2)} + v3 * ${(ssStrength / 4.0).toFixed(2)} + v4 * ${(
  ssStrength / 4.0
).toFixed(2)} + v5 * ${(ssStrength / 4.0).toFixed(2)};
  */
  gl_FragColor = floatToColor(v);
}
`;

// color palette texture shader
var texture2ShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform vec3 u_colors[${N}];
uniform float u_colorStops[${N - 1}];

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;

  vec3 color;
  float value = st.x;

  color = u_colors[${N - 1}];
  for (int i = 0; i < ${N}; i++) {
    if (value < (float(i) + 1.0) / ${N.toFixed(2)} /* u_colorStops[i] */) {
      color = u_colors[i];
      break;
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

// Fragment shader source code for rendering
var renderShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

// Function to draw a solid circle
void circle(vec2 position, float radius, vec3 color) {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 center = position / u_resolution.xy;
  
  float distance = length(st - center);
  
  if (distance <= (radius / max(u_resolution.x, u_resolution.y))) {
    gl_FragColor = vec4(color, 1.0);
  }
}

// Function to draw a gradient circle
void gradientCircle(vec2 position, float radius, vec3 color) {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 center = position / u_resolution.xy;
  
  float distance = length(st - center);
  
  // Calculate the alpha value based on the distance from the center
  float alpha = smoothstep(radius / max(u_resolution.x, u_resolution.y), 0.0, distance);
  
  gl_FragColor = vec4(color * alpha, 1.0);
}

// Function to draw a ring
void ring(vec2 position, float innerRadius, float outerRadius, vec3 color) {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 center = position / u_resolution.xy;
  
  float distance = length(st - center);
  
  if (distance >= (innerRadius / max(u_resolution.x, u_resolution.y)) &&
      distance <= (outerRadius / max(u_resolution.x, u_resolution.y))) {
    gl_FragColor = vec4(color, 1.0);
  }
}

void main() {
  vec2 center = u_resolution / 2.0;
  vec2 sunPosition = center;
  float sunRadius = min(u_resolution.x, u_resolution.y) * 0.2;
  float solarCrownRadius = min(u_resolution.x, u_resolution.y) * 0.3;
 
  float earthDistance = sunRadius * 1.925;
  vec2 earthPosition = vec2(
    center.x + sin(u_time * 0.3) * earthDistance,
    center.y + cos(u_time * 0.3) * earthDistance
  );
  float earthRadius = sunRadius * 0.2;
 
  float moonDistance = (earthRadius * 1.7);
  vec2 moonPosition = vec2(
    earthPosition.x + sin(u_time * 3.6) * moonDistance,
    earthPosition.y + cos(u_time * 3.6) * moonDistance 
  );
  float moonRadius = earthRadius * 0.25;
  
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
    
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  gradientCircle(sunPosition, solarCrownRadius, vec3(1.0, 0.7, 0.0));
  circle(sunPosition, sunRadius, vec3(1.0, 0.7, 0.0));
  ring(sunPosition, earthDistance, earthDistance + 1.5, vec3(0.4, 0.4, 0.4));
  ring(earthPosition, moonDistance, moonDistance + 1.0, vec3(0.4, 0.4, 0.4));
  circle(earthPosition, earthRadius, vec3(0.0, 0.5, 1.0));
  circle(moonPosition, moonRadius, vec3(0.8, 0.8, 0.8));
}
 
`;

// Vertex shader source code
var vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

// Create WebGL context
var canvas = document.getElementById("canvas");
// set initial canvas size which will be used for texture dimensions
canvas.width = window.innerWidth * window.devicePixelRatio * aaf;
canvas.height = window.innerHeight * window.devicePixelRatio * aaf;
var gl = canvas.getContext("webgl");

// Create shaders
var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var texture1Shader = createShader(gl, gl.FRAGMENT_SHADER, texture1ShaderSource);
var texture2Shader = createShader(gl, gl.FRAGMENT_SHADER, texture2ShaderSource);
var renderShader = createShader(gl, gl.FRAGMENT_SHADER, renderShaderSource);

// Create programs
var texture1Program = createProgram(gl, vertexShader, texture1Shader);
var texture2Program = createProgram(gl, vertexShader, texture2Shader);
var renderProgram = createProgram(gl, vertexShader, renderShader);

// Look up attribute and uniform locations for texture1 program
var texture1PositionLocation = gl.getAttribLocation(
  texture1Program,
  "a_position"
);
var texture1ResolutionLocation = gl.getUniformLocation(
  texture1Program,
  "u_resolution"
);

// Look up attribute and uniform locations for texture2 program
var texture2PositionLocation = gl.getAttribLocation(
  texture2Program,
  "a_position"
);
var texture2ResolutionLocation = gl.getUniformLocation(
  texture2Program,
  "u_resolution"
);

// Look up attribute and uniform locations for render program
var renderPositionLocation = gl.getAttribLocation(renderProgram, "a_position");
var renderTimeLocation = gl.getUniformLocation(renderProgram, "u_time");
var renderResolutionLocation = gl.getUniformLocation(
  renderProgram,
  "u_resolution"
);
var renderTextureResolutionLocation = gl.getUniformLocation(
  renderProgram,
  "u_texture_resolution"
);
var renderTexture1Location = gl.getUniformLocation(renderProgram, "u_texture1");
var renderTexture2Location = gl.getUniformLocation(renderProgram, "u_texture2");

// Create buffer and bind it to the position attribute for texture1 program
var texture1Buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texture1Buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0,
    -1.0, // Bottom left corner
    1.0,
    -1.0, // Bottom right corner
    -1.0,
    1.0, // Top left corner
    1.0,
    1.0, // Top right corner
  ]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(texture1PositionLocation);
gl.vertexAttribPointer(texture1PositionLocation, 2, gl.FLOAT, false, 0, 0);

// Create buffer and bind it to the position attribute for texture2 program
var texture2Buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texture2Buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0,
    -1.0, // Bottom left corner
    1.0,
    -1.0, // Bottom right corner
    -1.0,
    1.0, // Top left corner
    1.0,
    1.0, // Top right corner
  ]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(texture2PositionLocation);
gl.vertexAttribPointer(texture2PositionLocation, 2, gl.FLOAT, false, 0, 0);

// Create buffer and bind it to the position attribute for render program
var renderBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, renderBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0,
    -1.0, // Bottom left corner
    1.0,
    -1.0, // Bottom right corner
    -1.0,
    1.0, // Top left corner
    1.0,
    1.0, // Top right corner
  ]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(renderPositionLocation);
gl.vertexAttribPointer(renderPositionLocation, 2, gl.FLOAT, false, 0, 0);

// Create framebuffers for texture rendering
var texture1Framebuffer = createFramebuffer();
var texture2Framebuffer = createFramebuffer();

// Render textures
const texture1 = renderTexture(
  texture1Program,
  texture1Framebuffer,
  texture1PositionLocation,
  texture1ResolutionLocation,
  gl.TEXTURE0
);
const texture2 = renderTexture(
  texture2Program,
  texture2Framebuffer,
  texture2PositionLocation,
  texture2ResolutionLocation,
  gl.TEXTURE1
);

// Bind render program and set uniforms
gl.useProgram(renderProgram);
gl.uniform1i(renderTexture1Location, 0);
gl.uniform1i(renderTexture2Location, 1);

// remember canvas initial width and height
const initialWidth = canvas.width;
const initialHeight = canvas.height;

// resize function
function resize() {
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.width = window.innerWidth * devicePixelRatio;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

// Render loop
function renderLoop() {
  // Clear the canvas
  //gl.clearColor(0.0, 0.0, 0.0, 1.0);
  //gl.clear(gl.COLOR_BUFFER_BIT);

  // Set render shader uniforms
  gl.uniform1f(renderTimeLocation, performance.now() * 0.001); // Pass time in seconds
  // console.log(performance.now() * 0.001);
  gl.uniform2f(renderResolutionLocation, canvas.width, canvas.height); // Pass render resolution
  gl.uniform2f(renderTextureResolutionLocation, initialWidth, initialHeight); // Pass texture resolution

  // Bind the textures to their respective texture units
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture1);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture2);

  // Render to canvas
  //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // gl.viewport(0, 0, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Request the next frame
  requestAnimationFrame(renderLoop);
}

// Start the render loop
resize();
window.addEventListener("resize", resize);
renderLoop();

// Helper functions

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function createFramebuffer() {
  var framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  return framebuffer;
}

function renderTexture(
  program,
  framebuffer,
  positionLocation,
  resolutionLocation,
  glTexture
) {
  var texture = gl.createTexture();
  gl.activeTexture(glTexture);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    canvas.width,
    canvas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Use the program and render to the framebuffer
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);
  // Set the resolution uniform
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  // Set color uniforms for the second texture
  if (glTexture === gl.TEXTURE1) {
    const colorsUniformLocation = gl.getUniformLocation(program, "u_colors");
    gl.uniform3fv(colorsUniformLocation, flattenedColors);
  }

  // Bind the framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  // Attach the texture to the framebuffer
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  //gl.clearColor(0.0, 0.0, 0.0, 1.0);
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER).toString(0x10));

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Unbind the framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // Return the texture
  return texture;
}
