## 2024-05-22 - JS Loops vs TypedArray.set
Learning: Manual loops over TypedArrays in V8 are significantly slower (~10x) than `set` + `subarray` for bulk copies, even for moderate sizes (D=640).
Action: Prefer `set` + `subarray` for contiguous memory copies in hot loops.
## 2024-05-24 - Unrolling Argmax over tokenLogits
Learning: The argmax loop over `tokenLogits` during transcription is a hot path where standard `for` loop overhead adds up significantly. An 8-way unrolled loop directly accessing elements reduces argmax execution time by roughly ~30-40% on V8 for vocabulary-sized arrays (~4000).
Action: Apply manual loop unrolling for simple scan operations over large TypedArrays in tight inner loops, avoiding extra local variables for best performance.
