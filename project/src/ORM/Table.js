"use strict";
exports.__esModule = true;
var utils_1 = require("../utils/utils"); //import tool
exports.Table = function (tableData) {
    return {
        tableData: tableData,
        Select: function () {
            var Props = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                Props[_i] = arguments[_i];
            }
            return exports.Table(tableData);
        },
        Commit: function () {
            return utils_1.map_table(tableData, utils_1.Fun(function (obj) {
                //T = {} somewhere between 0 and 1000
                //U = {} somewhere between 0 and 1000
                //i.e. T = {x,y,z} | U = {y,z}
                //obj = {x,y,z}
                var z = Object.getOwnPropertyNames(obj);
                var x = JSON.parse(JSON.stringify((Object.assign({}, obj))));
                var a = { "Id": 0 };
                for (var i = 0; i < z.length; i++) {
                    //https://stackoverflow.com/questions/28150967/typescript-cloning-object/42758108
                    //https://www.samanthaming.com/tidbits/70-3-ways-to-clone-objects/
                    // console.log(obj)
                    if (z[i] in a) {
                        console.log(x[z[i]]);
                    }
                }
                // [P in keyof T] : T[P] extends Condition ? P : never
                return null;
            }));
        }
    };
};
/*
 *notes
*/
//how to create the table SELECT for Props
//interface x = {y,z,i}
//possible selections = interface
//SELECTED {}
//FOR EACH SELECT remove possible selection
//i.e. SELECTED("y") == possible selection {z,i}
// T = {y,z, i} | U = { } | 
// T = {z,i } | U = { y } |
// z = T - U
// y = Props of type T(k) + U
