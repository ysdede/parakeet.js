## 2024-05-22 - incremental-mel-allocations
Learning: IncrementalMelProcessor was allocating new Float32Arrays for every chunk (rawMel and features), causing GC pressure in streaming. Double-buffering rawMel handles variable frame counts safely while enabling reuse.
Action: Consider extending buffer reuse to ParakeetModel's encoder outputs and other intermediate tensors if memory profiling shows further GC hotspots.
