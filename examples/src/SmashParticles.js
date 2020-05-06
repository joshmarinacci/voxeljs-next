import {Vector3, Color, AdditiveBlending} from "three"
import {ECSComp} from '../../src/ECSComp.js'
import {GPUParticleSystem} from './GPUParticleSystem.js'
import {rand} from "../../src/utils.js"

export class SmashParticles extends ECSComp {
    constructor(app) {
        super()
        this.app = app
        this.startTime = -1
        this.options = {
            position: new Vector3(0, 0, 0),
            positionRandomness: 0.0,
            velocity: new Vector3(0.0, 1.0, 0.0),
            velocityRandomness: 1.0,
            acceleration: new Vector3(0.0, 0.0, 0.0),
            color: new Color(1.0, 0.0, 0.0),
            endColor: new Color(0.5, 0.5, 0.5),
            colorRandomness: 0.0,
            lifetime: 0.20,
            fadeIn: 0.000,
            fadeOut: 0.000,
            size: 20,
            sizeRandomness: 1.0,
        }
        let scorch_texture = app.textureLoader.load('./textures/smoke_08.png')
        this.particles = new GPUParticleSystem({
            maxParticles: 10000,
            particleSpriteTex: scorch_texture,
            blending: AdditiveBlending,
            onTick: (system, time) => {
                if (this.startTime === -1) this.startTime = time
                if (time < this.startTime + 0.05) {
                    for (let i = 0; i < 100; i++) {
                        this.options.velocity.set(rand(-5, 5), rand(-5, 5), rand(-5, 5))
                        system.spawnParticle(this.options);
                    }
                }
            }
        })
        app.playersGroup.add(this.particles)
    }

    fire(pos) {
        this.enable()
        this.particles.position.copy(pos)
        this.particles.position.add(new Vector3(0.5, 0.5, 0.5))
        setTimeout(() => {
            this.disable()
            this.startTime = -1
        }, 250)
    }

    update(time, dt) {
        this.particles.update(time)
    }
}
