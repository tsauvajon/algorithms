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

var genRandomArray = (length: number, maxVal: number) => Array.from({ length }, () => Math.floor(Math.random() * maxVal))

function fn2URL(fn: Function) {
  var blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithWorkers(sort: string | Function, elems: number, maxVal: number) {
  var sortFn = typeof sort === 'string' ? window[sort] : sort
  var sortName = typeof sort === 'string' ? sort : sort.name
  
  elems = elems || 40
  maxVal = maxVal || 10000

  var worker = new Worker(fn2URL(run(sortFn)))

  var done = false

  worker.onmessage = (msg: ReceivedMessage) => {
    var { result, message } = msg.data
    switch (result) {
      case Results.done:
        console.log(message)
        break;
      case Results.error:
        throw new Error(message)
    }

    done = true
  }

  var timeout = setTimeout(() => {
    worker.terminate()
    throw new Error(`timeout of 10 sec reached for ${sortName} [${elems} elems, values from 0 to ${maxVal}]`)
  }, 10 * 1000)

  worker.postMessage({ elems, maxVal })

  while (!done) {
    await sleep(100)
  }
  
  clearTimeout(timeout)
}

var run = (sort: Function) => () => {
  self['sort'] = sort

  console.log('self: ', self['sort'])
  self.onmessage = (event) => {
    var { elems, maxVal } = event.data
  
    elems = elems || 40
    maxVal = maxVal || 10000
  
    var shuffled = genRandomArray(elems, maxVal)
    var sorted = [...shuffled]

    var start = performance.now()
    self['sort'](sorted)
    var end = performance.now()

    if (!Array.isArray(sorted)) {
      var payload: SentMessage = {
        result: Results.error,
        message: `doesn't return an array`
      }
      return postMessage(payload, 'workerAbcd')
    }
  
    if (shuffled.length !== sorted.length) {
      var payload: SentMessage = {
        result: Results.error,
        message: `the array changed length`
      }
      return postMessage(payload, 'workerAbcd')
    }
  
    for (var i = 0; i < sorted.length - 1; i++) {
      if (sorted[i] > sorted[i+1]) {
        var payload: SentMessage = {
          result: Results.error,
          message: `this array isn't sorted !`
        }
        return postMessage(payload, 'workerAbcd')
      }
    }

    var payload: SentMessage = {
      result: Results.done,
      message: `${self['sort'].name} passed in ${end - start} ms [${elems} elems, values from 0 to ${maxVal}]`
    }
  
    postMessage(payload, 'main')

    close()
  }
}
