# HistoryManager (Target paper) 
Stores up to n amount of history entry with a rolling window
prints latest history on demand


# ExecutionManager (Muzzle) 
Immediately fires a fn when receives one and displays itself busy.
When the function fails or returnes as done, it frees up itself and pushes the result to history.


# DelayHandler (Delay chamber)

chamber(fn,delay)
- Immediately starts executing delay, when delay finishes push fn to execution chamber

dechamber()
removes fn if it is chambered

# Main (Magazine)

- This is where the app pushes the fns.

* _cycle(): 
- If the pushed function is the only one, magazine checks if the Delay Chamber is empty. If it's empty it pushes the first function in the queue to the delay chamber


* (external) push():
Adds a function to the magazine.
Calls Cycle()



