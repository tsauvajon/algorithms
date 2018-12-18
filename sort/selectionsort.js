function selectionSort(array) {
  for (var i = 0; i < array.length; i++) {
    var min = array[i]
    var minIndex = i
    for (var j = i; j < array.length; j++) {
      if (array[j] < min) {
        min = array[j]
        minIndex = j
      }
    }
    [array[i], array[minIndex]] = [array[minIndex], array[i]]
  }
  return array;
}

var testSelection = () => simpleTest(selectionSort)
