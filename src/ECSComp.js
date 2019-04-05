export class ECSComp {
    constructor() {
        this._listeners = {}
        this._enabled = false
    }
    addEventListener(type, cb) {
        if(!this._listeners[type]) this._listeners[type] = []
        this._listeners[type].push(cb)
    }

    _fire(type,payload) {
        if(!this._listeners[type]) this._listeners[type] = []
        this._listeners[type].forEach(cb => cb(payload))
    }

    enable() {
        this._enabled = true
    }

    disable() {
        this._enabled = false
    }

    isEnabled() {
        return this._enabled
    }

    update(time) {

    }


}
