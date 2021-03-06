'use strict';

const ENTER_KEY_CODE = 13
const ESC_KEY_CODE = 27
const SPACE_KEY_CODE = 32
const LEFT_KEY_CODE = 37
const UP_KEY_CODE = 38
const RIGHT_KEY_CODE = 39
const DOWN_KEY_CODE = 40
const KEY_CODE_H = 72
const KEY_CODE_J = 74
const KEY_CODE_K = 75
const KEY_CODE_L = 76

function hasValue(variable) {
    return variable !== undefined && variable !== null
}

function hasNoValue(variable) {
    return !hasValue(variable)
}

function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj)
}

function randomInt(min, max) {
    return min + Math.floor(Math.random()*((max-min)+1))
}

const RND_CHARS = 'QWERTYUIOP{}|":LKJHGFDSAZXCVBNM<>?1234567890qwertyuioplkjhgfdsazxcvbnm'
function randomChar() {
    return RND_CHARS.charAt(randomInt(0,RND_CHARS.length))
}
function randomString({minLength = 0, maxLength = 100}) {
    const length = randomInt(minLength, maxLength)
    const res = []
    for (let i = 0; i < length; i++) {
        res.push(randomChar())
    }
    return res.join('')
}

function ints(start, end) {
    let i = start
    const res = [];
    while (i <= end) {
        res.push(i)
        i++
    }
    return res
}

function prod(...arrays) {
    if (arrays.length) {
        const childProdResult = prod(...arrays.rest());
        return arrays.first().flatMap(e => childProdResult.map(row => [e,...row]))
    } else {
        return [[]]
    }
}

Array.prototype.min = function () {
    return this.reduce((a,b) => hasValue(a)?(hasValue(b)?(Math.min(a,b)):a):b)
}

Array.prototype.max = function () {
    return this.reduce((a,b) => hasValue(a)?(hasValue(b)?(Math.max(a,b)):a):b)
}

Array.prototype.sum = function () {
    return this.reduce((a,b) => a+b, 0)
}

Array.prototype.attr = function(...attrs) {
    if (attrs.length > 1) {
        return this.map(e => attrs.reduce((o,a)=>({...o,[a]:e[a]}), {}))
    } else {
        return this.map(e => e[attrs[0]])
    }
}

Array.prototype.first = function() {
    return this[0]
}

Array.prototype.last = function() {
    return this[this.length-1]
}

Array.prototype.rest = function() {
    return this.filter((e,idx) => 0 < idx)
}

function inc(arr, idx) {
    return modifyAtIdx(arr, idx, i => i+1)
}

function modifyAtIdx(arr, idx, modifier) {
    return arr.map((e,i) => i==idx?modifier(e):e)
}

function removeAtIdx(arr, idx) {
    return arr.filter((e,i) => i!=idx)
}

function compareObjects(l,r) {
    if (Array.isArray(l) && Array.isArray(r)) {
        if (l.length != r.length) {
            return false
        }
        for (let i = 0; i < l.length; i++) {
            if (!compareObjects(l[i],r[i])) {
                return false
            }
        }
        return true
    } else if (isObject(l) && isObject(r)) {
        const lProps = Object.getOwnPropertyNames(l).sort()
        const rProps = Object.getOwnPropertyNames(r).sort()
        if (!compareObjects(lProps,rProps)) {
            return false
        }
        for (const key of lProps) {
            if (!compareObjects(l[key],r[key])) {
                return false
            }
        }
        return true
    } else {
        return l === r
    }

}

function createObj(obj) {
    const self = {
        ...obj,
        set: (attr, value) => {
            // console.log(`Setting in object: attr = ${attr}, value = ${value}`)
            return createObj({...obj, [attr]: value})
        },
        attr: (...attrs) => attrs.reduce((o,a)=>({...o,[a]:obj[a]}), {}),
        map: mapper => {
            const newObj = mapper(self)
            if (isObject(newObj)) {
                return createObj(newObj)
            } else {
                return newObj
            }
        }
    }
    return self
}

function objectHolder(obj) {
    return {
        get: (attr) => attr?obj[attr]:obj,
        set: (attr, value) => {
            // console.log(`Setting in holder: attr = ${attr}, value = ${value}`)
            obj = obj.set(attr, value)
        },
        setObj: (newObj) => {
            obj = newObj
        },
        attr: (...attrs) => obj.attr(...attrs),
        map: mapper => obj = obj.map(mapper),
    }
}

