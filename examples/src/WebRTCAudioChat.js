// https://github.com/stephenlb/webrtc-sdk

const pubkey = 'pub-c-0a0c49cb-8e11-4b10-8347-3af6cf048b46';
const subkey = 'sub-c-1cf05cbc-4d88-11e9-82b8-86fda2e42ae9';
const number = 'testnum1'

export class WebRTCAudioChat {
    constructor(app) {
        this.connected = false
    }

    connect() {
        this.phone = PHONE({
            number        : number
            ,   publish_key   : pubkey
            ,   subscribe_key : subkey
            ,   media:  {audio:true}
        });
        this.phone.debug( info => console.info('PHONE',info) );
        // Debugging Output
        // As soon as the phone is ready we can make calls

        this.phone.ready(()=>{
            console.log("PHONE_READY: system is connected!")
            this.connected = true
//         let session = phone.dial(number);
        });

        // When Call Comes In
        this.phone.receive((session) => {
            console.log("a phone call came in")
            // Display Your Friend's Live Video
            session.connected( session => {
                console.log('Session: CONNECTED');
//             phone.$('video-out').appendChild(session.video);
            });
            session.ended( session => {
                this.connected = false
                console.log('Session: ENDED')
            } );
        });
    }


    disconnect() {
        console.log("DISCONNECTING")
        this.phone.hangup()
    }


}
