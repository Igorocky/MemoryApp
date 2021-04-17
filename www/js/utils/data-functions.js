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

function nextRandomElem({allElems,counts}) {
    const elemsWithCnt = allElems.map(elem => ({...elem, cnt:counts[elem.idx]}))
    const minCnt = elemsWithCnt.attr('cnt').min()
    const elemsWithMinCnt = elemsWithCnt.filter(elem => elem.cnt == minCnt)
    return elemsWithMinCnt[randomInt(0,elemsWithMinCnt.length-1)]
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

function writeStringToFile({file,string}) {
    // console.log({file,string})
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function (dirEntry) {
        // con.info('#1')
        // con.info(`externalDataDirectory: ${dirEntry}`)
        dirEntry.getFile(file, { create: true }, function (fileEntry) {
            // con.info('#2')
            fileEntry.createWriter(function (fileWriter) {
                // con.info('#3')
                fileWriter.onwriteend = function (e) {
                    // con.info('#4')
                    // con.info('Write completed.');
                };

                fileWriter.onerror = function (e) {
                    // con.info('#5')
                    // con.info('Write failed: ' + e.toString());
                };

                // Create a new Blob and write it to log.txt.
                var blob = new Blob([string], { type: 'text/plain' });

                fileWriter.write(blob);
                // con.info('#6')

            });
        });
    }, e => {
        // con.error(e.message)
    });
}

function readStringFromFile({file, onLoad}) {
    // console.log({file})
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function (dirEntry) {
        // con.info('##1')
        // con.info(`externalDataDirectory: ${dirEntry}`)
        dirEntry.getFile(file, { create: true }, function (fileEntry) {
            // con.info('##2')
            fileEntry.file(function (file) {
                const reader = new FileReader()

                reader.onloadend = function() {
                    // con.info("Successful file read: " + this.result);
                    // con.info('##3')
                    onLoad(this.result)
                };

                reader.readAsText(file)

            }, e => {
                // con.error('Error fileEntry.file: ' + e.message)
            });
        });
    }, e => {
        // con.error('Error resolveLocalFileSystemURL: ' + e.message)
    });
}