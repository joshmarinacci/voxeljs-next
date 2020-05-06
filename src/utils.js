import {Quaternion, Ray, Vector2, Vector3,} from "three"
import {traceRay} from './raycast.js'

export function toHexColor(num) {
    let str = num.toString(16)
    while(str.length < 6) str = '0' + str
    return '#' + str
}


export function generateChunkInfoFromFunction(l, h, f) {
    let d = [ h[0]-l[0], h[1]-l[1], h[2]-l[2] ]
    let v = new Int32Array(d[0]*d[1]*d[2])
    let n = 0;
    for(let k=l[2]; k<h[2]; ++k)
        for(let j=l[1]; j<h[1]; ++j)
            for(let i=l[0]; i<h[0]; ++i, ++n) {
                v[n] = f(i,j,k);
            }
    return {
        low:l,
        high:h,
        voxels:v,
        dims:d,
    };
}


export const toRad = (deg) => Math.PI / 180 * deg


export const EPSILON = 1e-8


export const $ = (sel) => document.querySelector(sel)

export const DIRS = {
    NONE:'NONE',
    UP:'UP',
    DOWN:'DOWN',
    LEFT:'LEFT',
    RIGHT:'RIGHT'
}

export const on = (elem, type, cb) => elem.addEventListener(type,cb)


export function traceRayAtScreenCoords(app, pt, distance) {
    const ray = new Ray()

    // e = e.changedTouches[0]
    const mouse = new Vector2()
    const bounds = app.renderer.domElement.getBoundingClientRect()
    mouse.x = ((pt.x - bounds.left) / bounds.width) * 2 - 1
    mouse.y = -((pt.y - bounds.top) / bounds.height) * 2 + 1

    ray.origin.copy(app.camera.position)
    ray.direction.set(mouse.x, mouse.y, 0.5).unproject(app.camera).sub(ray.origin).normalize()

    app.stagePos.worldToLocal(ray.origin)
    ray.origin.add(new Vector3(0,0,-0.5))
    const quat = new Quaternion()
    quat.copy(app.stageRot.quaternion)
    quat.inverse()
    ray.direction.applyQuaternion(quat)

    const hitNormal = new Vector3(0,0,0)
    const hitPosition = new Vector3(0,0,0)
    const hitBlock = traceRay(app.chunkManager,ray.origin,ray.direction,distance,hitPosition,hitNormal,EPSILON)
    return {
        hitBlock:hitBlock,
        hitPosition:hitPosition,
        hitNormal: hitNormal
    }
}


export const rand = (min,max) => Math.random()*(max-min) + min
