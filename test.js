var genRandomArray = (length, maxVal) => Array.from({ length }, () => Math.floor(Math.random() * maxVal))

/*
  test generates a random shuffled array and sorts it with a sort function given
  as the first parameter. It checks that the sorted array is, indeed, sorted.

  sort: function or function name
  elems: number of elements in the test array
  maxVal: maximum value of the random numbers in the test array
*/
function test(sort, elems, maxVal) {
  var sortFn = typeof sort === 'string' ? window[sort] : sort
  var sortName = typeof sort === 'string' ? sort : sort.name

  elems = elems || 40
  maxVal = maxVal || 10000

  var shuffled = genRandomArray(elems, maxVal)
  var sorted = [...shuffled]

  var cancel = false

  // var timeout = setTimeout(() => {
  //   cancel = true
  //   throw new Error(`timeout of 10 sec reached for ${sortName} [${elems} elems, values from 0 to ${maxVal}]`)
  // }, 10 * 1000)

  var start = performance.now()
  sortFn(sorted, cancel)
  var end = performance.now()

  // clearTimeout(timeout)

  if (!Array.isArray(sorted)) {
    throw new Error(`doesn't return an array`)
  }

  if (shuffled.length !== sorted.length) {
    throw new Error(`the array changed length`)
  }

  for (var i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] > sorted[i+1]) {
      throw new Error(`this array isn't sorted !`)
    }
  }

  console.log(`${sortName} passed in ${end - start} ms [${elems} elems, values from 0 to ${maxVal}]`)
}

var benchmarkSettings = [
  {
    elems: 10,
    maxVal: 100
  }, 
  {
    elems: 1000,
    maxVal: 1000
  }, 
  {
    elems: 100000,
    maxVal: 1000
  }, 
  {
    elems: 1000000,
    maxVal: 1000000000
  }
]

var benchmark = sort => {
  benchmarkSettings.forEach(({ elems, maxVal }) => test(sort, elems, maxVal))
}

var benchmarkAll = () => window.benchmarkFns.forEach(fn => {
  try {
    benchmark(fn)
  } catch (e) {
    console.error(e)
  }
})
