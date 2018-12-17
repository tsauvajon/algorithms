function bubbleSort(array) {
  for (var i = 0; i < array.length; i++) {
    for (var j = 0; j < array.length - 1; j++) {
      if (array[j] > array[j+1]) {
        [array[j+1], array[j]] = [array[j], array[j+1]]
      }
    }
  }
  return array;
}

var testBubblesort = () => testWithWorkers(bubbleSort)
