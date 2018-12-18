var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// using JavaScript workers to run jobs an interrupt them when needed
var Results;
(function (Results) {
    Results[Results["done"] = 0] = "done";
    Results[Results["error"] = 1] = "error";
})(Results || (Results = {}));
function fn2URL(fn) {
    var blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function testWithWorkers(sort, elems, maxVal) {
    return __awaiter(this, void 0, void 0, function* () {
        // var sortFn = typeof sort === 'string' ? window[sort] : sort
        var sortName = typeof sort === 'string' ? sort : sort.name;
        elems = elems || 40;
        maxVal = maxVal || 10000;
        var worker = new Worker(fn2URL(run));
        var timeout = setTimeout(() => {
            worker.terminate();
            throw new Error(`timeout of 10 sec reached for ${sortName} [${elems} elems, values from 0 to ${maxVal}]`);
        }, 10 * 1000);
        var baseURL = window.location.href.split('/dist/')[0] + '/dist';
        worker.postMessage({ sort: sortName, elems, maxVal, baseURL });
        worker.onmessage = (msg) => {
            worker.terminate();
            var { result, message } = msg.data;
            switch (result) {
                case Results.done:
                    console.log(message);
                    break;
                case Results.error:
                    throw new Error(message);
            }
            clearTimeout(timeout);
        };
    });
}
var run = () => {
    // duplicate the definition inside the worker or it won't find it
    let Results;
    (function (Results) {
        Results[Results["done"] = 0] = "done";
        Results[Results["error"] = 1] = "error";
    })(Results || (Results = {}));
    var genRandomArray = (elems, maxVal) => Array.from({ length: elems }, () => Math.floor(Math.random() * maxVal));
    // doesn't work with a second string parameter
    // we override the definition with the actual one, using only one parameter
    // @ts-ignore: type definition is wrong
    var postMessage = (payload) => self.postMessage(payload);
    self.onmessage = (event) => {
        var { sort, elems, maxVal, baseURL } = event.data;
        var files = [
            'quicksort.js',
            'bubblesort.js'
        ];
        files.forEach(f => console.log(`${baseURL}/${f}`));
        files.forEach(f => importScripts(`${baseURL}/${f}`));
        elems = elems || 40;
        maxVal = maxVal || 10000;
        var sortFn = self[sort];
        var sortName = sort;
        var shuffled = genRandomArray(elems, maxVal);
        var sorted = [...shuffled];
        var start = performance.now();
        sortFn(sorted);
        var end = performance.now();
        if (!Array.isArray(sorted)) {
            var payload = {
                result: Results.error,
                message: `doesn't return an array`
            };
            return postMessage(payload);
        }
        if (shuffled.length !== sorted.length) {
            var payload = {
                result: Results.error,
                message: `the array changed length`
            };
            return postMessage(payload);
        }
        for (var i = 0; i < sorted.length - 1; i++) {
            if (sorted[i] > sorted[i + 1]) {
                var payload = {
                    result: Results.error,
                    message: `this array isn't sorted !`
                };
                return postMessage(payload);
            }
        }
        var payload = {
            result: Results.done,
            message: `${sortName} passed in ${end - start} ms [${elems} elems, values from 0 to ${maxVal}]`
        };
        postMessage(payload);
    };
};
//# sourceMappingURL=test.js.map