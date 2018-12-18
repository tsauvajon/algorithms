var simpleTest = (fn) => {
  var shuffled = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000))
  var sorted = [...shuffled]
  fn(sorted)

  if (!Array.isArray(sorted)) {
    console.log(shuffled)
    console.log(sorted)
    return console.error('not an array')
  }

  if (shuffled.length !== sorted.length) {
    console.log(shuffled)
    console.log(sorted)
    return console.error('the array changed length')
  }

  for (var i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] > sorted[i+1]) {
      console.log(shuffled)
      console.log(sorted)
      return console.error('not sorted')
    }
  }

  console.log('ok !')
}
