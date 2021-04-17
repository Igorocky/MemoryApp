'use strict';

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
