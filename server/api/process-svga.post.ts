// server/api/process-svga.post.ts
// Parses SVGA file on the server using protobufjs + zlib (no Web Workers)
// Outputs JSON in SVGAPlayer-Web-Lite "Video" format (compatible with Player.mount())
import { defineEventHandler, readBody } from 'h3'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import { inflateSync } from 'zlib'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const protobuf = require('protobufjs') as typeof import('protobufjs')

// SVGA v2 protobuf schema (extracted from svga npm package)
const svgaProtoJSON = {
  nested: {
    com: {
      nested: {
        opensource: {
          nested: {
            svga: {
              options: {
                objc_class_prefix: 'SVGAProto',
                java_package: 'com.opensource.svgaplayer',
              },
              nested: {
                MovieParams: {
                  fields: {
                    viewBoxWidth: { type: 'float', id: 1 },
                    viewBoxHeight: { type: 'float', id: 2 },
                    fps: { type: 'int32', id: 3 },
                    frames: { type: 'int32', id: 4 },
                  },
                },
                SpriteEntity: {
                  fields: {
                    imageKey: { type: 'string', id: 1 },
                    frames: { rule: 'repeated', type: 'FrameEntity', id: 2 },
                  },
                },
                Layout: {
                  fields: {
                    x: { type: 'float', id: 1 },
                    y: { type: 'float', id: 2 },
                    width: { type: 'float', id: 3 },
                    height: { type: 'float', id: 4 },
                  },
                },
                Transform: {
                  fields: {
                    a: { type: 'float', id: 1 },
                    b: { type: 'float', id: 2 },
                    c: { type: 'float', id: 3 },
                    d: { type: 'float', id: 4 },
                    tx: { type: 'float', id: 5 },
                    ty: { type: 'float', id: 6 },
                  },
                },
                ShapeEntity: {
                  oneofs: { args: { oneof: ['shape', 'rect', 'ellipse'] } },
                  fields: {
                    type: { type: 'ShapeType', id: 1 },
                    shape: { type: 'ShapeArgs', id: 2 },
                    rect: { type: 'RectArgs', id: 3 },
                    ellipse: { type: 'EllipseArgs', id: 4 },
                    styles: { type: 'ShapeStyle', id: 10 },
                    transform: { type: 'Transform', id: 11 },
                  },
                  nested: {
                    ShapeType: { values: { SHAPE: 0, RECT: 1, ELLIPSE: 2, KEEP: 3 } },
                    ShapeArgs: { fields: { d: { type: 'string', id: 1 } } },
                    RectArgs: {
                      fields: {
                        x: { type: 'float', id: 1 },
                        y: { type: 'float', id: 2 },
                        width: { type: 'float', id: 3 },
                        height: { type: 'float', id: 4 },
                        cornerRadius: { type: 'float', id: 5 },
                      },
                    },
                    EllipseArgs: {
                      fields: {
                        x: { type: 'float', id: 1 },
                        y: { type: 'float', id: 2 },
                        radiusX: { type: 'float', id: 3 },
                        radiusY: { type: 'float', id: 4 },
                      },
                    },
                    ShapeStyle: {
                      fields: {
                        fill: { type: 'RGBAColor', id: 1 },
                        stroke: { type: 'RGBAColor', id: 2 },
                        strokeWidth: { type: 'float', id: 3 },
                        lineCap: { type: 'LineCap', id: 4 },
                        lineJoin: { type: 'LineJoin', id: 5 },
                        miterLimit: { type: 'float', id: 6 },
                        lineDashI: { type: 'float', id: 7 },
                        lineDashII: { type: 'float', id: 8 },
                        lineDashIII: { type: 'float', id: 9 },
                      },
                      nested: {
                        RGBAColor: {
                          fields: {
                            r: { type: 'float', id: 1 },
                            g: { type: 'float', id: 2 },
                            b: { type: 'float', id: 3 },
                            a: { type: 'float', id: 4 },
                          },
                        },
                        LineCap: { values: { LineCap_BUTT: 0, LineCap_ROUND: 1, LineCap_SQUARE: 2 } },
                        LineJoin: { values: { LineJoin_MITER: 0, LineJoin_ROUND: 1, LineJoin_BEVEL: 2 } },
                      },
                    },
                  },
                },
                FrameEntity: {
                  fields: {
                    alpha: { type: 'float', id: 1 },
                    layout: { type: 'Layout', id: 2 },
                    transform: { type: 'Transform', id: 3 },
                    clipPath: { type: 'string', id: 4 },
                    shapes: { rule: 'repeated', type: 'ShapeEntity', id: 5 },
                  },
                },
                MovieEntity: {
                  fields: {
                    version: { type: 'string', id: 1 },
                    params: { type: 'MovieParams', id: 2 },
                    images: { keyType: 'string', type: 'bytes', id: 3 },
                    sprites: { rule: 'repeated', type: 'SpriteEntity', id: 4 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

// ========================================
// Movie → Video Conversion
// (replicates SVGAPlayer-Web-Lite's parser.js Ut constructor)
// ========================================

function convertRGBA(c: any): string | null {
  if (!c) return null
  return `rgba(${parseInt((255 * c.r).toString())}, ${parseInt((255 * c.g).toString())}, ${parseInt((255 * c.b).toString())}, ${parseInt((1 * c.a).toString())})`
}

function convertLineCap(val: number | null): string | null {
  switch (val) {
    case 0: return 'butt'
    case 1: return 'round'
    case 2: return 'square'
    default: return null
  }
}

function convertLineJoin(val: number | null): string | null {
  switch (val) {
    case 0: return 'miter'
    case 1: return 'round'
    case 2: return 'bevel'
    default: return null
  }
}

function convertTransform(t: any) {
  return {
    a: t?.a ?? 1,
    b: t?.b ?? 0,
    c: t?.c ?? 0,
    d: t?.d ?? 1,
    tx: t?.tx ?? 0,
    ty: t?.ty ?? 0,
  }
}

function convertLayout(l: any) {
  return {
    x: l?.x ?? 0,
    y: l?.y ?? 0,
    width: l?.width ?? 0,
    height: l?.height ?? 0,
  }
}

/** Convert MovieFrame shapes to VideoFrame shapes (CSS-style) */
function convertShapes(movieShapes: any[]): any[] {
  const result: any[] = []
  for (const shape of movieShapes) {
    const styles = shape.styles
    if (!styles) continue

    // Build lineDash array
    const lineDash: number[] = []
    if (styles.lineDashI != null && styles.lineDashI > 0) lineDash.push(styles.lineDashI)
    if (styles.lineDashII != null && styles.lineDashII > 0) {
      if (lineDash.length < 1) lineDash.push(0)
      lineDash.push(styles.lineDashII)
    }
    if (styles.lineDashIII != null && styles.lineDashIII > 0) {
      while (lineDash.length < 2) lineDash.push(0)
      lineDash[2] = styles.lineDashIII
    }

    const videoStyles = {
      fill: convertRGBA(styles.fill),
      stroke: convertRGBA(styles.stroke),
      strokeWidth: styles.strokeWidth ?? null,
      lineCap: convertLineCap(styles.lineCap ?? null),
      lineJoin: convertLineJoin(styles.lineJoin ?? null),
      miterLimit: styles.miterLimit ?? null,
      lineDash,
    }

    const transform = convertTransform(shape.transform)

    if (shape.type === 0 && shape.shape) {
      result.push({ type: 'shape', path: shape.shape, styles: videoStyles, transform })
    } else if (shape.type === 1 && shape.rect) {
      result.push({ type: 'rect', path: shape.rect, styles: videoStyles, transform })
    } else if (shape.type === 2 && shape.ellipse) {
      result.push({ type: 'ellipse', path: shape.ellipse, styles: videoStyles, transform })
    }
  }
  return result
}

/** Convert MovieEntity → Video (Player.mount() format) */
function movieToVideo(movie: any, imagesMap: Record<string, string>) {
  const params = movie.params || {}

  const sprites = (movie.sprites || []).map((sprite: any) => {
    let prevShapes: any[] | undefined
    const frames = (sprite.frames || []).map((frame: any) => {
      const layout = convertLayout(frame.layout)
      const transform = convertTransform(frame.transform)
      const clipPath = frame.clipPath ?? ''
      const alpha = frame.alpha ?? 0

      // Convert shapes; KEEP (type=3) means reuse previous frame's shapes
      let shapes: any[]
      if (frame.shapes?.length > 0 && frame.shapes[0].type === 3 && prevShapes) {
        shapes = prevShapes
      } else {
        shapes = convertShapes(frame.shapes || [])
        prevShapes = shapes
      }

      // Compute transformed nx, ny (top-left corner after transform)
      const S = layout
      const T = transform
      const x1 = T.a * S.x + T.c * S.y + T.tx
      const x2 = T.a * (S.x + S.width) + T.c * S.y + T.tx
      const x3 = T.a * S.x + T.c * (S.y + S.height) + T.tx
      const x4 = T.a * (S.x + S.width) + T.c * (S.y + S.height) + T.tx
      const y1 = T.b * S.x + T.d * S.y + T.ty
      const y2 = T.b * (S.x + S.width) + T.d * S.y + T.ty
      const y3 = T.b * S.x + T.d * (S.y + S.height) + T.ty
      const y4 = T.b * (S.x + S.width) + T.d * (S.y + S.height) + T.ty
      const nx = Math.min(x1, x2, x3, x4)
      const ny = Math.min(y1, y2, y3, y4)

      // Build maskPath from clipPath
      const maskPath = clipPath.length > 0
        ? {
            d: clipPath,
            transform: undefined,
            styles: {
              fill: 'rgba(0, 0, 0, 0)',
              stroke: null,
              strokeWidth: null,
              lineCap: null,
              lineJoin: null,
              miterLimit: null,
              lineDash: null,
            },
          }
        : null

      return { alpha, layout, transform, clipPath, shapes, nx, ny, maskPath }
    })

    return { imageKey: sprite.imageKey || '', frames }
  })

  return {
    version: movie.version || '2.0',
    size: {
      width: params.viewBoxWidth || 0,
      height: params.viewBoxHeight || 0,
    },
    fps: params.fps || 20,
    frames: params.frames || 0,
    images: imagesMap,
    replaceElements: {},
    dynamicElements: {},
    sprites,
  }
}

// ========================================
// Detect SVGA version from first bytes
// ========================================
function detectVersion(data: Uint8Array): number {
  if (data[0] === 0x50 && data[1] === 0x4b) return 1
  return 2
}

// Initialize protobuf type (cached)
let MovieEntityType: protobuf.Type | null = null
function getMovieEntity(): protobuf.Type {
  if (!MovieEntityType) {
    const root = protobuf.Root.fromJSON(svgaProtoJSON)
    MovieEntityType = root.lookupType('com.opensource.svga.MovieEntity')
  }
  return MovieEntityType
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { filename, outputName } = body

  if (!filename || !outputName) {
    return { success: false, error: 'Missing filename or outputName' }
  }

  const cwd = process.cwd()
  const rawPath = join(cwd, 'raw', filename)

  if (!existsSync(rawPath)) {
    return { success: false, error: `File not found: ${rawPath}` }
  }

  try {
    const svgaBuffer = readFileSync(rawPath)
    const data = new Uint8Array(svgaBuffer)

    // Detect version
    const version = detectVersion(data)
    if (version === 1) {
      return { success: false, error: 'SVGA v1 (ZIP-based) is not supported. Please use SVGA v2 files.' }
    }

    // Decompress with zlib inflate
    const decompressed = inflateSync(svgaBuffer)

    // Decode protobuf
    const movieType = getMovieEntity()
    const movie = movieType.decode(new Uint8Array(decompressed)) as any

    // Convert images to base64 strings (same format as SVGAPlayer-Web-Lite parser)
    const imagesMap: Record<string, string> = {}
    const rawImages = movie.images || {}
    for (const key of Object.keys(rawImages)) {
      const bytes = rawImages[key]
      if (bytes && bytes.length > 0) {
        // Convert Uint8Array to base64 string (matches btoa path in svga parser.js)
        imagesMap[key] = Buffer.from(bytes).toString('base64')
      }
    }

    // Convert Movie → Video format
    const videoData = movieToVideo(movie, imagesMap)

    // Save JSON output
    const outDir = join(cwd, 'output', 'svga', outputName)
    await mkdir(outDir, { recursive: true })

    const jsonPath = join(outDir, `${outputName}.json`)
    const jsonString = JSON.stringify(videoData)
    await writeFile(jsonPath, jsonString)

    // Save individual images as PNG files (for preview/thumbnails)
    for (const [key, base64] of Object.entries(imagesMap)) {
      const imgPath = join(outDir, `${key}.png`)
      await writeFile(imgPath, Buffer.from(base64, 'base64'))
    }

    const stats = {
      frames: videoData.frames,
      viewBoxWidth: videoData.size.width,
      viewBoxHeight: videoData.size.height,
      fps: videoData.fps,
      images: Object.keys(imagesMap).length,
      sprites: videoData.sprites.length,
    }

    return {
      success: true,
      outputPath: jsonPath,
      jsonSize: jsonString.length,
      stats,
      log: `✅ Parsed SVGA v2 → Video JSON (Player.mount() compatible)\n📦 Output: ${jsonPath}\n🎞️ ${stats.frames} frames @ ${stats.fps}fps\n📐 ${stats.viewBoxWidth}×${stats.viewBoxHeight}\n🖼️ ${stats.images} images, ${stats.sprites} sprites`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'SVGA parsing failed'
    const stack = err instanceof Error ? err.stack : String(err)
    console.error('SVGA parse error:', err)
    return {
      success: false,
      error: message,
      log: stack || message,
    }
  }
})
