// module.exports = physical
//import {AABB as aabb} from "./aabb.js"
import {Vector3} from "three"

// make these *once*, so we're not generating
// garbage for every object in the game.
const WORLD_DESIRED = new Vector3(0, 0, 0)
    , DESIRED = new Vector3(0, 0, 0)
    , START = new Vector3(0, 0, 0)
    , END = new Vector3(0, 0, 0)
    , DIRECTION = new Vector3()
    , LOCAL_ATTRACTOR = new Vector3()
    , TOTAL_FORCES = new Vector3()

function applyTo(which) {
    return function(world) {
        var local = this.avatar.worldToLocal(world)
        this[which].x += local.x
        this[which].y += local.y
        this[which].z += local.z
    }
}

const abs = Math.abs

//JOSH: I don't know what this is for
// , axes = ['x', 'y', 'z']

export class Physical {

    constructor(avatar, collidables, dimensions, terminal) {
        //a connection to the underlying threejs object
        this.avatar = avatar
        //terminal velocity. default is pretty slow?
        this.terminal = terminal || new Vector3(0.9, 0.1, 0.9)
        //the size of the object as width, height, depth in a vector3
        //default dimensions are a 1x1x1 cube
        this.dimensions = dimensions = dimensions || new Vector3(1, 1, 1)
        //turn dimensions into an AABB (axis aligned bounding box)
        this._aabb = aabb(new Vector3(0, 0, 0), dimensions)
        //indicates if not moving in each direction
        this.resting = {x: false, y: false, z: false}
        this.old_resting_y = 0
        this.last_rest_y = NaN

        //a list of objects that this Physical can collide with
        this.collidables = collidables
        //default fiction. should this be modifyable?
        this.friction = new Vector3(1, 1, 1)

        //the current rotation of the avatar. a threejs euler angle
        this.rotation = this.avatar.rotation
        this.default_friction = 1

        // default yaw/pitch/roll controls to the avatar
        this.yaw =
            this.pitch =
                this.roll = avatar

        // the current total of forces affecting this object
        this.forces = new Vector3(0, 0, 0)
        // a list of attractors affecting this object. meaning something you are pulled towards
        this.attractors = []
        //current acceleration.
        this.acceleration = new Vector3(0, 0, 0)
        //current velocity
        this.velocity = new Vector3(0, 0, 0)


        this.applyWorldAcceleration = applyTo('acceleration')
        this.applyWorldVelocity = applyTo('velocity')
    }


