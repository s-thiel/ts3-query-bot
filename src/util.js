'use strict';

/**
 * 
 * @param {*} arr1 
 * @param {*} arr2 
 */
function arrayDifference(arr1, arr2) {
    let difference = arr1.filter(x => !arr2.includes(x));
    return difference;
}

module.exports = { arrayDifference };