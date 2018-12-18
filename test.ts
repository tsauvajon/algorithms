// using JavaScript workers to run jobs an interrupt them when needed

enum Results {
  done = 0,
  error = 1
}

interface SentMessage {
  result: Results,
  message: string
}

interface ReceivedMessage extends MessageEvent {
  data: SentMessage
}

function fn2URL(fn: Function) {
  var blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithWorkers(sort: string | Function, elems: number, maxVal: number) {
  // var sortFn = typeof sort === 'string' ? window[sort] : sort
  var sortName = typeof sort === 'string' ? sort : sort.name
  
  elems = elems || 40
  maxVal = maxVal || 10000

  var worker = new Worker(fn2URL(run))

  var timeout = setTimeout(() => {
    worker.terminate()
    throw new Error(`timeout of 10 sec reached for ${sortName} [${elems} elems, values from 0 to ${maxVal}]`)
  }, 10 * 1000)

  var baseURL = window.location.href.split('/dist/')[0] + '/dist'

  worker.postMessage({ sort: sortName, elems, maxVal, baseURL })

  worker.onmessage = (msg: ReceivedMessage) => {
    worker.terminate()

    var { result, message } = msg.data
    switch (result) {
      case Results.done:
        console.log(message)
        break;
      case Results.error:
        throw new Error(message)
    }

    clearTimeout(timeout)
  }
}

var run = () => {
  // duplicate the definition inside the worker or it won't find it
  enum Results {
    done = 0,
    error = 1
  }

  var genRandomArray = (elems: number, maxVal: number) => Array.from({ length: elems }, () => Math.floor(Math.random() * maxVal))

  // doesn't work with a second string parameter
  // we override the definition with the actual one, using only one parameter
  // @ts-ignore: type definition is wrong
  var postMessage = (payload: SentMessage) => self.postMessage(payload)

  self.onmessage = (event) => {
    var { sort, elems, maxVal, baseURL } = event.data

    var files = [
      'quicksort.js',
      'bubblesort.js'
    ]

    files.forEach(f => console.log(`${baseURL}/${f}`))
    files.forEach(f => importScripts(`${baseURL}/${f}`))
  
    elems = elems || 40
    maxVal = maxVal || 10000

    var sortFn = self[sort]

    var sortName = sort
  
    var shuffled = genRandomArray(elems, maxVal)
    var sorted = [...shuffled]

    var start = performance.now()
    sortFn(sorted)
    var end = performance.now()

    if (!Array.isArray(sorted)) {
      var payload: SentMessage = {
        result: Results.error,
        message: `doesn't return an array`
      }
      return postMessage(payload)
    }
  
    if (shuffled.length !== sorted.length) {
      var payload: SentMessage = {
        result: Results.error,
        message: `the array changed length`
      }
      return postMessage(payload)
    }
  
    for (var i = 0; i < sorted.length - 1; i++) {
      if (sorted[i] > sorted[i+1]) {
        var payload: SentMessage = {
          result: Results.error,
          message: `this array isn't sorted !`
        }
        return postMessage(payload)
      }
    }

    var payload: SentMessage = {
      result: Results.done,
      message: `${sortName} passed in ${end - start} ms [${elems} elems, values from 0 to ${maxVal}]`
    }

    postMessage(payload)
  }
}
