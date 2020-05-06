import {Object3D, Vector3, Color, AdditiveBlending, RepeatWrapping, ShaderMaterial, BufferGeometry, BufferAttribute, Points } from "three"
import {ECSComp} from '../../src/ECSComp.js'

/*
* modified from the version from the ThreeJS examples repo
 */

const vertexShader =
    `
                uniform float uTime;
                uniform float uScale;
                uniform bool reverseTime;
                uniform float fadeIn;
                uniform float fadeOut;
    
                attribute vec3 positionStart;
                attribute float startTime;
                attribute vec3 velocity;
                attribute vec3 acceleration;
                attribute vec3 color;
                attribute vec3 endColor;
                attribute float size;
                attribute float lifeTime;
    
                varying vec4 vColor;
                varying vec4 vEndColor;
                varying float lifeLeft;
                varying float alpha;
    
                void main() {
                    vColor = vec4( color, 1.0 );
                    vEndColor = vec4( endColor, 1.0);
                    vec3 newPosition;
                    float timeElapsed = uTime - startTime;
                    if(reverseTime) timeElapsed = lifeTime - timeElapsed;
                    if(timeElapsed < fadeIn) {
                        alpha = timeElapsed/fadeIn;
                    }
                    if(timeElapsed >= fadeIn && timeElapsed <= (lifeTime - fadeOut)) {
                        alpha = 1.0;
                    }
                    if(timeElapsed > (lifeTime - fadeOut)) {
                        alpha = 1.0 - (timeElapsed - (lifeTime-fadeOut))/fadeOut;
                    }
                    
                    lifeLeft = 1.0 - ( timeElapsed / lifeTime );
                    gl_PointSize = ( uScale * size );// * lifeLeft;
                    newPosition = positionStart 
                        + (velocity * timeElapsed)
                        + (acceleration * 0.5 * timeElapsed * timeElapsed)
                        ;
                    if (lifeLeft < 0.0) { 
                        lifeLeft = 0.0; 
                        gl_PointSize = 0.;
                    }
                    //while active use the new position
                    if( timeElapsed > 0.0 ) {
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
                    } else {
                        //if dead use the initial position and set point size to 0
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                        lifeLeft = 0.0;
                        gl_PointSize = 0.;
                    }
                }
                `

const fragmentShader = `
                varying vec4 vColor;
                varying vec4 vEndColor;
                varying float lifeLeft;
                varying float alpha;
                uniform sampler2D tSprite;
                void main() {
                    // color based on particle texture and the lifeLeft. 
                    // if lifeLeft is 0 then make invisible
                    vec4 tex = texture2D( tSprite, gl_PointCoord );
                    vec4 color = mix(vColor, vEndColor, 1.0-lifeLeft);
                    gl_FragColor = vec4( color.rgb*tex.rgb, alpha * tex.a);
                }
    
            `

const UPDATEABLE_ATTRIBUTES = [
    'positionStart', 'startTime',
    'velocity', 'acceleration',
    'color', 'endColor',
    'size', 'lifeTime']

