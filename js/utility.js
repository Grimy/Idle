"use strict";

Math.triangular = function (value) {
    let abs = Math.abs(value);
    return ((abs / 2) * (abs + 1)) * (abs / value) || 0;
};

const Utility = Object.freeze({
    getRandomInt : function(minIncl, maxExcl) {
        return Math.floor(Math.random() * (maxExcl - minIncl) + minIncl);
    },
    getFormattedTime : function(ms) {
        let d, h, m, s;

        s = Math.floor(ms / 1000);
        m = Math.floor(s / 60);
        s = s % 60;
        h = Math.floor(m / 60);
        m = m % 60;
        d = Math.floor(h / 24);
        h = h % 24;

        return d + ":" + (h<10?"0"+h:h) + ":" + (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s);
    },
    swapClass : function(prefix, newClass, elem) {
        if (elem == null) {
            console.warn("swapClass", "no element found. Prefix: " + prefix + ", newClass: " + newClass);
            return;
        }
        var className = elem.className;
        if (typeof className.split('newClass')[1] !== 'undefined') return;
        className = className.split(prefix);
        if(typeof className[1] === 'undefined') {
            console.warn("swapClass", "tried to replace a class that doesn't exist at [" + elem.className + "] using " + prefix + " as prefix and " + newClass + " as target class.");
            elem.className += " " + newClass;
            return;
        }
        var classEnd = className[1].indexOf(' ');
        if (classEnd >= 0)
            className = className[0] + newClass + className[1].slice(classEnd, className[1].length);
        else
            className = className[0] + newClass;
        elem.className = className;
    },
    prettify : function(val) {
        return Math.ceil(val * 100) / 100;
    },
    getProgressBarTransformCSS : function(number, maxNumber) {
        return "translateX(-" + (100 - Math.ceil(number / maxNumber * 100)) + "%)";
    },
    convertRatioToAddToNumber(array, total) {
		var wrongTotal = 0;
		for(var i = 0; i < array.length; i++)
			wrongTotal += array[i];
		
		var multiplier = total / wrongTotal;
		
		var newArray = [];
		for(var i = 0; i < array.length; i++)
			newArray[i] = array[i] * multiplier;
		
		return newArray;
	}
});