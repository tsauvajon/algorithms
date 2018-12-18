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

interface TestInput {
  elems: number,
  maxVal: number,
  time: number
}

function fn2URL(fn: Function) {
  var blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var sec = 1000

var benchmarkInputs : Array<TestInput> = [
  {
    elems: 10,
    maxVal: 100,
    time: 1 * sec
  }, {
    elems: 1000,
    maxVal: 1000,
    time: 1 * sec
  }, {
    elems: 10000,
    maxVal: 1000000,
    time: 30 * sec
  }, {
    elems: 10000,
    maxVal: 10,
    time: 30 * sec
  }, {
    elems: 1000000,
    maxVal: 10000,
    time: 60 * sec
  }, {
    elems: 1000000,
    maxVal: 10,
    time: 60 * sec
  }
]

var benchmarkFns: Array<string | Function> = ['quickSort', 'bubbleSort']

var benchmark = async (sort: string | Function) => {
  for (var i = 0; i < benchmarkInputs.length; i++) {
    var { elems, maxVal, time } = benchmarkInputs[i]
    try {
      await testWithWorkers(sort, elems, maxVal, time)
    } catch (e) {
      console.error(e)
    }
  }
}

var benchmarkAll = async () => {
  for (var i = 0; i < benchmarkFns.length; i++) {
    console.log(`benchmarking ${benchmarkFns[i]}`)
    await benchmark(benchmarkFns[i])
  }
}

/*
  testWithWorkers will run the sort function with a worker, and kill it if it
  takes too much time.

  sort: function or function name
  elems: number of elements in the test array
  maxVal: maximum value of the random numbers in the test array
  time: number of ms before test fails
*/
async function testWithWorkers(sort: string | Function, elems: number = 40, maxVal: number = 10000, time: number = 60 * 1000) {
  var sortName = typeof sort === 'string' ? sort : sort.name
  
  var worker = new Worker(fn2URL(run))

  var baseURL: string
  
  try {
    baseURL = window.location.href.split('/dist/')[0] + '/dist'
  } catch {
    baseURL = ''
  }

  worker.postMessage({ sort: sortName, elems, maxVal, baseURL })

  var data: SentMessage

  var timeout = setTimeout(() => {
    data = {
      result: Results.error,
      message: `timeout of ${Math.floor(time / 1000)} sec reached for ${sortName} [${elems} - ${maxVal}]`
    }
  }, time)

  worker.onmessage = (msg: ReceivedMessage) => {
    clearTimeout(timeout)

    data = msg.data
  }

  // don't return before the worker is done or timer is reached
  while (!data) {
    await sleep(100)
  }

  worker.terminate()

  var { result, message } = data

  switch (result) {
    case Results.done:
      console.log(message)
      break;
    case Results.error:
      throw new Error(message)
  }
}

var run = () => {
  // duplicate the definition inside the worker or it won't find it
  enum Results {
    done = 0,
    error = 1
  }

  interface MessageArgs extends MessageEvent {
    data: {
      sort: string
      elems: number
      maxVal: number
      baseURL: string
    }
  }

  var genRandomArray = (elems: number, maxVal: number) => Array.from({ length: elems }, () => Math.floor(Math.random() * maxVal))

  // doesn't work (at all) with a second string parameter
  // we override the definition with the actual one, using only one parameter
  // @ts-ignore: type definition is wrong
  var postMessage = (payload: SentMessage) => self.postMessage(payload)

  // generates a random shuffled array and sorts it with a sort function given
  // as the first parameter. It checks that the sorted array is, indeed, sorted.
  self.onmessage = (event: MessageArgs) => {
    var { sort, elems, maxVal, baseURL } = event.data

    var files = {
      quickSort: 'quicksort.js',
      bubbleSort: 'bubblesort.js'
    }

    importScripts(`${baseURL}/${files[sort]}`)

    var sortFn = self[sort]

    var sortName = sort
  
    var shuffled = genRandomArray(elems, maxVal)
    var sorted = [...shuffled]

    var start = performance.now()
    try {
      sortFn(sorted)
    } catch (e) {
      var payload: SentMessage = {
        result: Results.error,
        message: `threw the exception ${e}`
      }
      return postMessage(payload)
    }
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
      message: `${sortName} passed in ${end - start} ms [${elems} - ${maxVal}]`
    }

    postMessage(payload)
  }
}
