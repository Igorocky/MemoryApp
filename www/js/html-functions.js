'use strict';

function button({onClick, text}) {
    const btn = document.createElement('button')
    if (hasValue(text)) {
        btn.textContent=text
    }
    if (hasValue(onClick)) {
        btn.addEventListener('click', onClick)
    }
    return btn
}

function button2({onClick, text}) {
    return el('button',{onclick:onClick, textContent:text})
}

function el(tag,attrs,...children) {
    const elem = document.createElement(tag)
    for (let attr in attrs) {
        elem[attr]=attrs[attr]
    }
    for (let child in children) {
        elem.appendChild(child)
    }
    return elem
}