function saveToLocalStorage(localStorageKey, value) {
    window.localStorage.setItem(localStorageKey, JSON.stringify(value))
}

function readFromLocalStorage(localStorageKey, defaultValue) {
    const item = window.localStorage.getItem(localStorageKey)
    return hasValue(item) ? JSON.parse(item) : defaultValue
}

function disableScrollOnMouseDown(event) {
    if(event.button==1){
        event.preventDefault()
    }
}

function createParamsGetter({prevState, params}) {
    return (name,defValue) => {
        const fromParams = params?.[name]
        if (fromParams !== undefined) {
            return fromParams
        }
        const fromPrevState = prevState?.[name]
        if (fromPrevState !== undefined) {
            return fromPrevState
        }
        return defValue
    }
}

const fileRwLog = createLogger(LOGGERS.fileReadWrite)

function writeStringToFile({file,string,isAppend,onDone, logger = fileRwLog}) {
    logger.trace(() => `start writeStringToFile for '${file}', isAppend=${isAppend}`)
    if (isInBrowser()) {
        logger.trace(() => `not writing to file '${file}' because in browser.`)
        onDone?.()
        return
    }
    const dirUrl = cordova?.file?.externalDataDirectory
    logger.trace(() => `window.resolveLocalFileSystemURL for '${dirUrl}' and file '${file}'`)
    window.resolveLocalFileSystemURL(dirUrl, function (dirEntry) {
        logger.trace(() => `dirEntry.getFile for '${file}'`)
        dirEntry.getFile(file, { create: true }, function (fileEntry) {
            logger.trace(() => `fileEntry.createWriter for '${file}'`)
            fileEntry.createWriter(function (fileWriter) {
                // con.info('#3')
                fileWriter.onwriteend = () => {
                    logger.trace(() => `File '${file}' was written successfully.`)
                    onDone?.()
                    logger.trace(() => `onDone() for file '${file}' finished.`)
                }

                fileWriter.onerror = function (err) {
                    logger.error(() => `fileWriter.onerror for file '${file}': ` + JSON.stringify(err))
                };

                const blob = new Blob([string], { type: 'text/plain' })
                logger.trace(() => `blob created for file '${file}'`)

                if (isAppend) {
                    fileWriter.seek(fileWriter.length)
                    logger.trace(() => `fileWriter.seek() done for file '${file}'`)
                }

                fileWriter.write(blob)
            });
        },
            err => {
                logger.error(() => `dirEntry.getFile error for file '${file}': ` + JSON.stringify(err))
            }
        );
    }, err => {
        logger.error(() => `resolveLocalFileSystemURL error for file '${file}': ` + JSON.stringify(err))
    });
}

function readStringFromFile({file, onLoad, onFileDoesntExist, logger = fileRwLog}) {
    logger.trace(() => `start readStringFromFile for '${file}'`)
    if (isInBrowser()) {
        logger.trace(() => `not reading file '${file}' because in browser.`)
        return
    }
    const dirUrl = cordova?.file?.externalDataDirectory
    logger.trace(() => `window.resolveLocalFileSystemURL for '${dirUrl}' and file '${file}'`)
    window.resolveLocalFileSystemURL(dirUrl, function (dirEntry) {
        logger.trace(() => `dirEntry.getFile for '${file}'`)
        dirEntry.getFile(file, {create: false}, function (fileEntry) {
                logger.trace(() => `fileEntry.file for '${file}'`)
                fileEntry.file(function (file) {
                    const reader = new FileReader()

                    reader.onload = function () {
                        logger.trace(() => `File '${file}' was read successfully.`)
                        onLoad(reader.result)
                        logger.trace(() => `onload() for file '${file}' finished.`)
                    }

                    reader.onerror = function (err) {
                        logger.error(() => `reader.readAsText error for file '${file}': ` + JSON.stringify(err))
                    }

                    reader.readAsText(file)

                }, err => {
                    logger.error(() => `Error fileEntry.file for file '${file}': ` + JSON.stringify(err))
                });
            },
            err => {
                if (err.code == 1/*NOT_FOUND_ERR*/) {
                    logger.trace(() => `File '${file}' doesn't exist.`)
                    onFileDoesntExist?.()
                    logger.trace(() => `onFileDoesntExist() for file '${file}' finished.`)
                } else {
                    logger.error(() => 'dirEntry.getFile error: ' + JSON.stringify(err))
                }
            }
        )
    }, err => {
        logger.error(() => 'resolveLocalFileSystemURL error: ' + JSON.stringify(err))
    });
}
