import {Vector3,} from "three"
import {ECSComp} from '../../src/ECSComp.js'

const pubkey = 'pub-c-0a0c49cb-8e11-4b10-8347-3af6cf048b46';
const subkey = 'sub-c-1cf05cbc-4d88-11e9-82b8-86fda2e42ae9';

const CHANNEL = 'beta-movement'
const SEND_INTERVAL = 333;
export class PubnubNetworkplay extends ECSComp {
    constructor() {
        super()
        this.connecting = false
        this.connected = false
        this.lastPos = new Vector3(-100,-100,-100)
        this.currPos = new Vector3()
        this.voxels = []
        this.pubnub = new PubNub({
            publishKey: pubkey,
            subscribeKey: subkey,
        })
        this.pubnub.setUUID('voxeluser_'+Math.floor(Math.random()*1000000))
        this.pubnub.addListener({
            status:(e) => {
                console.log("PUBNUB status",e)
                if(e.category === 'PNConnectedCategory') {
                    this.connected = true
                }
            },
            message: (msg) =>{
                if(msg.publisher !== this.pubnub.getUUID()) {
                    // console.log("someone else moved",msg.publisher)
                    // console.log("PUBNUB message",msg)
                    if(msg.message.type === 'movement') this._fire('remote-player-moved',msg)
                    if(msg.message.type === 'voxels') this._fire('remote-player-voxels',msg)
                } else {
                    // console.log("it's me")
                }
            },
        })
        this.sendUpdates = () => {
            if(!this.lastPos.equals(this.currPos)) {
                // console.log("sending updates", this.currPos)
                this.lastPos.copy(this.currPos)
                this.pubnub.publish({
                    channel:CHANNEL,
                    message: {
                        type:'movement',
                        position: {
                            x:this.currPos.x,
                            y:this.currPos.y,
                            z:this.currPos.z
                        }
                    }
                },(status,response)=>{
                    if(status.error)   console.log("PUBNUB error?",status)
                })
            }
            if(this.voxels.length > 0) {
                const voxels = this.voxels.slice()
                // console.log("sending changed voxels:",voxels.length)
                this.voxels = []
                this.pubnub.publish({
                    channel: CHANNEL,
                    message: {
                        type:'voxels',
                        voxels:voxels
                    }
                }, (status,response) => {
                    if(status.error)   console.log("PUBNUB error?",status)
                })
            }
        }
    }

    connect() {
        console.log("PUBNUB subscribing")
        this.connecting = true
        this.pubnub.subscribe({channels:[CHANNEL]})
        setInterval(this.sendUpdates,SEND_INTERVAL)
    }

    isConnected() {
        return this.connected
    }

    isConnecting() {
        return this.connecting
    }

    playerMoved(phys) {
        this.currPos.copy(phys.target.position)
    }
    playerSetVoxel(pos,type) {
        this.voxels.push({
            type:type,
            position: {
                x:pos.x,
                y:pos.y,
                z:pos.z
            }
        })
    }
}
