function traceRay_impl(
    voxelProvider,
    px, py, pz,
    dx, dy, dz,
    max_d,
    hit_pos,
    hit_norm,
    EPSILON) {
    var t = 0.0
        , nx=0, ny=0, nz=0
        , ix, iy, iz
        , fx, fy, fz
        , ox, oy, oz
        , ex, ey, ez
        , b, step, min_step
        , floor = Math.floor
    //Step block-by-block along ray
    while(t <= max_d) {
        ox = px + t * dx
        oy = py + t * dy
        oz = pz + t * dz
        ix = floor(ox)|0
        iy = floor(oy)|0
        iz = floor(oz)|0
        fx = ox - ix
        fy = oy - iy
        fz = oz - iz
        b = voxelProvider.getBlock(ix, iy, iz)
        if(b) {
            if(hit_pos) {
                //Clamp to face on hit
                hit_pos.x = fx < EPSILON ? +ix : (fx > 1.0-EPSILON ? ix+1.0-EPSILON : ox)
                hit_pos.y = fy < EPSILON ? +iy : (fy > 1.0-EPSILON ? iy+1.0-EPSILON : oy)
                hit_pos.z = fz < EPSILON ? +iz : (fz > 1.0-EPSILON ? iz+1.0-EPSILON : oz)
            }
            if(hit_norm) {
                hit_norm.x = nx
                hit_norm.y = ny
                hit_norm.z = nz
            }
            return b
        }
        //Check edge cases
        min_step = +(EPSILON * (1.0 + t))
        if(t > min_step) {
            ex = nx < 0 ? fx <= min_step : fx >= 1.0 - min_step
            ey = ny < 0 ? fy <= min_step : fy >= 1.0 - min_step
            ez = nz < 0 ? fz <= min_step : fz >= 1.0 - min_step
            if(ex && ey && ez) {
                b = voxelProvider.getBlock(ix+nx, iy+ny, iz) ||
                    voxelProvider.getBlock(ix, iy+ny, iz+nz) ||
                    voxelProvider.getBlock(ix+nx, iy, iz+nz)
                if(b) {
                    if(hit_pos) {
                        hit_pos.x = nx < 0 ? ix-EPSILON : ix + 1.0-EPSILON
                        hit_pos.y = ny < 0 ? iy-EPSILON : iy + 1.0-EPSILON
                        hit_pos.z = nz < 0 ? iz-EPSILON : iz + 1.0-EPSILON
                    }
                    if(hit_norm) {
                        hit_norm.x = nx
                        hit_norm.y = ny
                        hit_norm.z = nz
                    }
                    return b
                }
            }
            if(ex && (ey || ez)) {
                b = voxelProvider.getBlock(ix+nx, iy, iz)
                if(b) {
                    if(hit_pos) {
                        hit_pos.x = nx < 0 ? ix-EPSILON : ix + 1.0-EPSILON
                        hit_pos.y = fy < EPSILON ? +iy : oy
                        hit_pos.z = fz < EPSILON ? +iz : oz
                    }
                    if(hit_norm) {
                        hit_norm.x = nx
                        hit_norm.y = ny
                        hit_norm.z = nz
                    }
                    return b
                }
            }
            if(ey && (ex || ez)) {
                b = voxelProvider.getBlock(ix, iy+ny, iz)
                if(b) {
                    if(hit_pos) {
                        hit_pos.x = fx < EPSILON ? +ix : ox
                        hit_pos.y = ny < 0 ? iy-EPSILON : iy + 1.0-EPSILON
                        hit_pos.z = fz < EPSILON ? +iz : oz
                    }
                    if(hit_norm) {
                        hit_norm.x = nx
                        hit_norm.y = ny
                        hit_norm.z = nz
                    }
                    return b
                }
            }
            if(ez && (ex || ey)) {
                b = voxelProvider.getBlock(ix, iy, iz+nz)
                if(b) {
                    if(hit_pos) {
                        hit_pos.x = fx < EPSILON ? +ix : ox
                        hit_pos.y = fy < EPSILON ? +iy : oy
                        hit_pos.z = nz < 0 ? iz-EPSILON : iz + 1.0-EPSILON
                    }
                    if(hit_norm) {
                        hit_norm.x = nx
                        hit_norm.y = ny
                        hit_norm.z = nz
                    }
                    return b
                }
            }
        }
        //Walk to next face of cube along ray
        nx = ny = nz = 0
        step = 2.0
        if(dx < -EPSILON) {
            var s = -fx/dx
            nx = 1
            step = s
        }
        if(dx > EPSILON) {
            var s = (1.0-fx)/dx
            nx = -1
            step = s
        }
        if(dy < -EPSILON) {
            var s = -fy/dy
            if(s < step-min_step) {
                nx = 0
                ny = 1
                step = s
            } else if(s < step+min_step) {
                ny = 1
            }
        }
        if(dy > EPSILON) {
            var s = (1.0-fy)/dy
            if(s < step-min_step) {
                nx = 0
                ny = -1
                step = s
            } else if(s < step+min_step) {
                ny = -1
            }
        }
        if(dz < -EPSILON) {
            var s = -fz/dz
            if(s < step-min_step) {
                nx = ny = 0
                nz = 1
                step = s
            } else if(s < step+min_step) {
                nz = 1
            }
        }
        if(dz > EPSILON) {
            var s = (1.0-fz)/dz
            if(s < step-min_step) {
                nx = ny = 0
                nz = -1
                step = s
            } else if(s < step+min_step) {
                nz = -1
            }
        }
        if(step > max_d - t) {
            step = max_d - t - min_step
        }
        if(step < min_step) {
            step = min_step
        }
        t += step
    }
    if(hit_pos) {
        hit_pos.x = ox;
        hit_pos.y = oy;
        hit_pos.z = oz;
    }
    if(hit_norm) {
        hit_norm.x = hit_norm.y = hit_norm.z = 0;
    }
    return 0
}

function startTraceRay(voxelProvider, origin, direction, max_d, hit_pos, hit_norm, EPSILON) {
    // console.log("tracing",origin,direction)
    var px = +origin.x
        , py = +origin.y
        , pz = +origin.z
        , dx = +direction.x
        , dy = +direction.y
        , dz = +direction.z
        , ds = Math.sqrt(dx*dx + dy*dy + dz*dz)
    if(typeof(EPSILON) === "undefined") {
        EPSILON = 1e-8
    }
    if(ds < EPSILON) {
        if(hit_pos) {
            hit_pos.x = hit_pos.y = hit_pos.z
        }
        if(hit_norm) {
            hit_norm.x = hit_norm.y = hit_norm.z
        }
        return 0;
    }
    dx /= ds
    dy /= ds
    dz /= ds
    if(typeof(max_d) === "undefined") {
        max_d = 64.0
    } else {
        max_d = +max_d
    }
    return traceRay_impl(voxelProvider, px, py, pz, dx, dy, dz, max_d, hit_pos, hit_norm, EPSILON)
}

export const traceRay = startTraceRay
// module.exports = traceRay