export class GPUParticleSystem extends  Object3D {
    constructor(options) {
        super()
        options = options || {};


        this.blending = options.blending? options.blending : NormalBlending
        this.PARTICLE_COUNT = options.maxParticles || 1000000;
        this.PARTICLE_CURSOR = 0;
        this.time = 0;
        this.offset = 0;
        this.count = 0;
        this.DPR = window.devicePixelRatio;
        this.particleUpdate = false;
        this.onTick = options.onTick

        this.reverseTime = options.reverseTime
        this.fadeIn = options.fadeIn || 1
        if(this.fadeIn === 0) this.fadeIn = 0.001
        this.fadeOut = options.fadeOut || 1
        if(this.fadeOut === 0) this.fadeOut = 0.001

        // preload a 10_000 random numbers from -0.5 to 0.5
        this.rand = [];
        let i;
        for (i = 1e5; i>0; i--) {
            this.rand.push( Math.random() - 0.5 );
        }
        this.i = i

        //setup the texture
        this.sprite = options.particleSpriteTex || null;
        if(!this.sprite) throw new Error("No particle sprite texture specified")
        this.sprite.wrapS = this.sprite.wrapT = RepeatWrapping;

        //setup the shader material
        this.material = new ShaderMaterial( {
            transparent: true,
            depthWrite: false,
            uniforms: {
                'uTime': {
                    value: 0.0
                },
                'uScale': {
                    value: 1.0
                },
                'tSprite': {
                    value: this.sprite
                },
                reverseTime: {
                    value: this.reverseTime
                },
                fadeIn: {
                    value: this.fadeIn
                },
                fadeOut: {
                    value: this.fadeOut,
                }
            },
            blending: this.blending,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        } );

        // define defaults for all values
        this.material.defaultAttributeValues.particlePositionsStartTime = [ 0, 0, 0, 0 ];
        this.material.defaultAttributeValues.particleVelColSizeLife = [ 0, 0, 0, 0 ];


        // geometry
        this.geometry = new BufferGeometry();

        //vec3 attributes
        this.geometry.addAttribute('position',      new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
        this.geometry.addAttribute('positionStart', new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
        this.geometry.addAttribute('velocity',      new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
        this.geometry.addAttribute('acceleration',  new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
        this.geometry.addAttribute('color',         new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));
        this.geometry.addAttribute('endColor',      new BufferAttribute(new Float32Array(this.PARTICLE_COUNT * 3), 3).setDynamic(true));

        //scalar attributes
        this.geometry.addAttribute('startTime',     new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));
        this.geometry.addAttribute('size',          new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));
        this.geometry.addAttribute('lifeTime',      new BufferAttribute(new Float32Array(this.PARTICLE_COUNT), 1).setDynamic(true));


        this.particleSystem = new Points(this.geometry, this.material);
        this.particleSystem.frustumCulled = false;
        this.add(this.particleSystem);
    }

    /*
      This updates the geometry on the shader if at least one particle has been spawned.
      It uses the offset and the count to determine which part of the data needs to actually
      be sent to the GPU. This ensures no more data than necessary is sent.
     */
    geometryUpdate () {
        if (this.particleUpdate === true) {
            this.particleUpdate = false;
            UPDATEABLE_ATTRIBUTES.forEach(name => {
                const attr = this.geometry.getAttribute(name)
                if (this.offset + this.count < this.PARTICLE_COUNT) {
                    attr.updateRange.offset = this.offset * attr.itemSize
                    attr.updateRange.count = this.count * attr.itemSize
                } else {
                    attr.updateRange.offset = 0
                    attr.updateRange.count = -1
                }
                attr.needsUpdate = true
            })
            this.offset = 0;
            this.count = 0;
        }
    }


    //use one of the random numbers
    random () {
        return ++ this.i >= this.rand.length ? this.rand[ this.i = 1 ] : this.rand[ this.i ];
    }

    update ( ttime ) {
        this.time = ttime/1000
        this.material.uniforms.uTime.value = this.time;
        if(this.onTick) this.onTick(this,this.time)
        this.geometryUpdate();
    }

    dispose () {
        this.material.dispose();
        this.sprite.dispose();
        this.geometry.dispose();
    }

    /* spawn a particle

    This works by updating values inside of
    the attribute arrays, then updates the count and the PARTICLE_CURSOR and
    sets particleUpdate to true.

    This if spawnParticle is called three times in a row before rendering,
    then count will be 3 and the cursor will have moved by three.
     */
    spawnParticle ( options ) {
        let position = new Vector3()
        let velocity = new Vector3()
        let acceleration = new Vector3()
        let color = new Color()
        let endColor = new Color()

        const positionStartAttribute = this.geometry.getAttribute('positionStart')
        const startTimeAttribute = this.geometry.getAttribute('startTime')
        const velocityAttribute = this.geometry.getAttribute('velocity')
        const accelerationAttribute = this.geometry.getAttribute('acceleration')
        const colorAttribute = this.geometry.getAttribute('color')
        const endcolorAttribute = this.geometry.getAttribute('endColor')
        const sizeAttribute = this.geometry.getAttribute('size')
        const lifeTimeAttribute = this.geometry.getAttribute('lifeTime')

        options = options || {};

        // setup reasonable default values for all arguments

        position = options.position !== undefined ? position.copy(options.position) : position.set(0, 0, 0);
        velocity = options.velocity !== undefined ? velocity.copy(options.velocity) : velocity.set(0, 0, 0);
        acceleration = options.acceleration !== undefined ? acceleration.copy(options.acceleration) : acceleration.set(0, 0, 0);
        color = options.color !== undefined ? color.copy(options.color) : color.set(0xffffff);
        endColor = options.endColor !== undefined ? endColor.copy(options.endColor) : endColor.copy(color)

        const lifetime = options.lifetime !== undefined ? options.lifetime : 5
        let size = options.size !== undefined ? options.size : 10
        const sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 0

        if (this.DPR !== undefined) size *= this.DPR;

        const i = this.PARTICLE_CURSOR

        // position
        positionStartAttribute.array[i * 3 + 0] = position.x
        positionStartAttribute.array[i * 3 + 1] = position.y
        positionStartAttribute.array[i * 3 + 2] = position.z

        velocityAttribute.array[i * 3 + 0] = velocity.x;
        velocityAttribute.array[i * 3 + 1] = velocity.y;
        velocityAttribute.array[i * 3 + 2] = velocity.z;

        accelerationAttribute.array[i * 3 + 0] = acceleration.x;
        accelerationAttribute.array[i * 3 + 1] = acceleration.y;
        accelerationAttribute.array[i * 3 + 2] = acceleration.z;

        colorAttribute.array[i * 3 + 0] = color.r;
        colorAttribute.array[i * 3 + 1] = color.g;
        colorAttribute.array[i * 3 + 2] = color.b;

        endcolorAttribute.array[i * 3 + 0] = endColor.r;
        endcolorAttribute.array[i * 3 + 1] = endColor.g;
        endcolorAttribute.array[i * 3 + 2] = endColor.b;

        //size, lifetime and starttime
        sizeAttribute.array[i] = size + this.random() * sizeRandomness;
        lifeTimeAttribute.array[i] = lifetime;
        startTimeAttribute.array[i] = this.time + this.random() * 2e-2;

        // offset
        if (this.offset === 0) this.offset = this.PARTICLE_CURSOR;
        // counter and cursor
        this.count++;
        this.PARTICLE_CURSOR++;
        //wrap the cursor around
        if (this.PARTICLE_CURSOR >= this.PARTICLE_COUNT) this.PARTICLE_CURSOR = 0;
        this.particleUpdate = true;
    };
}
