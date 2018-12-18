function insertionSort(array) {
  for (var i = 0; i < array.length; i++) {
    for (var j = i; j > 0; j--) {
      if (array[j-1] > array[j]) {
        [array[j-1], array[j]] = [array[j], array[j-1]]
      }
    }
  }
  return array;
}

var testInsertion = () => simpleTest(insertionSort)
