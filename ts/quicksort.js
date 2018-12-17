function quickSort(array) {
  qs(array, 0, array.length - 1)
  return array;
}

function qs(arr, low, high) {
  if (low > high) return

  var pivot = partition(arr, low, high)
  qs(arr, pivot + 1, high)
  qs(arr, low, pivot - 1)
}

function partition(arr, low, high) {
  var left = low + 1
  var right = high

  while (true) {
    for (; left <= right && arr[left] <= arr[low]; left++) {}
    for (; left <= right && arr[right] >= arr[low]; right--) {}

    if (right < left) break

    [arr[left], arr[right]] = [arr[right], arr[left]]
  }

  [arr[right], arr[low]] = [arr[low], arr[right]]
  return right
}

var testBubblesort = () => testWithWorkers(quickSort)