    tick(dt) {
        let forces = this.forces
        let acceleration = this.acceleration
        let velocity = this.velocity
        let terminal = this.terminal
        let friction = this.friction
        let desired = DESIRED
        let world_desired = WORLD_DESIRED
        let bbox
        let pcs

        TOTAL_FORCES.multiplyScalar(0)

        desired.x =
            desired.y =
                desired.z =
                    world_desired.x =
                        world_desired.y =
                            world_desired.z = 0

        //add in the attractors force
        /*
        for (let i = 0; i < this.attractors.length; i++) {
            var distance_factor = this.avatar.position.distanceToSquared(this.attractors[i])
            LOCAL_ATTRACTOR.copy(this.attractors[i])
            LOCAL_ATTRACTOR = this.avatar.worldToLocal(LOCAL_ATTRACTOR)

            DIRECTION.sub(LOCAL_ATTRACTOR, this.avatar.position)

            DIRECTION.divideScalar(DIRECTION.length() * distance_factor)
            DIRECTION.multiplyScalar(this.attractors[i].mass)

            TOTAL_FORCES.addSelf(DIRECTION)
        }
        */

        dt = dt/1000
        // console.log('the forces',this.forces)
        // console.log("dt",dt)
        // apply the forces
        if (!this.resting.x) {
            acceleration.x /= 8 * dt
            // acceleration.x += TOTAL_FORCES.x * dt
            acceleration.x += forces.x * dt

            velocity.x += acceleration.x * dt
            velocity.x *= friction.x

            if (abs(velocity.x) < terminal.x) {
                desired.x = (velocity.x * dt)
            } else if (velocity.x !== 0) {
                desired.x = (velocity.x / abs(velocity.x)) * terminal.x
            }
        } else {
            acceleration.x = velocity.x = 0
        }
        if (!this.resting.y) {
            // console.log('starting acc',acceleration.y)
            // acceleration.y /= 8 * dt
            acceleration.y = 0;
            // console.log("now",acceleration.y)
            // acceleration.y += TOTAL_FORCES.y * dt
            acceleration.y += forces.y * dt
            // console.log("ending accel",acceleration.y)
            // console.log('starting vel',velocity.y)
            velocity.y += acceleration.y// * dt
            // velocity.y *= friction.y
            console.log("ending vel",velocity.y)

            // console.log('desired y', desired.y)
            console.log('ternimal',terminal.y)
            if (abs(velocity.y) < terminal.y) {
                // console.log('less than terminal',)
                desired.y = (velocity.y * dt)
                // console.log('dt is',dt)
            } else if (velocity.y !== 0) {
                desired.y = (velocity.y / abs(velocity.y)) * terminal.y
            }
        } else {
            // console.log("resting again")
            acceleration.y = velocity.y = 0
        }
        if (!this.resting.z) {
            acceleration.z /= 8 * dt
            acceleration.z += TOTAL_FORCES.z * dt
            acceleration.z += forces.z * dt

            velocity.z += acceleration.z * dt
            velocity.z *= friction.z

            if (abs(velocity.z) < terminal.z) {
                desired.z = (velocity.z * dt)
            } else if (velocity.z !== 0) {
                desired.z = (velocity.z / abs(velocity.z)) * terminal.z
            }
        } else {
            acceleration.z = velocity.z = 0
        }

        // console.log('starting postion',this.avatar.position)
        // console.log('desired is',desired)
        START.copy(this.avatar.position)
        this.avatar.translateX(desired.x)
        this.avatar.translateY(desired.y)
        this.avatar.translateZ(desired.z)
        END.copy(this.avatar.position)
        this.avatar.position.copy(START)

        //START is where the object is now
        //END is where the object will be after the movement is applied
        //desired is the direction vector that was calculated
        //JOSH: I think world desired is a direction vector for the current motion
        world_desired.x = END.x - START.x
        world_desired.y = END.y - START.y
        world_desired.z = END.z - START.z
        // console.log('world destired stare is',world_desired)

        // console.log('start',START,'end',END, 'diff', world_desired)
        // console.log("world desired",world_desired)
        //set the friction in all directions
        this.friction.x =
            this.friction.y =
                this.friction.z = this.default_friction

        // save old copies, since when normally on the
        // ground, this.resting.y alternates (false,-1)
        // JOSH: this part confuses me
        this.old_resting_y = (this.old_resting_y << 1) >>> 0
        this.old_resting_y |= !!this.resting.y | 0

        // run collisions
        this.resting.x =
            this.resting.y =
                this.resting.z = false

        bbox = this.aabb()
        pcs = this.collidables

        //collide against everything except myself
        for (let i = 0, len = pcs.length; i < len; ++i) {
            if (pcs[i] !== this) {
                pcs[i].collide(this, bbox, world_desired, this.resting)
            }
        }

        //what does this part do?
        /*
        // fall distance
        if (!!(this.old_resting_y & 0x4) !== !!this.resting.y) {
            if (!this.resting.y) {
                this.last_rest_y = this.avatar.position.y
            } else if (!isNaN(this.last_rest_y)) {
                this.fell(this.last_rest_y - this.avatar.position.y)
                this.last_rest_y = NaN
            }
        }
        */

        // apply translation
        this.avatar.position.x += world_desired.x
        this.avatar.position.y += world_desired.y
        this.avatar.position.z += world_desired.z
    }


    subjectTo (force) {
        this.forces.x += force[0]
        this.forces.y += force[1]
        this.forces.z += force[2]
        return this
    }



    removeForce (force) {
        this.forces.x -= force[0]
        this.forces.y -= force[1]
        this.forces.z -= force[2]
        return this
    }



    attractTo (vector, mass) {
        vector.mass = mass
        this.attractors.push(vector)
    }



    aabb () {
        const pos = this.avatar.position
        const d = this.dimensions
        return aabb(
            new Vector3(pos.x - (d.x / 2), pos.y, pos.z - (d.z / 2)),
            this.dimensions
        )
    }

// no object -> object collisions for now, thanks


    collide (other, bbox, world_vec, resting) {
        return
    }



    atRestX () {
        return this.resting.x
    }



    atRestY () {
        return this.resting.y
    }

    atRestZ () {
        return this.resting.z
    }

    fell (distance) {
        return
    }
}
